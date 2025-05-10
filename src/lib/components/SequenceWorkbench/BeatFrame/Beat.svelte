<script lang="ts">
	// No store imports needed with Svelte 5 approach
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
	import type { BeatData } from './BeatData';
	import { updateDevTools } from '$lib/utils/devToolsUpdater';

	export let beat: BeatData;
	export let onClick: () => void;
	export let isStartPosition: boolean = false;

	// Import the default pictograph data
	import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';

	// Reactively update the pictographData when the beat.pictographData changes
	$: pictographData = beat?.pictographData || defaultPictographData;

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
		{pictographData}
		beatNumber={beat.beatNumber}
		{isStartPosition}
		showLoadingIndicator={false}
		useNewStateManagement={false}
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
