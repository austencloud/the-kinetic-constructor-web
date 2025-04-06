<script lang="ts">
	import type { PictographData } from '$lib/types/PictographData';
	import type { ResponsiveLayoutConfig } from '../utils/layoutConfig/layoutUtils';
	import { fade } from 'svelte/transition';

	import LoadingMessage from './messages/LoadingMessage.svelte';
	import EmptyMessage from './messages/EmptyMessage.svelte';
	import OptionsPanel from './OptionsPanel.svelte';

	export let isLoading: boolean;
	export let showAllActive: boolean;
	export let selectedTab: string | null;
	export let currentOptions: PictographData[];
	export let filteredOptions: PictographData[];
	export let layout: ResponsiveLayoutConfig;
	export let isMobileDevice: boolean;
	export let categoryKeys: string[];
	export let isPortraitMode: boolean = false;

	$: displayOptions = showAllActive ? filteredOptions : currentOptions;
	$: hasOptions = displayOptions.length > 0;
	$: hasCategories = categoryKeys.length > 0;
	$: emptyMessageType = (() => {
		if (isLoading) return null;
		if (showAllActive && !hasOptions) return 'empty';
		if (!showAllActive && selectedTab && !hasOptions) return 'empty';
		if (!showAllActive && !selectedTab && hasCategories) return 'initial';
		if (!showAllActive && !hasCategories) return 'empty';
		return hasOptions ? null : 'empty';
	})();
	$: emptyMessageText = (() => {
		if (emptyMessageType === 'empty') {
			if (showAllActive) return 'No options generated or match current filters.';
			if (selectedTab)
				return `No options available for ${selectedTab}${!showAllActive ? ' (based on current filters)' : ''}`;
			return 'No options generated.';
		}
		if (emptyMessageType === 'initial') {
			return 'Select a category above...';
		}
		return '';
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
		<!-- Here's our stack of option panels - only one will be visible at a time -->
		<div class="panels-stack">
			<!-- Use the key attribute so Svelte recreates this when options change -->
			{#key panelKey}
				<OptionsPanel
					selectedTab={panelKey}
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