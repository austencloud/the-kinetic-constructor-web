<!-- src/lib/components/SequenceWorkbench/ButtonPanel/SequenceWidgetButtonPanel.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import MetallicButton from '$lib/components/common/MetallicButton.svelte';
	
	// Define types
	type LayoutOrientation = 'vertical' | 'horizontal';
	type ButtonVariant = 'blue' | 'dark';
	
	interface ButtonDefinition {
	  icon: string;
	  title: string;
	  id: string;
	}
  
	// Component props
	export let containerWidth = 0;
	export let containerHeight = 0;
	export let isPortrait = true;
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
	  action: { id: string };
	}>();
  
	// Reactive layout orientation based on isPortrait
	$: layout = isPortrait ? 'horizontal' : 'vertical';
  
	// Button data with appropriate actions
	const buttons: ButtonDefinition[] = [
	  {
		icon: '/button_panel_icons/add_to_dictionary.png',
		title: 'Add to Dictionary',
		id: 'addToDictionary'
	  },
	  {
		icon: '/button_panel_icons/save_image.png',
		title: 'Save Image',
		id: 'saveImage'
	  },
	  {
		icon: '/button_panel_icons/eye.png',
		title: 'View Full Screen',
		id: 'viewFullScreen'
	  },
	  {
		icon: '/button_panel_icons/mirror.png',
		title: 'Mirror Sequence',
		id: 'mirrorSequence'
	  },
	  {
		icon: '/button_panel_icons/yinyang1.png',
		title: 'Swap Colors',
		id: 'swapColors'
	  },
	  {
		icon: '/button_panel_icons/rotate.png',
		title: 'Rotate Sequence',
		id: 'rotateSequence'
	  },
	  {
		icon: '/button_panel_icons/delete.png',
		title: 'Delete Beat',
		id: 'deleteBeat'
	  },
	  {
		icon: '/button_panel_icons/clear.png',
		title: 'Clear Sequence',
		id: 'clearSequence'
	  }
	];
  
	// Reactive button size calculation
	$: buttonSize = calculateButtonSize(containerWidth, containerHeight, isPortrait);
	
	// Handle button click
	function handleButtonClick(id: string) {
	  // Dispatch to both event listeners and document events for backward compatibility
	  dispatch('action', { id });
	  
	  // Legacy event dispatch for backward compatibility
	  const event = new CustomEvent('action', {
		detail: { action: id },
		bubbles: true
	  });
	  document.dispatchEvent(event);
	}
  
	// Calculate button size based on container dimensions and orientation
	function calculateButtonSize(width: number, height: number, isPortrait: boolean): number {
	  const isMobile = width <= 768;
  
	  if (isMobile) {
		return Math.max(30, Math.min(60, width / 10));
	  } else if (isPortrait) {
		return Math.max(30, Math.min(60, width / 10));
	  } else {
		return Math.max(30, Math.min(60, height / 14));
	  }
	}
  </script>
  
  <div
	class="button-panel"
	class:vertical={layout === 'vertical'}
	class:horizontal={layout === 'horizontal'}
  >
	{#each buttons as button (button.id)}
	  <div class="button-container" style="width: {buttonSize}px; height: {buttonSize}px;">
		<MetallicButton
		  icon={button.icon}
		  variant="dark"
		  size="small"
		  customClass="circular-button"
		  on:click={() => handleButtonClick(button.id)}
		  title={button.title}
		/>
	  </div>
	{/each}
  </div>
  
  <style>
	.button-panel {
	  display: flex;
	  justify-content: center;
	  align-items: center;
	  gap: 8px;
	  flex: 1;
	  padding: 5px;
	  border-radius: 8px;
	}
  
	.vertical {
	  flex-direction: column;
	}
  
	.horizontal {
	  flex-direction: row;
	}
	
	.button-container {
	  display: flex;
	  justify-content: center;
	  align-items: center;
	}
	
	/* These styles will be applied to the MetallicButton via customClass */
	:global(.circular-button) {
	  border-radius: 50% !important;
	  aspect-ratio: 1 / 1 !important;
	  padding: 0 !important;
	  display: flex !important;
	  justify-content: center !important;
	  align-items: center !important;
	  width: 100% !important;
	  height: 100% !important;
	}
	
	:global(.circular-button span) {
	  display: none;
	}
	
	:global(.circular-button .icon) {
	  margin: 0 !important;
	  width: 100% !important;
	  height: 100% !important;
	  display: flex !important;
	  justify-content: center !important;
	  align-items: center !important;
	}
	
	:global(.circular-button .icon img) {
	  width: 60% !important;
	  height: 60% !important;
	  object-fit: contain !important;
	}
  </style>