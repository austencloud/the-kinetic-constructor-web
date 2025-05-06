<!-- src/lib/components/SequenceWorkbench/SequenceBeatFrame/Beat.svelte -->
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

	// Create a local pictograph data store with the initial data
	const pictographDataStore = writable(beat.pictographData || defaultPictographData);

	// This is important: update the store whenever the beat's pictograph data changes
	$: {
		if (beat?.pictographData) {
			// Force a fresh copy to ensure reactivity
			const copy = JSON.parse(JSON.stringify(beat.pictographData));
			const currentData = get(pictographDataStore);

			// Only preserve motion types if not during a layout shift
			const stackTrace = new Error().stack || '';
			const isLayoutShift =
				stackTrace.includes('Beat 4') ||
				stackTrace.includes('Beat 5') ||
				stackTrace.includes('Beat 9') ||
				stackTrace.includes('Beat 10');

			if (!isLayoutShift) {
				if (currentData.redMotionData?.motionType && copy.redMotionData) {
					copy.redMotionData.motionType = currentData.redMotionData.motionType;
				}
				if (currentData.blueMotionData?.motionType && copy.blueMotionData) {
					copy.blueMotionData.motionType = currentData.blueMotionData.motionType;
				}
			}

			pictographDataStore.set(copy);
		}
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

	.beat:hover {
		transform: scale(1.05);
	}

	.beat:active {
		transform: scale(0.95);
	}

	.filled {
		box-shadow: 0 0 8px transparent;
	}
</style>
