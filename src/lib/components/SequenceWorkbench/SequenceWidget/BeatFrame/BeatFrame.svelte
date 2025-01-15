<script lang="ts">
	import StartPosBeat from './StartPosBeat.svelte';
	import Beat from './Beat.svelte';
	import type { BeatData } from './Beat.svelte';

	export let beats: BeatData[] = [];
	export let visibleCount = 16;

	function handleBeatClick(beat: BeatData) {
		beat.filled = !beat.filled;
	}
</script>

<div class="container">
	<div class="beat-frame"></div>
		<!-- StartPos in row=1, col=1, using your new StartPosBeat -->
		<div class="start-pos" style="grid-row: 1; grid-column: 1;">
			<StartPosBeat onClick={() => console.log('Start pos clicked!')}/>
		</div>

		{#each beats.slice(0, visibleCount) as beat, index (beat.id)}
			<div
				class="beat-container"
				style="grid-row: {Math.floor(index/8) + 2}; grid-column: {(index % 8) + 2};"
			>
				<Beat beat={beat} onClick={handleBeatClick} />
			</div>
		{/each}
	</div>

<style>
	.container {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.beat-frame {
		display: grid;
		grid-template-rows: repeat(9, 1fr);
		grid-template-columns: repeat(9, 1fr);
		gap: 10px;
		padding: 10px;
		background-color: transparent;
		border-radius: 8px;
	}

	.start-pos {
		border: 2px dashed #888;
		border-radius: 5px;
		aspect-ratio: 1 / 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}


</style>
