<!-- src/lib/components/SequenceWorkbench/BeatFrame/BeatFrameGrid.svelte -->
<script lang="ts">
	import StartPosBeat from './StartPosBeat.svelte';
	import AnimatedBeat from './AnimatedBeat.svelte';
	import ReversalGlyph from './ReversalGlyph.svelte';
	import EmptyStartPosLabel from './EmptyStartPosLabel.svelte';

	// Props
	const {
		beatRows,
		beatCols,
		cellSize,
		beats,
		selectedBeatIndex,
		// sequenceIsEmpty is no longer used directly - we check startPosBeatData.filled instead
		startPosBeatData,
		beatCount,
		onStartPosBeatClick,
		onBeatClick
	} = $props<{
		beatRows: number;
		beatCols: number;
		cellSize: number;
		beats: any[];
		selectedBeatIndex: number;
		sequenceIsEmpty: boolean; // Keep in the type definition for backward compatibility
		startPosBeatData: any;
		beatCount: number;
		onStartPosBeatClick: () => void;
		onBeatClick: (beatIndex: number) => void;
	}>();
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
				{#if startPosBeatData && startPosBeatData.filled}
					<!-- Show the start position if we have one, regardless of sequence empty state -->
					<StartPosBeat beatData={startPosBeatData} onClick={onStartPosBeatClick} />
				{:else}
					<!-- Only show the empty label if we don't have a start position -->
					<EmptyStartPosLabel onClick={onStartPosBeatClick} />
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
							onClick={() => onBeatClick(beatIndex)}
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

<style>
	.beat-frame {
		display: grid;
		grid-template-columns: repeat(var(--total-cols), var(--cell-size));
		grid-template-rows: repeat(var(--total-rows), var(--cell-size));
		gap: 0; /* No gap between cells */
		justify-content: center;
		align-content: center; /* Center by default for short sequences */
		width: fit-content;
		height: fit-content; /* Default for non-scrolling */
		margin: auto; /* Default for centering */
		transition: all 0.3s ease-out;
		/* Add padding that respects safe area insets */
		padding: 0 calc(var(--safe-inset-right, 0px)) calc(20px + var(--safe-inset-bottom, 0px))
			calc(var(--safe-inset-left, 0px));
		transform-origin: center center;
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
