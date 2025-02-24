<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import StartPosBeat from './StartPosBeat.svelte';
	import Beat from './Beat.svelte';
	import type { BeatData } from './BeatData.js';
	import { defaultPictographData } from '$lib/components/Pictograph/defaultPictographData.js';
	import { getDefaultLayouts } from '$lib/services/beatLayoutService.js';
	import { resizeObserver } from '$lib/actions/resizeObserver.js';
	import type { PictographData } from '$lib/types/PictographData.js';
	import { applyLayout, calculateCellSize, type LayoutDict } from './beatFrameHelpers.js';
	import { beatsStore } from '$lib/stores/beatsStore.js';
	import { selectedStartPos } from '$lib/stores/constructStores.js';

	// Get current value
	let currentStartPos = get(selectedStartPos);

	// Subscribe to updates
	selectedStartPos.subscribe((value) => {
		currentStartPos = value;
	});

	export let startPos: PictographData | null = null;

	let defaultLayouts: LayoutDict = {};
	let beats = get(beatsStore);
	let frameRef: HTMLDivElement | null = null;
	let frameWidth = 0;
	let frameHeight = 0;
	const gap = 10;
	let cellSize = 50;
	let beatRows = 4;
	let beatCols = 4;

	// Reactive start position update
	let startPosBeatData: BeatData = {
		beatNumber: 0,
		filled: false,
		pictographData: defaultPictographData
	};

	$: if (startPos) {
		startPosBeatData = {
			beatNumber: 0,
			filled: true,
			pictographData: startPos
		};
	}

	// Subscribe to store updates
	const unsubscribe = beatsStore.subscribe((value) => {
		beats = value;
		applyBeatLayout();
	});

	onDestroy(() => unsubscribe());

	onMount(() => {
		initLayouts();
		setTimeout(() => {
			if (frameRef) {
				const rect = frameRef.getBoundingClientRect();
				onResize(rect.width, rect.height);
			}
		}, 50);
	});

	async function initLayouts() {
		defaultLayouts = await getDefaultLayouts();
		applyBeatLayout();
	}

	function applyBeatLayout() {
		[beatRows, beatCols] = applyLayout(defaultLayouts, beats.length, [4, 4]);
		updateCellSize();
	}

	function onResize(width: number, height: number) {
		frameWidth = width;
		frameHeight = height;
		updateCellSize();
	}

	function updateCellSize() {
		if (frameWidth > 0 && frameHeight > 0) {
			cellSize = calculateCellSize(frameWidth, frameHeight, beatRows, beatCols + 1, gap);
			document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
		}
	}

	function handleBeatClick(beat: BeatData) {
		console.log('Clicked beat:', beat);
	}
</script>

<div
	bind:this={frameRef}
	use:resizeObserver={onResize}
	class="beat-frame"
	style="--total-rows: {beatRows}; --total-cols: {beatCols + 1}; --gap: {gap}px;"
>
	<!-- Start Position Beat -->
	<div class="start-pos" style="width: {cellSize}px; height: {cellSize}px;">
		<StartPosBeat beatData={startPosBeatData} onClick={() => handleBeatClick(startPosBeatData)} />
	</div>

	<!-- Other Beats -->
	{#each beats as beat (beat.beatNumber)}
		<div
			class="beat-container"
			style="
		  width: {cellSize}px;
		  height: {cellSize}px;
		  grid-row: {Math.floor((beat.beatNumber - 1) / beatCols) + 1};
		  grid-column: {((beat.beatNumber - 1) % beatCols) + 2};
		"
		>
			<Beat beatData={beat} onClick={() => handleBeatClick(beat)} />
		</div>
	{/each}
</div>

<style>
	.beat-frame {
		display: grid;
		grid-template-rows: repeat(var(--total-rows, 4), var(--cell-size, 50px));
		grid-template-columns: repeat(var(--total-cols, 5), var(--cell-size, 50px));
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
