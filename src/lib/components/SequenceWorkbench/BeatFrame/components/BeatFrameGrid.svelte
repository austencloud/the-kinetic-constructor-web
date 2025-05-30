<!-- src/lib/components/SequenceWorkbench/BeatFrame/components/BeatFrameGrid.svelte -->
<script lang="ts">
	import { onMount, untrack } from 'svelte';
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

	// Track which beats are newly added to only animate those
	let previousBeatIds = $state<Set<string>>(new Set());
	let newlyAddedBeatIds = $state<Set<string>>(new Set());

	// Update newly added beats when beats change
	$effect(() => {
		const currentBeatIds = new Set<string>();

		// Collect valid beat IDs
		beats.forEach((beat: LegacyBeatData) => {
			if (beat.id && typeof beat.id === 'string') {
				currentBeatIds.add(beat.id);
			}
		});

		const newIds = new Set<string>();

		// Find beats that are in current but not in previous
		for (const id of currentBeatIds) {
			if (!previousBeatIds.has(id)) {
				newIds.add(id);
			}
		}

		// 🔧 FIX: Use untrack() to prevent infinite reactive loops
		untrack(() => {
			newlyAddedBeatIds = newIds;
			previousBeatIds = currentBeatIds;
		});

		// Clear newly added status after animation duration
		if (newIds.size > 0) {
			setTimeout(() => {
				untrack(() => {
					newlyAddedBeatIds = new Set();
				});
			}, 500); // Clear after animation completes
		}
	});

	// Listen for beat-added events to mark beats as newly added
	onMount(() => {
		const handleBeatAdded = (event: CustomEvent) => {
			const addedBeat = event.detail?.beat;
			if (addedBeat?.id) {
				// 🔧 FIX: Use untrack() to prevent reactive loops from event handlers
				untrack(() => {
					newlyAddedBeatIds = new Set([...newlyAddedBeatIds, addedBeat.id]);
				});
			}
		};

		document.addEventListener('beat-added', handleBeatAdded as EventListener);

		return () => {
			document.removeEventListener('beat-added', handleBeatAdded as EventListener);
		};
	});
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
							isNewlyAdded={beat.id ? newlyAddedBeatIds.has(beat.id) : false}
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
