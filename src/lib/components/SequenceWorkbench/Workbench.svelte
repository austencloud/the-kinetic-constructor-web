<!-- src/lib/components/SequenceWorkbench/SequenceWorkbench.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import SequenceWidget from './SequenceWidget.svelte';
	import GraphEditor from './GraphEditor/GraphEditor.svelte';
	import GraphEditorToggleTab from './GraphEditor/GraphEditorToggleTab.svelte';
	import SequenceProvider from '$lib/context/sequence/SequenceProvider.svelte';
	import { useResizeObserver } from '$lib/composables/useResizeObserver';
	
	// Constants
	const EDITOR_HEIGHT_PERCENTAGE = 0.25; // 25% of viewport height
	const ANIMATION_DURATION = 300; // In milliseconds
	
	// UI state
	const graphEditorExpanded = writable(false);
	let computedEditorHeight = 0;
	
	// Element size tracking with our composable hook
	const { size, resizeObserver } = useResizeObserver();
	
	// Compute dynamic values based on reactive state
	$: sequenceWorkbenchHeight = $size.height;
	$: isExpanded = $graphEditorExpanded;
	$: computedEditorHeight = Math.floor(window.innerHeight * EDITOR_HEIGHT_PERCENTAGE);
	
	// Event handlers
	function toggleGraphEditor() {
	  graphEditorExpanded.update(value => !value);
	}
	
	// Lifecycle
	onMount(() => {
	  // Calculate initial editor height
	  computedEditorHeight = Math.floor(window.innerHeight * EDITOR_HEIGHT_PERCENTAGE);
	});
  </script>
  
  <SequenceProvider>
	<div class="sequence-workbench" use:resizeObserver>
	  <SequenceWidget workbenchHeight={sequenceWorkbenchHeight} />
	  
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
  </SequenceProvider>
  
  <style>
	.sequence-workbench {
	  display: flex;
	  flex-direction: column;
	  width: 100%;
	  height: 100%;
	  position: relative;
	}
  </style>