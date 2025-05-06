<!-- src/lib/components/SequenceWorkbench/ToolsButtonOverlay.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import ToolsButton from './ToolsButton.svelte';

	// Props
	export let isToolsPanelOpen = false;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		toggleToolsPanel: void;
	}>();

	// Forward the toggle event
	function handleToggleToolsPanel() {
		dispatch('toggleToolsPanel');
	}
</script>

<div class="tools-button-overlay">
	<ToolsButton {isToolsPanelOpen} on:toggleToolsPanel={handleToggleToolsPanel} />
</div>

<style>
	.tools-button-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 100;
	}

	/* Make the button itself clickable */
	:global(.tools-button-overlay .tools-button) {
		pointer-events: auto;
	}
</style>
