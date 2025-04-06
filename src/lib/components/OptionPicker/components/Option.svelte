<!-- src/lib/components/OptionPicker/components/Option.svelte -->
<script lang="ts">
	import Pictograph from '../../Pictograph/Pictograph.svelte';
	import { writable } from 'svelte/store';
	import type { PictographData } from '$lib/types/PictographData';
	import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';
	import { onMount } from 'svelte';
	import { optionPickerStore } from '../store';
	
	// --- Props ---
	export let pictographData: PictographData;
	export let isPartOfTwoItems: boolean = false;
  
	// --- State ---
	let isMobileDevice = false;
	let containerWidth = 0;
	let containerElement: HTMLElement;
  
	// --- Reactive Computations ---
	$: isSelected = $selectedPictograph === pictographData;
	$: scaleFactor = getScaleFactor(isPartOfTwoItems, isMobileDevice, containerWidth);
	$: ariaLabel = `Select option ${pictographData.letter || 'Unnamed'}`;
  
	// Simplified scale factor calculation
	function getScaleFactor(
	  isPartOfTwo: boolean,
	  isMobile: boolean,
	  width: number
	): number {
	  // Default scale factor
	  const baseFactor = isMobile ? 0.95 : 1.0;
	  
	  // Simple size-based adjustment
	  if (width > 150) return baseFactor; 
	  if (width < 80) return baseFactor * 0.9;
	  
	  // Special case for two items
	  if (isPartOfTwo) return baseFactor * 0.95;
	  
	  return baseFactor;
	}
  
	onMount(() => {
	  // Simple mobile detection
	  isMobileDevice = window.innerWidth <= 480;
	  
	  // Set initial container width
	  containerWidth = containerElement?.clientWidth ?? 0;
	  
	  // Set up resize observer if available
	  if (typeof ResizeObserver !== 'undefined' && containerElement) {
		const resizeObserver = new ResizeObserver(entries => {
		  const entry = entries[0];
		  if (entry) {
			containerWidth = entry.contentRect.width;
		  }
		});
		
		resizeObserver.observe(containerElement);
		
		return () => {
		  resizeObserver.disconnect();
		};
	  }
	});
  
	function handleSelect() {
	  optionPickerStore.selectOption(pictographData);
	}
  
	const pictographDataStore = writable(pictographData);
	$: pictographDataStore.set(pictographData);
  </script>
  
  <div
	class="option"
	class:mobile={isMobileDevice}
	class:selected={isSelected}
	class:two-item-option={isPartOfTwoItems}
	bind:this={containerElement}
	role="button"
	tabindex="0"
	on:click={handleSelect}
	on:keydown={(e) => e.key === 'Enter' && handleSelect()}
	aria-label={ariaLabel}
	aria-pressed={isSelected}
  >
	<div class="pictograph-container" style="transform: scale({scaleFactor})">
	  <Pictograph {pictographDataStore} />
	</div>
  </div>
  
  <style>
	.option {
	  position: relative;
	  display: flex;
	  justify-content: center;
	  align-items: center;
	  width: 100%;
	  height: 100%;
	  cursor: pointer;
	  transition: transform 0.2s ease-in-out, background-color 0.2s ease;
	  border-radius: 6px;
	  outline: none;
	  overflow: hidden;
	}
  
	.pictograph-container {
	  display: flex;
	  justify-content: center;
	  align-items: center;
	  width: 100%;
	  height: 100%;
	  transition: transform 0.2s ease-in-out;
	}
  
	/* Hover effects */
	.option:hover {
	  transform: scale(1.05);
	  background-color: rgba(243, 244, 246, 0.5);
	}
  
	.option:active {
	  transform: scale(0.98);
	}
  
	/* Selection state */
	.option.selected {
	  background-color: rgba(56, 161, 105, 0.1);
	}
  
	/* Special styling for display contexts */
	.option.two-item-option {
	  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
  
	.option.two-item-option:hover {
	  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}
  
	/* Mobile optimizations */
	.option.mobile {
	  transition: transform 0.15s ease-in-out;
	}
  
	.option.mobile:hover {
	  transform: scale(1.03);
	}
  
	/* Accessibility */
	.option:focus-visible {
	  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.6);
	  z-index: 11;
	}
  </style>