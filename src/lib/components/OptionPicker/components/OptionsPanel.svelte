<!-- src/lib/components/OptionPicker/components/OptionsPanel.svelte -->
<script lang="ts">
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Option from './Option.svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import type { ResponsiveLayoutConfig } from '../config';
  
	// Props
	export let selectedTab: string | null = null;
	export let options: PictographData[] = [];
	export let layout: ResponsiveLayoutConfig;
	export let isMobileDevice: boolean = false;
	export let isPortraitMode: boolean = false;
  
	// Destructure layout props reactively
	$: ({ gridColumns, optionSize, gridGap, gridClass, aspectClass } = layout);
  
	// Combine custom style properties
	$: customStyle = `--option-size: ${optionSize}; --grid-gap: ${gridGap};`;
	
	/**
	 * Generate waves of item animations based on grid position
	 */
	function getAnimationDelay(index: number): number {
	  // Simple formula to create a wave pattern (faster and less complex)
	  const columns = parseInt(gridColumns.match(/repeat\((\d+)/)?.[1] || '3');
	  const row = Math.floor(index / columns);
	  const col = index % columns;
	  
	  return (row + col) * 35; // Slightly higher delay looks better visually
	}
  </script>
  
  <div class="options-panel"
	role="tabpanel"
	aria-labelledby="tab-{selectedTab}"
	id="options-panel-{selectedTab}"
	transition:fade={{ duration: 200 }}
  >
	<div
	  class="options-grid {gridClass} {aspectClass}"
	  class:mobile-grid={isMobileDevice}
	  class:tablet-portrait-grid={isMobileDevice && isPortraitMode}
	  style:grid-template-columns={gridColumns}
	  style={customStyle}
	>
	  {#each options as option, i ((option.letter ?? '') + option.startPos + option.endPos + i)}
		<div
		  class="grid-item-wrapper"
		  class:single-item={options.length === 1}
		  class:two-item={options.length === 2}
		  in:fade={{ 
			duration: 300, 
			delay: getAnimationDelay(i), 
			easing: cubicOut 
		  }}
		  out:fade={{ 
			duration: 200, 
			delay: getAnimationDelay(i) * 0.6, 
			easing: cubicOut 
		  }}
		>
		  <Option pictographData={option} isPartOfTwoItems={options.length === 2} />
		</div>
	  {/each}
	</div>
  </div>
  
  <style>
	.options-panel {
	  position: absolute;
	  top: 0;
	  left: 0;
	  width: 100%;
	  height: 100%;
	  display: flex;
	  justify-content: center;
	  align-items: flex-start;
	  padding: 0.5rem;
	  box-sizing: border-box;
	  overflow-y: auto;
	  overflow-x: hidden;
	}
  
	.options-grid {
	  display: grid;
	  width: 100%;
	  max-width: 1200px;
	  justify-items: center;
	  align-content: flex-start;
	  position: relative;
	  grid-gap: var(--grid-gap, 8px);
	  padding: var(--grid-internal-padding, 0.5rem);
	  margin: auto;
	}
  
	/* Container aspect-based styling */
	.wide-aspect-container, .square-aspect-container { align-content: center; }
	.tall-aspect-container { align-content: flex-start; }
  
	/* Grid item wrapper */
	.grid-item-wrapper {
	  width: var(--option-size, 100px);
	  height: var(--option-size, 100px);
	  aspect-ratio: 1 / 1;
	  display: flex;
	  justify-content: center;
	  align-items: center;
	  position: relative;
	  z-index: 1;
	  transition: z-index 0s 0.2s;
	  overflow: hidden;
	}
	
	.grid-item-wrapper:hover {
	  z-index: 10;
	  transition-delay: 0s;
	}
  
	/* Special layouts */
	.single-item-grid {
	  height: auto;
	  padding: 0.5rem;
	  width: fit-content;
	  margin: auto;
	  justify-items: center;
	}
	
	.single-item-grid .grid-item-wrapper {
	  transform: scale(1.1);
	}
  
	.two-item-grid {
	  height: auto;
	  padding: 0.5rem;
	  width: fit-content;
	  margin: auto;
	  justify-items: center;
	}
	
	.two-item-grid .grid-item-wrapper {
	  flex-grow: 0;
	  flex-shrink: 0;
	}
  
	/* Count-based classes */
	.few-items-grid, .medium-items-grid {
	  align-content: center;
	  justify-content: center;
	}
	
	.many-items-grid {
	  justify-content: center;
	  align-content: flex-start;
	}
  
	/* Mobile styling */
	.mobile-grid {
	  padding: 0.2rem;
	  grid-gap: var(--grid-gap, 6px);
	}
	
	.mobile-grid.two-item-grid,
	.mobile-grid.single-item-grid {
	  padding: 0.5rem;
	}
  
	/* Tablet portrait specific styling */
	.tablet-portrait-grid {
	  grid-gap: 0.5rem;
	  padding: 0.25rem;
	}
  
	/* Responsive adjustments */
	@media (min-width: 1280px) {
	  .many-items-grid {
		max-width: 75%;
	  }
	}
  </style>