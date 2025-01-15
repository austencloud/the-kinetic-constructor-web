<script lang="ts">
	import StartPosBeat, { type StartPosBeatData } from './StartPosBeat.svelte';
	import Beat, { type BeatData } from './Beat.svelte';
	import { onMount, afterUpdate } from 'svelte';

	let defaultLayouts: Record<string, [number, number]> = {};

	const startPosBeatData: StartPosBeatData = {
		id: 0,
		filled: false,
		pictographData: { grid: '/diamond_grid.svg' }
	};
	import { sampleBeats } from './BeatFrameExampleData';

	let beatData: BeatData[] = sampleBeats;

	export let visibleCount = beatData.length;

	let beatRows = 4;
	let beatCols = 4;

	let frameRef: HTMLDivElement | null = null;

	let frameWidth = 0;
	let frameHeight = 0;
	const gap = 10;
	let cellSize = 50;

	async function fetchDefaultLayouts() {
		try {
			const resp = await fetch('/data/default_layouts.json');
			if (!resp.ok) throw new Error('Failed to load default_layouts.json');
			defaultLayouts = await resp.json();
			applyLayout(visibleCount);
		} catch (err) {
			console.error('Error fetching layouts =>', err);
			beatRows = 4;
			beatCols = 4;
		}
	}

	function applyLayout(beatCount: number) {
		const key = String(beatCount);
		if (defaultLayouts[key]) {
			[beatRows, beatCols] = defaultLayouts[key];
		} else {
			beatRows = 4;
			beatCols = 4;
		}
		calculateCellSize();
	}

	function handleBeatClick(beat: BeatData) {
		beat.filled = !beat.filled;
		console.log(`Beat #${beat.id} => filled? ${beat.filled}`);
	}

	let ro: ResizeObserver | undefined;
	onMount(() => {
		fetchDefaultLayouts();

		if (frameRef) {
			ro = new ResizeObserver((entries) => {
				for (const entry of entries) {
					const { width, height } = entry.contentRect;
					frameWidth = width;
					frameHeight = height;
					calculateCellSize();
				}
			});
			ro.observe(frameRef);
		}

		return () => {
			if (ro && frameRef) {
				ro.unobserve(frameRef);
			}
		};
	});

	function calculateCellSize() {
		const totalRows = beatRows;
		const totalCols = beatCols + 1;

		const totalHorizontalGap = (totalCols - 1) * gap;
		const totalVerticalGap = (totalRows - 1) * gap;

		const availableWidth = Math.max(0, frameWidth - totalHorizontalGap);
		const availableHeight = Math.max(0, frameHeight - totalVerticalGap);

		const cellWidth = availableWidth / totalCols;
		const cellHeight = availableHeight / totalRows;
		cellSize = Math.floor(Math.min(cellWidth, cellHeight));

		cellSize = Math.max(cellSize, 0);

		console.log('New cellSize =>', cellSize);
	}
</script>

<div
	bind:this={frameRef}
	class="beat-frame"
	style="--total-rows: {beatRows}; --total-cols: {beatCols + 1}; --gap: {gap}px;"
>
	<div class="start-pos" style="grid-row: 1; grid-column: 1;">
		<StartPosBeat 
			startPosBeatData={startPosBeatData} 
			onClick={(sp) => console.log('Start pos clicked =>', sp)}
		/>
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
			<Beat beat={beat} onClick={handleBeatClick} />
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
		padding: 2%;
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
