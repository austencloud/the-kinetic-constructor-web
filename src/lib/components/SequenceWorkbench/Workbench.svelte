<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import SequenceWidget from './SequenceWidget.svelte';
	import { useResizeObserver } from '$lib/composables/useResizeObserver';

	// Props
	export let toolsPanelOpen = false;

	// Create event dispatcher for tools panel toggle
	const dispatch = createEventDispatcher();
	let computedEditorHeight = 0;
	const { size, resizeObserver } = useResizeObserver();
	$: sequenceWorkbenchHeight = $size.height;
	onMount(() => {
		if (typeof window !== 'undefined') {
			computedEditorHeight = Math.floor(window.innerHeight);
		}
	});
</script>

<div class="sequence-workbench" use:resizeObserver>
	<SequenceWidget
		workbenchHeight={sequenceWorkbenchHeight}
		{toolsPanelOpen}
		on:toggleToolsPanel={() => dispatch('toggleToolsPanel')}
	/>
</div>

<style>
	.sequence-workbench {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		position: relative;
	}
</style>
