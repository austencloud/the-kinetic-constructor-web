<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import StartPosBeat from './StartPosBeat.svelte';
	import Beat from './Beat.svelte';
	import type { BeatData } from './BeatData.js';
	import { defaultPictographData } from '$lib/components/Pictograph/defaultPictographData.js';
	import { resizeObserver } from '$lib/actions/resizeObserver.js';
	import { applyLayout, autoAdjustLayout, calculateCellSize } from './beatFrameHelpers.js';
	import { addBeat, beatsStore } from '$lib/stores/beatsStore.js';
	import { selectedStartPos } from '$lib/stores/constructStores.js';
	import type { PictographData } from '$lib/types/PictographData.js';

	let beats = get(beatsStore);
	let frameRef: HTMLDivElement | null = null;
	let frameWidth = 0;
	let frameHeight = 0;
	const gap = 10;
	let cellSize = 50;
	let beatRows = 1;
	let beatCols = 1;

	import { writable } from 'svelte/store';

	let startPos = writable<PictographData | null>(null);

	selectedStartPos.subscribe((newStartPos) => {
		console.log('Updated startPos in SequenceBeatFrame:', newStartPos);
		startPos.set(newStartPos || defaultPictographData);
	});

	$: startPosBeatData = {
		beatNumber: 0,
		filled: $startPos !== null,
		pictographData: $startPos
	};

	// ✅ Make sure beats update layout dynamically
	const unsubscribe = beatsStore.subscribe((value) => {
		beats = value;
		applyBeatLayout();
	});

	onDestroy(() => unsubscribe());

	onMount(() => {
		setTimeout(() => {
			if (frameRef) {
				const rect = frameRef.getBoundingClientRect();
				onResize(rect.width, rect.height);
			}
		}, 50);
	});

	function applyBeatLayout() {
		[beatRows, beatCols] = applyLayout({}, beats.length, autoAdjustLayout(beats.length));
		updateCellSize();
	}

	function onResize(width: number, height: number) {
		frameWidth = width;
		frameHeight = height;
		updateCellSize();
	}

	function updateCellSize() {
		if (frameWidth > 0 && frameHeight > 0) {
			cellSize = calculateCellSize(frameWidth, frameHeight, beatRows, beatCols, gap);
			document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
		}
	}

	function handleBeatClick(beat: BeatData) {
		addBeat();
	}
</script>

<div
	bind:this={frameRef}
	use:resizeObserver={onResize}
	class="beat-frame"
	style="--total-rows: {beatRows}; --total-cols: {beatCols}; --gap: {gap}px;"
>
	<!-- Start Position Beat -->
	<div class="start-pos" style="width: {cellSize}px; height: {cellSize}px;">
		<StartPosBeat beatData={startPosBeatData} onClick={() => handleBeatClick(startPosBeatData)} />
	</div>

	<!-- Other Beats -->
	{#each beats as beat (beat.beatNumber)}
		<div class="beat-container" style="width: {cellSize}px; height: {cellSize}px;">
			<Beat beatData={beat} onClick={() => handleBeatClick(beat)} />
		</div>
	{/each}
</div>

<style>
	.beat-frame {
		display: grid;
		grid-template-rows: repeat(var(--total-rows, 1), var(--cell-size, 50px));
		grid-template-columns: repeat(var(--total-cols, 1), var(--cell-size, 50px));
		justify-content: center;
		align-content: center;
		width: 100%;
		height: 100%;
	}

	.start-pos {
		width: var(--cell-size, 50px);
		height: var(--cell-size, 50px);
		aspect-ratio: 1 / 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
