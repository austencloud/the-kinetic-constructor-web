<script lang="ts">
	import SequenceWidget from './SequenceWidget/SequenceWidget.svelte';
	import GraphEditor from './GraphEditor/GraphEditor.svelte';
	import GraphEditorToggleTab from './GraphEditor/GraphEditorToggleTab.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { selectedStartPos } from '$lib/stores/constructStores.js';
	import { writable } from 'svelte/store';
	import type { PictographData } from '$lib/types/PictographData.js';

	let isGraphEditorExpanded = writable(false);
	let isExpanded = false;
	const animationDuration = 300; // Animation duration in ms

	let editorPercentage = 0.25; // 25% of viewport height
	let computedEditorHeight = 0; // Will be computed on mount

	let sequenceWorkbenchHeight: number = 0;
	let sequenceWorkbenchElement: HTMLElement;

	// Extract store value
	let currentStartPos: PictographData | null = null;
	selectedStartPos.subscribe((value: PictographData | null) => {
		currentStartPos = value;
	});

	onMount(() => {
		computedEditorHeight = Math.floor(window.innerHeight * editorPercentage);
		updateSequenceWorkbenchHeight();

		window.addEventListener('resize', updateComputedHeight);
		window.addEventListener('resize', updateSequenceWorkbenchHeight);
	});

	onDestroy(() => {
		window.removeEventListener('resize', updateComputedHeight);
		window.removeEventListener('resize', updateSequenceWorkbenchHeight);
	});

	function toggleGraphEditor() {
		isExpanded = !isExpanded;
		isGraphEditorExpanded.set(isExpanded);
	}

	function updateComputedHeight() {
		computedEditorHeight = Math.floor(window.innerHeight * editorPercentage);
	}

	function updateSequenceWorkbenchHeight() {
		if (sequenceWorkbenchElement) {
			sequenceWorkbenchHeight = sequenceWorkbenchElement.offsetHeight;
		}
	}
</script>

<div class="sequence-workbench" bind:this={sequenceWorkbenchElement}>
	<SequenceWidget {sequenceWorkbenchHeight} startPos={currentStartPos} />

	<!-- GraphEditorToggleTab -->
	<GraphEditorToggleTab
		{isExpanded}
		{animationDuration}
		graphEditorHeight={isExpanded ? computedEditorHeight : 0}
		on:click={toggleGraphEditor}
	/>

	<!-- GraphEditor -->
	<GraphEditor {isExpanded} {animationDuration} maxEditorHeight={computedEditorHeight} />
</div>

<style>
	.sequence-workbench {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
	}
</style>
