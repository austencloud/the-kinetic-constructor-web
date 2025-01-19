<script lang="ts">
	import { onMount } from 'svelte';
	import { resizeObserver } from '$lib/actions/resizeObserver';

	import StartPosBeat, { type StartPosBeatData } from './StartPosBeat.svelte';
	import Beat, { type BeatData } from './Beat.svelte';
	import { sampleBeats } from './BeatFrameExampleData';

	import { applyLayout, calculateCellSize } from './beatFrameLayoutHelpers';
	import type { LayoutDict } from './beatFrameLayoutHelpers';
	import { getDefaultLayouts } from '$lib/services/beatLayoutService';

	let defaultLayouts: LayoutDict = {};

	const startPosBeatData: StartPosBeatData = {
		id: 0,
		filled: false,
		pictographData: { grid: '/diamond_grid.svg' }
	};

	let beatData: BeatData[] = sampleBeats;
	export let visibleCount = beatData.length;

	let beatRows = 4;
	let beatCols = 4;

	let frameRef: HTMLDivElement | null = null;
	let frameWidth = 0;
	let frameHeight = 0;

	function onResize(width: number, height: number) {
		console.log('Resize detected:', width, height);
		frameWidth = width;
		frameHeight = height;
		updateCellSize();
	}

	const gap = 10;
	let cellSize = 50;

	let ro: ResizeObserver | undefined;

	onMount(() => {
		initLayouts();
		console.log('Beat frame mounted');
		// Force recalculation once DOM is ready
		setTimeout(() => {
			if (frameRef) {
				const rect = frameRef.getBoundingClientRect();
				console.log('Initial frame dimensions:', rect.width, rect.height);
				onResize(rect.width, rect.height);
			}
		}, 50); // Delay slightly longer if needed
	});

	async function initLayouts() {
		defaultLayouts = await getDefaultLayouts();
		applyBeatLayout(visibleCount);
	}

	function applyBeatLayout(beatCount: number) {
		[beatRows, beatCols] = applyLayout(defaultLayouts, beatCount, [4, 4]);
		updateCellSize();
	}

	function updateCellSize() {
		if (frameWidth > 0 && frameHeight > 0) {
			cellSize = calculateCellSize(frameWidth, frameHeight, beatRows, beatCols + 1, gap);
		} else {
			console.warn('Frame dimensions not available yet');
		}
	}

	function handleBeatClick(beat: BeatData) {
		beat.filled = !beat.filled;
	}
	$: if (frameWidth && frameHeight) {
		updateCellSize();
	}
</script>

<div
	bind:this={frameRef}
	use:resizeObserver={onResize}
	class="beat-frame"
	style="--total-rows: {beatRows}; --total-cols: {beatCols + 1}; --gap: {gap}px;"
>
	<div
		class="start-pos"
		style="grid-row: 1; grid-column: 1; width: {cellSize}px;height: {cellSize}px;"
	>
		<StartPosBeat {startPosBeatData} onClick={(sp) => console.log('Start pos clicked =>', sp)} />
	</div>

	{#each beatData.slice(0, visibleCount) as beat, index (beat.id)}
		<div
			class="beat-container"
			style="
				grid-row: {Math.floor(index / beatCols) + 1};
				grid-column: {(index % beatCols) + 2};
				width: {cellSize}px;
				height: {cellSize}px;
			"
		>
			<Beat {beat} onClick={handleBeatClick} />
		</div>
	{/each}
</div>

<style>
	.beat-frame {
		display: grid;
		grid-template-rows: repeat(var(--total-rows, 4), auto);
		grid-template-columns: repeat(var(--total-cols, 5), auto);
		justify-content: center;
		align-content: center;
		width: 100%;
		height: 100%;
		padding: 1%;
		min-height: 0;
		background-color: transparent;
		box-sizing: border-box;
		overflow: hidden;
	}

	.start-pos {
		aspect-ratio: 1 / 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.beat-container {
		cursor: pointer;
	}
</style>
