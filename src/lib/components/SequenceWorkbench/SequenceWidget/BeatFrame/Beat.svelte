<script context="module" lang="ts">
	export interface BeatData {
		id: number;
		filled: boolean;
		pictographData: any;
	}
</script>

<script lang="ts">
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';

	export let beat: BeatData;
	export let onClick: (beat: BeatData) => void;

	// You can remove or keep this if you need it for debugging, 
	// but you won’t show a label in the Pictograph now.
	let localName = `Beat ${beat.id}`;
</script>

<!-- Container that includes the border and hover scale -->
<button class="beat" on:click={() => onClick(beat)} aria-label={`Beat ${beat.id}`} on:keydown={(e) => e.key === 'Enter' && onClick(beat)}>
	<Pictograph 
		pictographData={beat.pictographData} 
		isSelected={beat.filled}
		interactive={false}
		onClick={() => onClick(beat)}></Pictograph>
</button>

<style>
	.beat {
		/* Put your border here so that it scales together with the content */
		border: 1px solid black;
		/* Center or size the container as you wish */
		width: 100%;
		height: 100%;

		/* Animate scale on hover */
		transition: transform 0.1s ease;
		cursor: pointer; /* so user sees pointer on hover */
	}
	
	.beat:hover {
		transform: scale(1.05); /* Entire container + border grows */
		cursor: pointer; /* so user sees pointer on hover */
		z-index: 10
	}
	
	.beat:active {
		transform: scale(1);
		cursor: pointer; /* so user sees pointer on hover */
	}
</style>
