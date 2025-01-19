<script lang="ts">
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
	import { defaultPictographData } from '$lib/components/Pictograph/defaultPictographData';
	import type { PictographInterface } from '$lib/types/PictographInterface';
	import type { BeatData } from './BetaData';


	export let beatData: BeatData;
	export let onClick: (beat: BeatData) => void;

	let pictographData: PictographInterface = beatData.pictographData || defaultPictographData;
</script>

<button
	class="beat"
	on:click={() => onClick(beatData)}
	aria-label={`Beat ${beatData.beatNumber}`}
	on:keydown={(e) => e.key === 'Enter' && onClick(beatData)}
>
	<Pictograph {pictographData} isSelected={beatData.filled} onClick={() => onClick(beatData)}
	></Pictograph>
</button>

<style>
	.beat {
		width: 100%;
		height: 100%;
		padding: 0;
	}
</style>
