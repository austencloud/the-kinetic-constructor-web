<!-- src/lib/components/SequenceWorkbench/BeatFrame/BeatFrame.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { useResizeObserver } from '$lib/composables/useResizeObserver';
	import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';
	import { autoAdjustLayout, calculateCellSize } from './beatFrameHelpers';
	import { selectedStartPos } from '$lib/stores/sequence/selectionStore';
	import type { PictographData } from '$lib/types/PictographData';
	import type { BeatData as LegacyBeatData } from './BeatData';
	import { browser } from '$app/environment';
	import { initDevToolsUpdater, updateDevTools } from '$lib/utils/devToolsUpdater';
	import { layoutStore } from '$lib/stores/layout/layoutStore';

	// Import the sequence container and integration utilities
	import { sequenceContainer } from '$lib/state/stores/sequenceStore';
	import { useContainer } from '$lib/state/core/svelte5-integration.svelte';

	// Helper function for safe logging of reactive state
	function safeLog(message: string, data: any) {
		if (import.meta.env.DEV) {
			// Use $state.snapshot to avoid Svelte 5 proxy warnings
			console.log(message, data instanceof Object ? $state.snapshot(data) : data);
		}
	}

	// Components
	import StartPosBeat from './StartPosBeat.svelte';
	import AnimatedBeat from './AnimatedBeat.svelte';
	import ReversalGlyph from './ReversalGlyph.svelte';
	import EmptyStartPosLabel from './EmptyStartPosLabel.svelte';
	import { isSequenceEmpty } from '$lib/state/machines/sequenceMachine/persistence';

	// Use Svelte 5 runes for reactive state
	const { size: sizeStore, resizeObserver } = useResizeObserver({
		width: browser ? window.innerWidth : 800,
		height: browser ? window.innerHeight : 600
	});

	// Convert the size store to a reactive value
	const size = $derived({
		width: $sizeStore?.width || 0,
		height: $sizeStore?.height || 0
	});

	// Use the sequence container with Svelte 5 runes
	const sequence = useContainer(sequenceContainer);

	// Local state
	let startPosition = $state<PictographData | null>(null);
	let beatRows = $state(1);
	let beatCols = $state(1);
	let prevRows = $state(1);
	let prevCols = $state(1);
	let cellSize = $state(100);

	// Derived values
	const beats = $derived(convertContainerBeatsToLegacyFormat(sequence.beats));
	const selectedBeatIds = $derived(sequence.selectedBeatIds);
	const selectedBeatIndex = $derived(
		selectedBeatIds.length > 0 ? beats.findIndex((beat) => beat.id === selectedBeatIds[0]) : -1
	);
	const beatCount = $derived(beats.length);

	// Check if the layout is in portrait mode
	let isPortraitLayout = $state(false);
	$effect(() => {
		// Get the layout orientation from the layoutStore
		const unsubscribe = layoutStore.subscribe((layout) => {
			// If rows > cols, it's portrait orientation
			isPortraitLayout = layout.rows > layout.cols;
		});

		return () => {
			unsubscribe();
		};
	});

	// Subscribe to isSequenceEmpty store
	let sequenceIsEmpty = $state(true);
	$effect(() => {
		const unsubscribe = isSequenceEmpty.subscribe((value) => {
			sequenceIsEmpty = value;
		});

		return () => {
			unsubscribe();
		};
	});

	// Create start position beat data
	const startPosBeatData = $derived({
		beatNumber: 0,
		filled: !!startPosition,
		pictographData: startPosition || defaultPictographData
	});

	// Convert container beats to legacy BeatData format
	function convertContainerBeatsToLegacyFormat(containerBeats: any[]): LegacyBeatData[] {
		return containerBeats.map((beat) => {
			// Create a proper pictographData object from the container beat data
			const pictographData = {
				letter: beat.metadata?.letter || null,
				startPos: beat.metadata?.startPos || null,
				endPos: beat.metadata?.endPos || null,
				gridMode: beat.metadata?.gridMode || 'diamond',
				redPropData: beat.redPropData || null,
				bluePropData: beat.bluePropData || null,
				redMotionData: beat.redMotionData || null,
				blueMotionData: beat.blueMotionData || null,
				redArrowData: beat.redArrowData || null,
				blueArrowData: beat.blueArrowData || null,
				grid: beat.metadata?.grid || ''
			};

			return {
				id: beat.id,
				beatNumber: beat.number,
				filled: true, // Assume filled if it exists in the container
				pictographData,
				duration: 1, // Default duration
				metadata: beat.metadata
			} as LegacyBeatData;
		});
	}

	// Get the initial value from the selectedStartPos store
	onMount(() => {
		// One-time subscription to get the initial value
		const unsubscribe = selectedStartPos.subscribe((newStartPos) => {
			if (newStartPos && !startPosition) {
				// Create a deep copy to avoid reference issues
				startPosition = JSON.parse(JSON.stringify(newStartPos));
				// Log using our safe logging helper (only in dev mode)
				safeLog('BeatFrame: Initialized startPosition with:', startPosition);
			}
		});

		// Immediately unsubscribe to prevent further updates
		unsubscribe();
	});

	// Calculate layout based on beat count
	$effect(() => {
		// Always ensure at least one row for the start position beat
		[beatRows, beatCols] = autoAdjustLayout(Math.max(1, beatCount));

		// Check if the layout has changed
		if (beatRows !== prevRows || beatCols !== prevCols) {
			// Log layout changes
			safeLog(`Layout changed`, { from: `${prevRows}x${prevCols}`, to: `${beatRows}x${beatCols}` });

			// Update the layout store
			layoutStore.updateLayout(beatRows, beatCols, beatCount);

			// Update previous values
			prevRows = beatRows;
			prevCols = beatCols;

			// Dispatch a custom event for layout changes
			const event = new CustomEvent('layout-changed', {
				bubbles: true,
				detail: {
					rows: beatRows,
					cols: beatCols,
					beatCount,
					previousLayout: { rows: prevRows, cols: prevCols }
				}
			});
			document.dispatchEvent(event);
		}
	});

	// Calculate cell size based on container dimensions
	$effect(() => {
		cellSize = calculateCellSize(
			beatCount,
			size.width,
			size.height,
			beatRows,
			beatCols + 1, // Add 1 for start position column
			0 // No gap
		);
	});

	// Initialize dev tools and set up event listeners
	onMount(() => {
		// Initialize dev tools updater
		if (browser) {
			initDevToolsUpdater();
		}

		// Listen for the custom event when a start position is selected
		const handleStartPosSelected = (event: CustomEvent) => {
			if (event.detail?.startPosition) {
				// Log the received start position (only in dev mode)
				safeLog(
					'BeatFrame: Received start-position-selected event with data:',
					event.detail.startPosition
				);

				// Create a deep copy to avoid reference issues
				const newStartPos = JSON.parse(JSON.stringify(event.detail.startPosition));

				// Update the local state
				startPosition = newStartPos;

				// Update the store (but don't subscribe to its changes to avoid loops)
				selectedStartPos.set(newStartPos);
			}
		};

		document.addEventListener('start-position-selected', handleStartPosSelected as EventListener);

		// Set up an interval to periodically update dev tools
		const intervalId = setInterval(() => {
			updateDevTools();
		}, 1000);

		return () => {
			document.removeEventListener(
				'start-position-selected',
				handleStartPosSelected as EventListener
			);
			clearInterval(intervalId);
		};
	});

	// Event handlers
	function handleStartPosBeatClick() {
		// Deselect current beat - clear all selections

		// Dispatch a custom event to trigger the start position selector
		// Create a deep copy of startPosition to avoid reference issues
		const startPosCopy = startPosition ? JSON.parse(JSON.stringify(startPosition)) : null;

		const event = new CustomEvent('select-start-pos', {
			bubbles: true,
			detail: { currentStartPos: startPosCopy }
		});
		document.dispatchEvent(event);
	}

	function handleBeatClick(beatIndex: number) {
		// Get the beat ID from the index
		if (beatIndex >= 0 && beatIndex < beats.length) {
			const beat = beats[beatIndex];
			const beatId = beat.id;

			// Log detailed information about the beat being selected
			safeLog('Selecting beat', {
				index: beatIndex,
				beatNumber: beat.beatNumber,
				id: beatId,
				gridLayout: `${beatRows}x${beatCols}`,
				position: {
					row: Math.floor(beatIndex / beatCols) + 1,
					col: (beatIndex % beatCols) + 1
				},
				motionTypes: {
					red: beat.pictographData?.redMotionData?.motionType || 'none',
					blue: beat.pictographData?.blueMotionData?.motionType || 'none'
				}
			});

			if (beatId) {
				sequenceContainer.selectBeat(beatId);
			}
		}
	}

	// Public methods that can be called from parent components
	export function addBeat(beatData: LegacyBeatData) {
		// Ensure the beat has an ID
		const beatWithId = beatData.id ? beatData : { ...beatData, id: crypto.randomUUID() };

		// Convert from legacy BeatData to container BeatData format
		const containerBeat = {
			id: beatWithId.id || crypto.randomUUID(), // Ensure ID is never undefined
			number: beatWithId.beatNumber,
			redPropData: beatWithId.pictographData.redPropData,
			bluePropData: beatWithId.pictographData.bluePropData,
			redMotionData: beatWithId.pictographData.redMotionData,
			blueMotionData: beatWithId.pictographData.blueMotionData,
			redArrowData: beatWithId.pictographData.redArrowData,
			blueArrowData: beatWithId.pictographData.blueArrowData,
			metadata: {
				...beatWithId.metadata,
				letter: beatWithId.pictographData.letter,
				startPos: beatWithId.pictographData.startPos,
				endPos: beatWithId.pictographData.endPos,
				gridMode: beatWithId.pictographData.gridMode
			}
		};

		// Add the beat to the sequence container
		sequenceContainer.addBeat(containerBeat as any); // Use type assertion to bypass TypeScript error
	}

	// Add a method to clear beats (could be called from parent)
	export function clearBeats() {
		// Use the sequence container to clear the sequence
		sequenceContainer.setSequence([]);
	}
