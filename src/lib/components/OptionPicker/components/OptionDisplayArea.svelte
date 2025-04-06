<!-- src/lib/components/OptionPicker/components/OptionDisplayArea.svelte -->
<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { PictographData } from '$lib/types/PictographData';
	import type { ResponsiveLayoutConfig } from '../config';
  
	import LoadingMessage from './messages/LoadingMessage.svelte';
	import EmptyMessage from './messages/EmptyMessage.svelte';
	import OptionsPanel from './OptionsPanel.svelte';
  
	// Required props
	export let isLoading: boolean;
	export let showAllActive: boolean;
	export let selectedTab: string | null;
	export let currentOptions: PictographData[];
	export let filteredOptions: PictographData[];
	export let layout: ResponsiveLayoutConfig;
	export let isMobileDevice: boolean;
	export let categoryKeys: string[];
	export let isPortraitMode: boolean = false;
  
	// Reactive values
	$: displayOptions = showAllActive ? filteredOptions : currentOptions;
	$: hasOptions = displayOptions.length > 0;
	$: hasCategories = categoryKeys.length > 0;
  
	// Determine message type and content
	$: emptyMessageType = isLoading ? null : 
	  !hasOptions ? (
		showAllActive || (selectedTab && !hasOptions) ? 'empty' : 
		!selectedTab && hasCategories ? 'initial' : 'empty'
	  ) : null;
	
	$: emptyMessageText = (() => {
	  if (emptyMessageType === 'empty') {
		if (showAllActive) return 'No options match current filters.';
		if (selectedTab) return `No options available for ${selectedTab}.`;
		return 'No options generated.';
	  }
	  return 'Select a category above...';
	})();
	
	// Generate a unique key for each set of options
	$: panelKey = showAllActive ? 'all' : (selectedTab || 'none');
  </script>
  
  <div class="option-display-area">
	{#if isLoading}
	  <div class="message-container" transition:fade={{ duration: 200 }}>
		<LoadingMessage />
	  </div>
	{:else if hasOptions}
	  <div class="panels-stack">
		{#key panelKey}
		  <OptionsPanel
			{selectedTab}
			options={displayOptions}
			{layout}
			{isMobileDevice}
			{isPortraitMode}
		  />
		{/key}
	  </div>
	{:else if emptyMessageType}
	  <div class="message-container" transition:fade={{ duration: 200 }}>
		<EmptyMessage type={emptyMessageType as 'empty' | 'initial'} message={emptyMessageText} />
	  </div>
	{/if}
  </div>
  
  <style>
	.option-display-area {
	  width: 100%;
	  height: 100%;
	  position: relative;
	  overflow: hidden;
	}
  
	.panels-stack {
	  width: 100%;
	  height: 100%;
	  position: relative;
	}
	
	.message-container {
	  position: absolute;
	  width: 100%;
	  height: 100%;
	  display: flex;
	  justify-content: center;
	  align-items: center;
	}
  </style>