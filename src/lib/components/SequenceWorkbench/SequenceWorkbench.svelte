<!-- src/lib/components/SequenceWorkbench/SequenceWorkbench.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable, derived } from 'svelte/store';
	import SequenceWidget from './SequenceWidget.svelte';
	import GraphEditor from './GraphEditor/GraphEditor.svelte';
	import GraphEditorToggleTab from './GraphEditor/GraphEditorToggleTab.svelte';
	import { selectedStartPos } from '$lib/stores/constructStores';
	import type { PictographData } from '$lib/types/PictographData';
	
	// Constants
	const EDITOR_HEIGHT_PERCENTAGE = 0.25; // 25% of viewport height
	const ANIMATION_DURATION = 300; // In milliseconds
  
	// Local state
	const graphEditorExpanded = writable(false);
	let sequenceWorkbenchElement: HTMLElement;
	let computedEditorHeight = 0;
	let sequenceWorkbenchHeight = 0;
	
	// UI state derived from stores for reactivity
	$: isExpanded = $graphEditorExpanded;
	
	// Mount and setup
	onMount(() => {
	  // Calculate initial editor height
	  updateComputedHeight();
	  updateSequenceWorkbenchHeight();
	  
	  // Add resize listeners
	  window.addEventListener('resize', updateComputedHeight);
	  window.addEventListener('resize', updateSequenceWorkbenchHeight);
	  
	  // Return cleanup function
	  return () => {
		window.removeEventListener('resize', updateComputedHeight);
		window.removeEventListener('resize', updateSequenceWorkbenchHeight);
	  };
	});
	
	// Event handlers
	function toggleGraphEditor() {
	  graphEditorExpanded.update(value => !value);
	}
	
	// Pure calculation functions
	function updateComputedHeight() {
	  computedEditorHeight = Math.floor(window.innerHeight * EDITOR_HEIGHT_PERCENTAGE);
	}
	
	function updateSequenceWorkbenchHeight() {
	  if (sequenceWorkbenchElement) {
		sequenceWorkbenchHeight = sequenceWorkbenchElement.offsetHeight;
	  }
	}
  </script>
  
  <div class="sequence-workbench" bind:this={sequenceWorkbenchElement}>
	<SequenceWidget {sequenceWorkbenchHeight} />
  
	<!-- GraphEditorToggleTab -->
	<GraphEditorToggleTab
	  isExpanded={isExpanded}
	  animationDuration={ANIMATION_DURATION}
	  graphEditorHeight={isExpanded ? computedEditorHeight : 0}
	  on:click={toggleGraphEditor}
	/>
  
	<!-- GraphEditor -->
	<GraphEditor 
	  isExpanded={isExpanded} 
	  animationDuration={ANIMATION_DURATION} 
	  maxEditorHeight={computedEditorHeight} 
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