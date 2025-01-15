<script context="module" lang="ts">
	// Import the same BeatData interface from Beat.svelte
	import Beat, { type BeatData } from './Beat.svelte';

	/**
	 * If your StartPos beat is truly the same shape,
	 * you can alias it:
	 */
	export type StartPosBeatData = BeatData;
</script>

<script lang="ts">
	// Optional label
	export const label: string = 'Start';

	// Callback to parent
	export let onClick: (beat: StartPosBeatData) => void = () => {};

	// The parent will pass you an object shaped like BeatData
	export let startPosBeatData: StartPosBeatData;
</script>

<div class="start-pos-container">
	<!-- The Beat component expects a prop named `beat={...}` -->
	<Beat beat={startPosBeatData} onClick={onClick} />
</div>

<style>
	.start-pos-container {
		position: relative;
		width: 100%;
		height: 100%;
	
	}
</style>
