<!-- src/lib/components/SequenceWorkbench/SequenceBeatFrame/BeatGrid.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { BeatData } from './BeatData';
	import type { PictographData } from '$lib/types/PictographData';
	import BeatContainer from './BeatContainer.svelte';
	import StartPosBeat from './StartPosBeat.svelte';

	// Props
	export let beats: BeatData[] = [];
	export let selectedBeatIndex: number = -1;
	export let startPosition: PictographData | null = null;
	export let beatRows: number = 1;
	export let beatCols: number = 1;
	export let cellSize: number = 80;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		'beat-click': { beatIndex: number };
		'start-pos-click': void;
	}>();

	// Computed properties
	$: beatCount = beats.length;
	$: startPosBeatData = {
		beatNumber: 0,
		filled: !!startPosition,
		pictographData: startPosition as PictographData
	};

	// Event handlers
	function handleBeatClick(beatIndex: number) {
		dispatch('beat-click', { beatIndex });
	}

	function handleStartPosBeatClick() {
		dispatch('start-pos-click');
	}
</script>

<div
	class="beat-frame"
	style="--total-rows: {beatRows}; --total-cols: {beatCount === 0
		? 1
		: beatCols + 1}; --cell-size: {cellSize}px;"
>
	{#each Array(beatRows) as _, rowIndex}
		{#if rowIndex === 0}
			<div class="beat-container start-position" style="grid-row: 1; grid-column: 1;">
				<StartPosBeat beatData={startPosBeatData} onClick={handleStartPosBeatClick} />
			</div>
		{/if}

		{#each Array(beatCols) as _, colIndex}
			{#if rowIndex * beatCols + colIndex < beats.length}
				{@const beatIndex = rowIndex * beatCols + colIndex}
				{@const beat = beats[beatIndex]}

				{#key beat.id}
					<BeatContainer
						{beat}
						isSelected={selectedBeatIndex === beatIndex}
						gridRow={rowIndex + 1}
						gridColumn={colIndex + (beatCount === 0 ? 1 : 2)}
						onClick={() => handleBeatClick(beatIndex)}
					/>
				{/key}
			{/if}
		{/each}
	{/each}
</div>

<style>
	.beat-frame {
		display: grid;
		grid-template-columns: repeat(var(--total-cols), var(--cell-size));
		grid-template-rows: repeat(var(--total-rows), var(--cell-size));
		gap: 0; /* No gap between cells */
		justify-content: center;
		align-content: center;
		width: fit-content;
		height: fit-content;
		margin: auto;
		/* Add transition for smooth size changes */
		transition: all 0.3s ease;
	}

	/* Only align to top when scrolling and there are beats */
	:global(.scrollable) .beat-frame:not(:only-child) {
		align-content: start;
	}

	.beat-container.start-position {
		position: relative;
		width: var(--adjusted-cell-size, var(--cell-size));
		height: var(--adjusted-cell-size, var(--cell-size));
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: transparent;
		transition:
			width 0.3s ease,
			height 0.3s ease;
		box-sizing: border-box;
		overflow: hidden;
	}

	/* Specific styling for start position when it's the only beat */
	.beat-container.start-position:only-child {
		justify-self: center;
		align-self: center;
	}
</style>
