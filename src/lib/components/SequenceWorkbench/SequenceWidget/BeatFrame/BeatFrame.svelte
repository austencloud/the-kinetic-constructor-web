<script lang="ts">
	import Beat from './Beat.svelte';
	import { writable } from 'svelte/store';

	export let beatCount = writable(16);

	let beats = Array(64)
		.fill(null)
		.map((_, i) => ({
			id: i + 1,
			filled: i < $beatCount
		}));

	$: visibleBeats = beats.slice(0, $beatCount);
</script>

<div class="beat-frame">
	<div class="start-position">Start Position</div>
	{#each visibleBeats as beat}
		<Beat {beat} />
	{/each}
</div>

<style>
	.beat-frame {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		gap: 10px;
		padding: 10px;
		background-color: transparent;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.start-position {
		grid-column: span 8;
		text-align: center;
		font-weight: bold;
		margin-bottom: 10px;
	}
</style>
