<script lang="ts">
	import { onMount } from 'svelte';
	import { actState } from '../../state/actState.svelte';
	import { uiState } from '../../state/uiState.svelte';
	import { selectionState } from '../../stores/selectionStore';
	import { dropTarget } from '../../utils/dragDropUtils';
	import BeatCell from './BeatCell.svelte';
	import StepLabel from './StepLabel.svelte';

	// Props using Svelte 5 runes
	const { onresize, onscroll } = $props<{
		onresize?: (event: { cellSize: number; width?: number; height?: number }) => void;
		onscroll?: (event: { scrollTop: number }) => void;
	}>();

	// Grid dimensions
	const COLUMNS = 8;
	const ROWS = 24;

	let gridElement = $state<HTMLDivElement>();
	let gridWidth = $state(0);
	let gridHeight = $state(0);
	let resizeObserver = $state<ResizeObserver>();

	// Calculate responsive cell size based on container dimensions
	const responsiveCellSize = $derived(
		gridWidth > 0
			? Math.floor((gridWidth - (COLUMNS + 1)) / COLUMNS) // Always use full width
			: 80 // Default fallback
	);

	// Effect to dispatch resize event when cell size changes
	$effect(() => {
		if (responsiveCellSize && onresize) {
			onresize({
				cellSize: responsiveCellSize
			});
		}
	});

	// Set up resize observer to track container size changes
	onMount(() => {
		if (gridElement && typeof ResizeObserver !== 'undefined') {
			resizeObserver = new ResizeObserver((entries) => {
				const entry = entries[0];
				if (entry) {
					gridWidth = entry.contentRect.width;
					gridHeight = entry.contentRect.height;

					// Call resize callback to synchronize with CueScroll
					onresize?.({
						width: gridWidth,
						height: gridHeight,
						cellSize: responsiveCellSize
					});
				}
			});

			resizeObserver.observe(gridElement);

			return () => {
				if (resizeObserver) {
					resizeObserver.disconnect();
				}
			};
		}
	});

	// Handle scroll events
	function handleScroll() {
		if (gridElement) {
			onscroll?.({ scrollTop: gridElement.scrollTop });
		}
	}

	// Handle drop events
	function handleDrop(event: DragEvent, data: any) {
		// Get the drop target
		const target = event.target as HTMLElement;
		const beatCell = target.closest('.beat-cell');

		if (!beatCell) return;

		// Get the row and column from the data attributes
		const row = parseInt(beatCell.getAttribute('data-row') || '0', 10);
		const col = parseInt(beatCell.getAttribute('data-col') || '0', 10);

		// Use the data from the drop event
		if (data) {
			actState.populateFromDrop(data, row, col);
		}
	}

	// Handle cell selection
	function handleCellClick(event: { row: number; col: number }) {
		const { row, col } = event;
		selectionState.selectBeat(row, col);
	}

	// Sync scroll position when the UI state updates
	$effect(() => {
		if (gridElement && uiState.beatGridScroll !== undefined) {
			gridElement.scrollTop = uiState.beatGridScroll;
		}
	});
</script>

<div
	class="beat-grid"
	bind:this={gridElement}
	onscroll={handleScroll}
	use:dropTarget={{
		acceptedTypes: ['application/sequence-data'],
		dropEffect: 'copy',
		onDrop: handleDrop
	}}
>
	<div class="grid-container" style="--columns: {COLUMNS};">
		{#each Array(ROWS) as _, rowIndex}
			{#each Array(COLUMNS) as _, colIndex}
				<div class="beat-cell-wrapper" style="--row: {rowIndex}; --col: {colIndex};">
					<BeatCell
						row={rowIndex}
						col={colIndex}
						beat={actState.act.sequences[rowIndex]?.beats[colIndex]}
						onclick={handleCellClick}
					/>

					{#if colIndex === 0}
						<StepLabel
							row={rowIndex}
							col={colIndex}
							label={actState.act.sequences[rowIndex]?.beats[colIndex]?.step_label || ''}
						/>
					{/if}
				</div>
			{/each}
		{/each}
	</div>
</div>

<style>
	.beat-grid {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		background-color: #1a1a1a;
	}

	.grid-container {
		display: grid;
		grid-template-columns: repeat(var(--columns), 1fr); /* Use 1fr instead of fixed size */
		grid-auto-rows: minmax(var(--cell-size), auto); /* Allow rows to grow if needed */
		gap: 1px;
		padding: 1px;
		width: 100%; /* Always take full width */
		background-color: #333;
	}

	.beat-cell-wrapper {
		position: relative;
		grid-row: calc(var(--row) + 1);
		grid-column: calc(var(--col) + 1);
		background-color: #1a1a1a;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.grid-container {
			--cell-size: 60px;
		}
	}

	@media (max-width: 480px) {
		.grid-container {
			--cell-size: 50px;
		}
	}
</style>
