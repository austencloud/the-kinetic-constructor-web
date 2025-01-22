<script lang="ts">
	import { onMount } from 'svelte';
	import { resizeObserver } from '$lib/actions/resizeObserver';

	import StartPosBeat from './StartPosBeat.svelte';
	import Beat from './Beat.svelte';
	import { defaultPictographData } from '$lib/components/Pictograph/defaultPictographData';

	import { applyLayout, calculateCellSize } from './beatFrameLayoutHelpers';
	import type { LayoutDict } from './beatFrameLayoutHelpers';
	import { getDefaultLayouts } from '$lib/services/beatLayoutService';
	import type { BeatData } from './BetaData';

	let defaultLayouts: LayoutDict = {};

	// Start position beat
	const startPosBeatData: BeatData = {
		beatNumber: 0,
		filled: false,
		pictographData: defaultPictographData
	};

	let beatRows = 4;
	let beatCols = 4;
	let beatData: BeatData[] = [];

	let frameRef: HTMLDivElement | null = null;
	let frameWidth = 0;
	let frameHeight = 0;

	const gap = 10;
	let cellSize = 50;

	onMount(() => {
		initLayouts();
		generateBeats();

		// Force recalculation once DOM is ready
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
		[beatRows, beatCols] = applyLayout(defaultLayouts, beatData.length, [4, 4]);
		updateCellSize();
	}

	function generateBeats() {
		beatData = [];
		let beatNumber = 1; // Start numbering after the start position

		for (let row = 0; row < beatRows; row++) {
			for (let col = 0; col < beatCols; col++) {
				beatData.push({
					beatNumber: beatNumber++,
					filled: false,
					pictographData: { ...defaultPictographData }
				});
			}
		}
	}

	function onResize(width: number, height: number) {
		frameWidth = width;
		frameHeight = height;
		updateCellSize();
	}

	function updateCellSize() {
	if (frameWidth > 0 && frameHeight > 0) {
		// Ensure all cells have the same size
		cellSize = calculateCellSize(frameWidth, frameHeight, beatRows, beatCols + 1, gap);
		document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
	} else {
		console.warn('Frame dimensions not available yet');
	}
}


	function handleBeatClick(beat: BeatData) {
		console.log('Clicked beat:', beat);
	}
	$: if (cellSize) {
        beatData = beatData.map(b => ({...b})); // Force array update
    }
</script>
<div
	bind:this={frameRef}
	use:resizeObserver={onResize}
	class="beat-frame"
	style="--total-rows: {beatRows}; --total-cols: {beatCols + 1}; --gap: {gap}px;"
>
	<!-- Start Position Beat -->
	<div
		class="start-pos"
		style="width: {cellSize}px; height: {cellSize}px;"
	>
		<StartPosBeat
			beatData={startPosBeatData}
			onClick={() => handleBeatClick(startPosBeatData)}
		/>
	</div>

	<!-- Other Beats -->
	{#each beatData as beat (beat.beatNumber)}
	<div
		class="beat-container"
		style="
			width: {cellSize}px;
			height: {cellSize}px;
			grid-row: {Math.floor((beat.beatNumber - 1) / beatCols) + 1};
			grid-column: {(beat.beatNumber - 1) % beatCols + 2};
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
