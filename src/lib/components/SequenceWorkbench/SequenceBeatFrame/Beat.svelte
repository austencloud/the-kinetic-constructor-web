<script lang="ts">
	import { writable, get, type Writable } from 'svelte/store';
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
	import type { PictographData } from '$lib/types/PictographData.js';
	import type { BeatData } from './BeatData.js';

	export let beatData: BeatData; // ✅ Receive plain BeatData object
	export let onClick: (beat: BeatData) => void;

	let pictographDataStore: Writable<PictographData> = writable(beatData.pictographData);
	$: if (beatData.pictographData) {
		pictographDataStore.set(beatData.pictographData);
	}
</script>

<button
	class="beat"
	on:click={() => onClick(beatData)}
	aria-label={`Beat ${beatData.beatNumber}`}
	on:keydown={(e) => e.key === 'Enter' && onClick(beatData)}
>
	<Pictograph pictographDataStore={pictographDataStore} onClick={() => onClick(beatData)} />
</button>
