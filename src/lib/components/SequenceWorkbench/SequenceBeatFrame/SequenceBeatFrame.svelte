<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get, writable, type Writable } from 'svelte/store';
	import StartPosBeat from './StartPosBeat.svelte';
	import Beat from './Beat.svelte';
	import type { BeatData } from './BeatData.js';
	import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData.js';
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

	// ✅ Only create writable once
	let startPos: Writable<PictographData> = writable(defaultPictographData);

	selectedStartPos.subscribe((newStartPos) => {
		startPos.set(newStartPos || defaultPictographData);
	});

	let startPosBeatDataStore: Writable<BeatData> = writable({
		beatNumber: 0,
		filled: !!get(startPos),
		pictographData: get(startPos)
	});

	// ✅ Only update when `selectedStartPos` actually changes
	selectedStartPos.subscribe((newStartPos) => {
		startPosBeatDataStore.update((data) => {
			return { ...data, pictographData: newStartPos || defaultPictographData };
		});
	});


	// ✅ Ensure beats update dynamically
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

	function handleStartPosBeatClick(startPosBeatDataStore: Writable<BeatData>) {
		addBeat();
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
	<StartPosBeat
		{startPosBeatDataStore}
		onClick={() => handleStartPosBeatClick(startPosBeatDataStore)}
	/>

	<!-- Other Beats -->
	{#each $beatsStore as beat (beat.beatNumber)}
		<div class="beat-container" style="width: {cellSize}px; height: {cellSize}px;">
			<Beat beatData={beat} onClick={() => handleBeatClick(beat)} />
		</div>
	{/each}
</div>