</script>

<div use:resizeObserver class="beat-frame-container scrollable">
	<div
		class="beat-frame"
		style="--total-rows: {beatRows}; --total-cols: {beatCount === 0
			? 1
			: beatCols + 1}; --cell-size: {cellSize}px;"
	>
		{#each Array(beatRows) as _, rowIndex}
			{#if rowIndex === 0}
				<div class="beat-container start-position" style="grid-row: 1; grid-column: 1;">
					{#if sequenceIsEmpty}
						<EmptyStartPosLabel onClick={handleStartPosBeatClick} />
					{:else}
						<StartPosBeat beatData={startPosBeatData} onClick={handleStartPosBeatClick} />
					{/if}
				</div>
			{/if}

			{#each Array(beatCols) as _, colIndex}
				{#if rowIndex * beatCols + colIndex < beats.length}
					{@const beatIndex = rowIndex * beatCols + colIndex}
					{@const beat = beats[beatIndex]}

					{#key beat.id}
						<div
							class="beat-container"
							class:selected={selectedBeatIndex === beatIndex}
							style="grid-row: {rowIndex + 1}; grid-column: {colIndex + (beatCount === 0 ? 1 : 2)};"
						>
							<AnimatedBeat
								{beat}
								onClick={() => handleBeatClick(beatIndex)}
								isSelected={selectedBeatIndex === beatIndex}
							/>

							{#if beat.metadata?.blueReversal || beat.metadata?.redReversal}
								<div class="reversal-indicator">
									<ReversalGlyph
										blueReversal={beat.metadata?.blueReversal || false}
										redReversal={beat.metadata?.redReversal || false}
									/>
								</div>
							{/if}
						</div>
					{/key}
				{/if}
			{/each}
		{/each}
	</div>
</div>

<style>
	.beat-frame-container {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		/* align-items: center; by default, changed by .scrollable */
		overflow: hidden; /* Default, overridden by .scrollable */
		position: relative;
	}

	.scrollable {
		overflow-y: auto;
		overflow-x: hidden;
		align-items: flex-start; /* Content will align to the top when scrollable */
	}

	.beat-frame {
		display: grid;
		grid-template-columns: repeat(var(--total-cols), var(--cell-size));
		grid-template-rows: repeat(var(--total-rows), var(--cell-size));
		gap: 0; /* No gap between cells */
		justify-content: center;
		align-content: center; /* Default, overridden by .scrollable .beat-frame:not(:only-child) */
		width: fit-content;
		height: fit-content;
		margin: auto;
		/* Add transition for smooth size changes */
		transition: all 0.3s ease;
	}

	/* Only align to top when scrolling and there are beats */
	.scrollable .beat-frame:not(:only-child) {
		align-content: start;
	}

	.beat-container {
		position: relative;
		width: var(--adjusted-cell-size, var(--cell-size));
		height: var(--adjusted-cell-size, var(--cell-size));
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: transparent;
		/* Add transition for smooth size changes */
		transition:
			width 0.3s ease,
			height 0.3s ease;
		/* Ensure content is properly centered */
		box-sizing: border-box;
		/* Prevent overflow */
		overflow: hidden;
	}

	/* Specific styling for start position when it's the only beat */
	.beat-container.start-position:only-child {
		justify-self: center;
		align-self: center;
	}

	.reversal-indicator {
		position: absolute;
		bottom: 5px;
		right: 5px;
		z-index: 2;
	}
</style>

