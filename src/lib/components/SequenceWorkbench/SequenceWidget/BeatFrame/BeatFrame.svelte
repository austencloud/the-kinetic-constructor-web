<script lang="ts">
	import StartPosBeat, { type StartPosBeatData } from './StartPosBeat.svelte';
	import Beat, { type BeatData } from './Beat.svelte';
	import { onMount } from 'svelte';

	// We'll load default layouts from a JSON file (keyed by beat count -> [rows, cols]).
	let defaultLayouts: Record<string, [number, number]> = {};

	// Special start pos data
	const startPosBeatData: StartPosBeatData = {
		id: 0,
		filled: false,
		pictographData: { grid: '/diamond_grid.svg' }
	};

	// 16 example beats
	let beatData: BeatData[] = [
		{ id: 1, filled: false, pictographData: { grid: '/diamond_grid.svg' } },
		{ id: 2, filled: true,  pictographData: { grid: '/diamond_grid.svg' } },
		{ id: 3, filled: false, pictographData: { grid: '/diamond_grid.svg' } },
		{ id: 4, filled: true,  pictographData: { grid: '/diamond_grid.svg' } },
		{ id: 5, filled: false, pictographData: { grid: '/diamond_grid.svg' } },
		{ id: 6, filled: true,  pictographData: { grid: '/diamond_grid.svg' } },
		{ id: 7, filled: false, pictographData: { grid: '/diamond_grid.svg' } },
		{ id: 8, filled: true,  pictographData: { grid: '/diamond_grid.svg' } },
		{ id: 9, filled: false, pictographData: { grid: '/diamond_grid.svg' } },
		{ id: 10, filled: true, pictographData: { grid: '/diamond_grid.svg' } },
		{ id: 11, filled: false, pictographData: { grid: '/diamond_grid.svg' } },
		{ id: 12, filled: true, pictographData: { grid: '/diamond_grid.svg' } },
		{ id: 13, filled: false, pictographData: { grid: '/diamond_grid.svg' } },
		{ id: 14, filled: true, pictographData: { grid: '/diamond_grid.svg' } },
		{ id: 15, filled: false, pictographData: { grid: '/diamond_grid.svg' } },
		{ id: 16, filled: true, pictographData: { grid: '/diamond_grid.svg' } },
	];

	export let visibleCount = 16;

	// These will be set based on default_layouts.json
	let beatRows = 4;
	let beatCols = 4;

	/**
	 * Fetch default_layouts.json (which might contain
	 * e.g. { "16": [4, 4], "12": [4, 3], ... })
	 */
	async function fetchDefaultLayouts() {
		try {
			const resp = await fetch('/data/default_layouts.json');
			if (!resp.ok) throw new Error('Failed to load default_layouts.json');
			defaultLayouts = await resp.json();
			applyLayout(visibleCount);
		} catch (err) {
			console.error('Error fetching layouts =>', err);
			// fallback
			beatRows = 4;
			beatCols = 4;
		}
	}

	/**
	 * If "16" => [4, 4], then beatRows=4, beatCols=4
	 * We'll add 1 extra column for the StartPos on the left.
	 */
	function applyLayout(beatCount: number) {
		const key = String(beatCount);
		if (defaultLayouts[key]) {
			[beatRows, beatCols] = defaultLayouts[key];
		} else {
			beatRows = 4;
			beatCols = 4;
		}
	}

	function handleBeatClick(beat: BeatData) {
		beat.filled = !beat.filled;
		console.log(`Beat #${beat.id} => filled? ${beat.filled}`);
	}

	onMount(fetchDefaultLayouts);
</script>

 

<div
	class="beat-frame"
	style="
		--total-rows: {beatRows};
		--total-cols: {beatCols + 1}; 
	"
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
			"
		>
			<Beat beat={beat} onClick={handleBeatClick} />
		</div>
	{/each}
</div>

<style>
	.beat-frame {
		display: grid;
		grid-template-rows: repeat(var(--total-rows, 4), 1fr);
		grid-template-columns: repeat(var(--total-cols, 5), 1fr);
		background-color: transparent;
	}

	.start-pos {
		aspect-ratio: 1 / 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.beat-container {
		aspect-ratio: 1 / 1;
		cursor: pointer;
	}
</style>
