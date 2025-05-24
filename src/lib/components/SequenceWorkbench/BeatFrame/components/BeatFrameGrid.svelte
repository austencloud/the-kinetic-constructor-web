<!-- src/lib/components/SequenceWorkbench/BeatFrame/components/BeatFrameGrid.svelte -->
<script lang="ts">
	import StartPosBeat from '../StartPosBeat.svelte';
	import AnimatedBeat from '../AnimatedBeat.svelte';
	import ReversalGlyph from '../ReversalGlyph.svelte';
	import EmptyStartPosLabel from '../EmptyStartPosLabel.svelte';
	import type { BeatData as LegacyBeatData } from '../BeatData';

	// Props using Svelte 5 runes
	const {
		beats,
		startPosBeatData,
		selectedBeatIndex,
		sequenceIsEmpty,
		beatRows,
		beatCols,
		beatCount,
		cellSize,
		onStartPosBeatClick,
		onBeatClick
	} = $props<{
		beats: LegacyBeatData[];
		startPosBeatData: any;
		selectedBeatIndex: number;
		sequenceIsEmpty: boolean;
		beatRows: number;
		beatCols: number;
		beatCount: number;
		cellSize: number;
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
				{#if sequenceIsEmpty}
					<EmptyStartPosLabel onClick={onStartPosBeatClick} />
				{:else}
					<StartPosBeat beatData={startPosBeatData} onClick={onStartPosBeatClick} />
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
		gap: 0;
		justify-content: center;
		align-content: center;
		width: fit-content;
		height: fit-content;
		margin: auto;
		transition: all 0.3s ease-out;
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
		transition: all 0.18s ease;
		box-sizing: border-box;
		overflow: visible;
		z-index: 1;
		margin: 2px;
	}

	.beat-container.selected {
		z-index: 25;
	}

	.beat-container:hover {
		z-index: 20;
	}

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
