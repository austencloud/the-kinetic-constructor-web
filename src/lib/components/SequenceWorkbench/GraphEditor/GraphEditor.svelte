<!-- src/lib/components/SequenceWorkbench/GraphEditor/GraphEditor.svelte -->
<script lang="ts">
	import { writable } from 'svelte/store';
	import TurnsBox from './TurnsBox/TurnsBox.svelte';
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import { DIAMOND } from '$lib/types/Constants';
  
	// Component props
	export let isExpanded = false;
	export let animationDuration = 300;
	export let maxEditorHeight = 300;
  
	// Constants and derived values
	const BORDER_PERCENTAGE = 0.02;
	$: borderSize = Math.floor(maxEditorHeight * BORDER_PERCENTAGE);
	$: contentWidth = maxEditorHeight - 2 * borderSize;
  
	// Create a pictograph data store for the editor
	const pictographDataStore = writable<PictographData>({
	  letter: null,
	  startPos: null,
	  endPos: null,
	  timing: null,
	  direction: null,
	  gridMode: DIAMOND,
	  blueMotionData: null,
	  redMotionData: null,
	  gridData: null,
	  redPropData: null,
	  bluePropData: null,
	  redArrowData: null,
	  blueArrowData: null,
	  grid: ''
	});
  </script>
  
  <div
	class="graph-editor"
	style="
	  --animation-duration: {animationDuration}ms; 
	  height: {isExpanded ? maxEditorHeight + 'px' : '0px'};
	"
  >
	<div class="turns-box-container">
	  <TurnsBox color="blue" />
	</div>
  
	<div
	  class="pictograph-container"
	  style="
		border: {borderSize}px solid gold; 
		width: {contentWidth}px; 
		height: {contentWidth}px;
	  "
	>
	  <Pictograph {pictographDataStore} />
	</div>
  
	<div class="turns-box-container">
	  <TurnsBox color="red" />
	</div>
  </div>
  
  <style>
	.graph-editor {
	  position: relative;
	  background-color: #f4f4f4;
	  overflow: hidden;
	  transition: height var(--animation-duration) ease-in-out;
	  display: flex;
	  flex-direction: row;
	  align-items: stretch;
	  justify-content: space-between;
	}
  
	.turns-box-container {
	  flex: 1;
	  display: flex;
	  flex-direction: column;
	  align-items: stretch;
	  justify-content: stretch;
	  height: 100%;
	  min-width: 0;
	}
  
	.pictograph-container {
	  cursor: default;
	  display: flex;
	  justify-content: center;
	  align-items: center;
	}
  </style>