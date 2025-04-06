<!-- src/lib/components/OptionPicker/components/OptionPickerHeader.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Motion } from 'svelte-motion';
	import { cubicOut } from 'svelte/easing';
  
	import HeaderControls from './HeaderControls.svelte';
	import SortOptions from './SortOptions.svelte';
	import ShowAllButton from './ShowAllButton.svelte';
  
	// Props
	export let showAllActive: boolean;
	export let isMobileDevice: boolean;
	export let categoryKeys: string[];
	export let selectedTab: string | null;
  
	// Element reference for ResizeObserver
	export let rootElement: HTMLDivElement | null = null;
  
	// Events
	const dispatch = createEventDispatcher<{
	  toggleShowAll: void;
	  tabSelect: string;
	}>();
  
	// Animation configuration - declared once for clarity
	const animations = {
	  transition: {
		duration: 0.4,
		ease: cubicOut
	  },
	  
	  // Content visibility states
	  hidden: {
		opacity: 0,
		scale: 0.9,
		flexGrow: 0,
		flexShrink: 1,
		flexBasis: 0,
		margin: 0,
		pointerEvents: 'none' as const
	  },
	  
	  tabs: {
		visible: {
		  opacity: 1,
		  scale: 1,
		  flexGrow: 1,
		  flexShrink: 1,
		  flexBasis: 'auto',
		  margin: '0 0.25rem',
		  pointerEvents: 'auto' as const
		}
	  },
	  
	  sort: {
		visible: {
		  opacity: 1,
		  scale: 1,
		  flexGrow: 0,
		  flexShrink: 0,
		  flexBasis: 'auto',
		  margin: '0 0.25rem',
		  pointerEvents: 'auto' as const
		}
	  },
	  
	  showAll: {
		normal: { 
		  flexGrow: 0, 
		  flexShrink: 0, 
		  justifyContent: 'flex-start' 
		},
		centered: { 
		  flexGrow: 1, 
		  flexShrink: 0, 
		  justifyContent: 'center' 
		}
	  }
	};
	
	// Reactive animation states
	$: tabsAnimate = showAllActive ? animations.hidden : animations.tabs.visible;
	$: sortAnimate = showAllActive ? animations.hidden : animations.sort.visible;
	$: showAllAnimate = showAllActive ? animations.showAll.centered : animations.showAll.normal;
	
	// Event handlers
	const handleToggleShowAll = () => dispatch('toggleShowAll');
	const handleTabSelect = (tab: string) => dispatch('tabSelect', tab);
  </script>
  
  <div 
	class="option-picker-header" 
	class:mobile={isMobileDevice} 
	bind:this={rootElement}
	data-testid="option-picker-header"
  >
	<div class="header-controls" class:centered-mode={showAllActive}>
	  <Motion
		layout
		animate={showAllAnimate}
		transition={animations.transition}
		initial={false}
		let:motion
	  >
		<div class="show-all-container" use:motion>
		  <ShowAllButton 
			{showAllActive} 
			{isMobileDevice} 
			on:toggle={handleToggleShowAll} 
		  />
		</div>
	  </Motion>
  
	  <Motion 
		layout 
		animate={tabsAnimate} 
		transition={animations.transition} 
		initial={false} 
		let:motion
	  >
		<div class="tabs-container" use:motion>
		  <HeaderControls
			{categoryKeys}
			{selectedTab}
			{isMobileDevice}
			onTabSelect={handleTabSelect}
		  />
		</div>
	  </Motion>
  
	  <Motion 
		layout 
		animate={sortAnimate} 
		transition={animations.transition} 
		initial={false} 
		let:motion
	  >
		<div class="sort-container" use:motion>
		  <SortOptions {isMobileDevice} />
		</div>
	  </Motion>
	</div>
  </div>
  
  <style>
	.option-picker-header {
	  width: 100%;
	  position: relative;
	  margin-bottom: 0.5rem;
	  padding-bottom: 0.5rem;
	  padding-top: 10px;
	  min-height: 50px;
	  box-sizing: border-box;
	}
  
	.option-picker-header.mobile {
	  padding-top: 5px;
	  min-height: 40px;
	  margin-bottom: 0.3rem;
	}
  
	.header-controls {
	  display: flex;
	  align-items: center;
	  width: 100%;
	  flex-wrap: wrap;
	}
  
	.header-controls.centered-mode {
	  justify-content: center;
	}
  
	.show-all-container,
	.tabs-container,
	.sort-container {
	  display: flex;
	  align-items: center;
	  flex-basis: auto;
	}
  
	.show-all-container {
	  flex-shrink: 0;
	  flex-grow: 0;
	}
  
	.tabs-container {
	  justify-content: center;
	  min-width: 0;
	  flex-shrink: 1;
	  flex-grow: 1;
	  overflow: hidden;
	}
  
	.sort-container {
	  justify-content: flex-end;
	  flex-shrink: 0;
	  flex-grow: 0;
	}
  
	@media (max-width: 480px) {
	  .header-controls {
		flex-direction: column;
	  }
  
	  .show-all-container,
	  .tabs-container,
	  .sort-container {
		width: 100%;
		justify-content: center;
		flex-basis: auto !important;
		flex-grow: 1;
		flex-shrink: 0;
		margin: 0.25rem 0;
	  }
  
	  :global(.header-controls .tabs-container[style*='opacity: 0;']),
	  :global(.header-controls .sort-container[style*='opacity: 0;']) {
		margin: 0 !important;
		height: 0;
		overflow: hidden;
	  }
  
	  .tabs-container { order: 2; }
	  .sort-container { order: 3; }
	  .show-all-container { order: 1; }
  
	  .header-controls.centered-mode {
		flex-direction: column;
		justify-content: center;
	  }
	  .header-controls.centered-mode .show-all-container {
		width: 100%;
	  }
	}
  </style>