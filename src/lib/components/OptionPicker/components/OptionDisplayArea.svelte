<script lang="ts">
	import { getContext } from 'svelte'; // Import getContext
	import { fade } from 'svelte/transition';
	import type { PictographData } from '$lib/types/PictographData';
	// REMOVED: import type { ResponsiveLayoutConfig } from '../config';
	import { LAYOUT_CONTEXT_KEY, type LayoutContext } from '../layoutContext'; // Import context key and type

	import LoadingMessage from './messages/LoadingMessage.svelte';
	import EmptyMessage from './messages/EmptyMessage.svelte';
	import OptionsPanel from './OptionsPanel.svelte';

	// Props - fewer needed
	export let isLoading: boolean;
	export let showAllActive: boolean;
	export let selectedTab: string | null;
	export let currentOptions: PictographData[];
	export let filteredOptions: PictographData[];
	export let categoryKeys: string[];
	// REMOVED: layout, isMobileDevice, isPortraitMode

	// Consume context
	// We don't strictly need to assign it here if only used in the template via $layoutContext
	// const layoutContext = getContext<LayoutContext>(LAYOUT_CONTEXT_KEY);

	// Display state (uses props)
	$: displayState = {
		options: showAllActive ? filteredOptions : currentOptions,
		hasOptions: (showAllActive ? filteredOptions : currentOptions).length > 0,
		hasCategories: categoryKeys.length > 0,
		panelKey: showAllActive ? 'all' : selectedTab || 'none'
	};

	// Message logic (uses props)
	$: messageType = determineMessageType(
		isLoading,
		displayState.hasOptions,
		showAllActive,
		selectedTab,
		displayState.hasCategories
	);
	$: messageText = generateMessageText(messageType, showAllActive, selectedTab);

	// Helper functions (remain the same)
	function determineMessageType(
		loading: boolean,
		hasOptions: boolean,
		showAll: boolean,
		tab: string | null,
		hasCategories: boolean
	): 'loading' | 'empty' | 'initial' | null {
		if (loading) return 'loading';
		if (!hasOptions) {
			if (showAll || (tab && !hasOptions)) return 'empty';
			if (!tab && hasCategories) return 'initial';
			return 'empty';
		}
		return null;
	}

	function generateMessageText(
		type: 'loading' | 'empty' | 'initial' | null,
		showAll: boolean,
		tab: string | null
	): string {
		if (type === 'empty') {
			if (showAll) return 'No options match current filters.';
			if (tab) return `No options available for ${tab}.`;
			return 'No options generated.';
		}
		if (type === 'initial') {
			return 'Select a category above...';
		}
		return '';
	}
</script>

<div class="option-display-area">
	{#if messageType === 'loading'}
		<div class="message-container" transition:fade={{ duration: 200 }}>
			<LoadingMessage />
		</div>
	{:else if displayState.hasOptions}
		<div class="panels-stack">
			{#key displayState.panelKey}
				<OptionsPanel
					{selectedTab}
					options={displayState.options}
					/>
			{/key}
		</div>
	{:else if messageType === 'empty' || messageType === 'initial'}
		<div class="message-container" transition:fade={{ duration: 200 }}>
			<EmptyMessage type={messageType} message={messageText} />
		</div>
	{/if}
</div>

<style>
	/* Styles remain the same */
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
