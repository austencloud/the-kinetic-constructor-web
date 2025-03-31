<!-- src/lib/components/SequenceWorkbench/SequenceWidget.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	
	// Components
	import IndicatorLabel from './Labels/IndicatorLabel.svelte';
	import CurrentWordLabel from './Labels/CurrentWordLabel.svelte';
	import DifficultyLabel from './Labels/DifficultyLabel.svelte';
	import SequenceWidgetButtonPanel from './ButtonPanel/SequenceWidgetButtonPanel.svelte';
	import BeatFrame from './SequenceBeatFrame/SequenceBeatFrame.svelte';
	
	// Props
	export let sequenceWorkbenchHeight: number;
	
	// State
	let width = 0;
	let height = 0;
	let isPortrait = true;
	let sequenceWidgetElement: HTMLElement;
	
	// Derived state
	$: currentWord = 'Word:'; // This could be from a store in a real application
	$: difficultyLevel = 3; // This could be from a store too
	$: indicatorText = 'Ready'; // Status or other indicator text
	
	// Update layout when dimensions change
	function updateLayout() {
	  if (!browser) return;
	  
	  width = window.innerWidth;
	  height = window.innerHeight;
	  isPortrait = height > width;
	}
	
	// Initialize on mount
	onMount(() => {
	  if (!browser) return;
	  
	  updateLayout();
	  window.addEventListener('resize', updateLayout);
	  
	  // Clean up on unmount
	  return () => {
		window.removeEventListener('resize', updateLayout);
	  };
	});
	
	// Event handlers
	function handleButtonAction(event: CustomEvent<{ id: string }>) {
	  const { id } = event.detail;
	  console.log(`Button action: ${id}`);
	  
	  // Handle the action based on the ID
	  // This would dispatch to the appropriate store/service
	  switch (id) {
		case 'addToDictionary':
		  // Add to dictionary logic
		  break;
		case 'saveImage':
		  // Save image logic
		  break;
		// ... other cases
	  }
	}
  </script>
  
  <div class="sequence-widget" bind:this={sequenceWidgetElement}>
	<div class="main-layout" class:portrait={isPortrait}>
	  <div class="left-vbox">
		<div class="centered-group">
		  <div class="sequence-widget-labels">
			<CurrentWordLabel currentWord={currentWord} {width} />
			<DifficultyLabel difficultyLevel={difficultyLevel} {width} />
		  </div>
		  
		  <div class="beat-frame-container">
			<BeatFrame />
		  </div>
		</div>
		
		<div class="indicator-label-container">
		  <IndicatorLabel text={indicatorText} {width} />
		</div>
  
		<!-- Button Panel in portrait mode -->
		{#if isPortrait}
		  <SequenceWidgetButtonPanel 
			{isPortrait} 
			containerWidth={width} 
			containerHeight={height} 
			on:action={handleButtonAction}
		  />
		{/if}
	  </div>
  
	  <!-- Button Panel in landscape mode -->
	  {#if !isPortrait}
		<SequenceWidgetButtonPanel
		  {isPortrait}
		  containerWidth={width}
		  containerHeight={sequenceWorkbenchHeight}
		  on:action={handleButtonAction}
		/>
	  {/if}
	</div>
  </div>
  
  <style>
	.sequence-widget {
	  display: flex;
	  flex-direction: column;
	  height: 100%;
	  flex: 1;
	}
  
	.main-layout {
	  display: flex;
	  flex-direction: row;
	  height: 100%;
	}
  
	.main-layout.portrait {
	  flex-direction: column;
	}
  
	.left-vbox {
	  display: flex;
	  flex-direction: column;
	  height: 100%;
	  width: 100%;
	  min-height: 0;
	  flex: 14;
	}
  
	.centered-group {
	  display: flex;
	  flex-direction: column;
	  align-items: center;
	  justify-content: center;
	  height: 100%;
	  width: 100%;
	}
  
	.beat-frame-container {
	  display: flex;
	  align-items: center;
	  justify-content: center;
	  flex: 1;
	  min-height: 0;
	  width: 100%;
	}
  
	.sequence-widget-labels {
	  display: flex;
	  flex-direction: column;
	  align-items: center;
	  justify-content: center;
	  gap: 10px;
	  color: white;
	}
  
	.indicator-label-container {
	  display: flex;
	  flex-direction: column;
	  align-items: center;
	  justify-content: center;
	  padding: 10px;
	  color: white;
	  flex: 1;
	}
  </style>