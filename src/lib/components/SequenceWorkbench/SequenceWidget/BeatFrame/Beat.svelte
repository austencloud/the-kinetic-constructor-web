<script lang="ts">
	import { defaultPictographData } from '$lib/components/Pictograph/defaultPictographData.js';
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
	import type { PictographData } from '$lib/types/PictographData.js';
	import type { BeatData } from './BetaData.js';

	export let beatData: BeatData;
	export let onClick: (beat: BeatData) => void;

	let pictographData: PictographData = beatData.pictographData || defaultPictographData;
</script>

<button
	class="beat"
	on:click={() => onClick(beatData)}
	aria-label={`Beat ${beatData.beatNumber}`}
	on:keydown={(e) => e.key === 'Enter' && onClick(beatData)}
>
	<Pictograph {pictographData} onClick={() => onClick(beatData)} />
</button>

<style>
	.beat {
		width: 100%;
		height: 100%;
		padding: 0;
		border-radius: 0;
		border: none;
	}
</style>
