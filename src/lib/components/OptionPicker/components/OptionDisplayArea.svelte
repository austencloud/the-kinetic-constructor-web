<script lang="ts">
	import type { PictographData } from '$lib/types/PictographData';
	import type { ResponsiveLayoutConfig } from '../utils/layoutConfig/layoutUtils';

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
</script>

<div class="option-display-area">
	{#if isLoading}
		<LoadingMessage />
	{:else if hasOptions}
		<OptionsPanel
			selectedTab={showAllActive ? 'all' : selectedTab}
			options={displayOptions}
			{layout}
			{isMobileDevice}
		/>
	{:else if emptyMessageType}
		+ <EmptyMessage type={emptyMessageType as 'empty' | 'initial'} message={emptyMessageText} />
	{/if}
</div>

<style>
	.option-display-area {
		width: 100%;
		height: 100%;
		position: relative; 
		display: flex; 
		justify-content: center; 
		align-items: center; 
	}

	:global(.option-display-area > *) {
		width: 100%;
		height: 100%;
	}
</style>
