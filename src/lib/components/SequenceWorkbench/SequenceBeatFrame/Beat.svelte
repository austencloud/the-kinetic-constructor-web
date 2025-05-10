<script lang="ts">
	import { writable, get } from 'svelte/store';
	import { onMount, onDestroy } from 'svelte';
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
	import type { BeatData } from './BeatData';
	import { updateDevTools } from '$lib/utils/devToolsUpdater';
	import { layoutStore } from '$lib/stores/layout/layoutStore';

	export let beat: BeatData;
	export let onClick: () => void;
	export let isStartPosition: boolean = false;

	// Import the default pictograph data
	import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';

	// Create a local pictograph data store
	const pictographDataStore = writable(beat.pictographData || defaultPictographData);

	// Reactively update the pictographDataStore when the beat.pictographData changes.
	// Since beat.pictographData is already a new object when the beat itself is updated
	// (due to the mapping in BeatFrameState), a direct assignment is sufficient and safer
	// than JSON.parse(JSON.stringify()), which can corrupt complex data.
	$: if (beat) {
		pictographDataStore.set(beat.pictographData || defaultPictographData);
	}

	// Handle the click event
	function handleClick(event: MouseEvent) {
		event.stopPropagation();
		onClick();
		updateDevTools();
	}
</script>

<button
	class="beat"
	class:filled={beat.filled}
	on:click={handleClick}
	aria-label={`Beat ${beat.beatNumber}`}
>
	<Pictograph
		{pictographDataStore}
		beatNumber={beat.beatNumber}
		{isStartPosition}
		showLoadingIndicator={false}
	/>
</button>

<style>
	.beat {
		width: 100%;
		height: 100%;
		background-color: transparent;
		border: none;
		padding: 0;
		margin: 0;
		cursor: pointer;
		transition: transform 0.2s ease;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 4px;
		min-width: 100%;
		min-height: 100%;
		box-sizing: border-box;
		overflow: visible;
		transform-origin: center center;
	}
</style>
