<script lang="ts">
	import SequenceWidget from './SequenceWidget/SequenceWidget.svelte';
	import GraphEditor from './GraphEditor/GraphEditor.svelte';
	import GraphEditorToggleTab from './GraphEditor/GraphEditorToggleTab.svelte';

	let isExpanded = false;
	const animationDuration = 300; // Animation duration in ms

	// For example, let’s do 30% of the viewport height
	// or we can do 30% of the parent's offsetHeight. We’ll show viewport for demonstration.
	let editorPercentage = 0.25; // 30% 
	let computedEditorHeight = 0; // We'll compute this in onMount or with a resize observer.

	function toggleGraphEditor() {
		isExpanded = !isExpanded;
	}

	// A simple approach: compute once onMount:
	import { onMount } from 'svelte';
	onMount(() => {
		computedEditorHeight = Math.floor(window.innerHeight * editorPercentage);

		// Alternatively, watch for window resize with a "resize" event:
		window.addEventListener('resize', updateComputedHeight);
	});

	function updateComputedHeight() {
		computedEditorHeight = Math.floor(window.innerHeight * editorPercentage);
	}
</script>

<div class="sequence-workbench">
	<SequenceWidget />

	<!-- GraphEditorToggleTab -->
	<!-- We pass graphEditorHeight = isExpanded ? computedEditorHeight : 0 -->
	<GraphEditorToggleTab
		isExpanded={isExpanded}
		{animationDuration}
		graphEditorHeight={isExpanded ? computedEditorHeight : 0}
		on:click={toggleGraphEditor}
	/>

	<!-- GraphEditor -->
	<GraphEditor
		isExpanded={isExpanded}
		{animationDuration}
		maxEditorHeight={computedEditorHeight}
	/>
</div>

<style>
	.sequence-workbench {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
	}
</style>
