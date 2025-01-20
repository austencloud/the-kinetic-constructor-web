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
			cellSize = calculateCellSize(frameWidth, frameHeight, beatRows, beatCols + 1, gap);
		} else {
			console.warn('Frame dimensions not available yet');
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
	<div
		class="start-pos"
		style="grid-row: 1; grid-column: 1; width: {cellSize}px; height: {cellSize}px;"
	>
		<StartPosBeat
			beatData={startPosBeatData} onClick={() => handleBeatClick(startPosBeatData)}
		/>
	</div>

	{#each beatData as beatData (beatData.beatNumber)}
	<div
		class="beat-container"
		style="
			grid-row: {Math.floor((beatData.beatNumber - 1) / beatCols) + 1};
			grid-column: {(beatData.beatNumber - 1) % beatCols + 2};
			width: {cellSize}px;
			height: {cellSize}px;
		"
	>
		<Beat beatData={beatData} onClick={() => handleBeatClick(beatData)} />
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
		/* padding: 1%; */
		/* min-height: 0; */
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
