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
		width: 100%;
		height: 100%;
		padding:0;
	}
	

</style>
