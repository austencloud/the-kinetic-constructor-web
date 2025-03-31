<!-- src/lib/components/SequenceWorkbench/SequenceBeatFrame/StartPosBeat.svelte -->
<script lang="ts">
	import { writable } from 'svelte/store';
	import Beat from './Beat.svelte';
	import type { BeatData } from './BeatData';

	export let beatData: BeatData;
	export let onClick: () => void;

	// Create a label for the start position

	// Handle clicks at this level to prevent multiple event handlers
	function handleContainerClick(event: MouseEvent) {
		// Only handle clicks directly on the container, not on children
		if (event.target === event.currentTarget) {
			onClick();
		}
	}
</script>

<button class="start-pos-beat" on:click={handleContainerClick} type="button">
	<Beat beat={beatData} {onClick} />
</button>

<style>
	.start-pos-beat {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		border: 2px dashed gold;
		border-radius: 8px;
	}
</style>
