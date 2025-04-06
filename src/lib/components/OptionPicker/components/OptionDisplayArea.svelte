<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { PictographData } from '$lib/types/PictographData';

	import LoadingMessage from './messages/LoadingMessage.svelte';
	import EmptyMessage from './messages/EmptyMessage.svelte';
	import OptionsPanel from './OptionsPanel.svelte';

	// --- Props ---
	export let isLoading: boolean;
	export let selectedTab: string | null; // Can be 'all' or category key
	export let optionsToDisplay: PictographData[]; // The options relevant to the current view
	export let panelKey: string; // Key for transitions ('all', category key, or 'none')
	export let hasCategories: boolean; // Whether any categories actually exist

	// --- Display State ---
	// Determine if options exist based on the passed-in list
	$: hasOptions = optionsToDisplay.length > 0;

	// --- Message Logic ---
	// Determine message type based on loading state and whether options exist for the current view
	$: messageType = determineMessageType(isLoading, hasOptions, selectedTab, hasCategories);
	$: messageText = generateMessageText(messageType, selectedTab);

	// --- Helper Functions ---
	function determineMessageType(
		loading: boolean,
		optionsExist: boolean,
		tab: string | null,
		categoriesExist: boolean
	): 'loading' | 'empty' | 'initial' | null {
		if (loading) return 'loading';
		if (!optionsExist) {
			// If 'all' is selected and no options, or a category is selected and no options
			if (tab) return 'empty';
			// If no tab selected (shouldn't happen with 'all' default) but categories exist
			if (!tab && categoriesExist) return 'initial'; // Show "Select category"
			// If no tab selected and no categories exist (or any other edge case)
			return 'empty'; // Default to empty
		}
		return null; // Options exist, no message needed
	}

	function generateMessageText(
		type: 'loading' | 'empty' | 'initial' | null,
		tab: string | null
	): string {
		if (type === 'empty') {
			if (tab === 'all') return 'No options match current filters.'; // Message for 'all' view
			if (tab) return `No options available for ${tab}.`; // Message for specific category
			return 'No options generated.'; // Generic fallback
		}
		if (type === 'initial') {
			return 'Select a category above...'; // Should be less common now
		}
		return ''; // No message text needed
	}
</script>

<div class="option-display-area">
	{#if messageType === 'loading'}
		<div class="message-container" transition:fade={{ duration: 200 }}>
			<LoadingMessage />
		</div>
	{:else if hasOptions}
		<div class="panels-stack">
			{#key panelKey}
				<OptionsPanel
					selectedTab={panelKey} options={optionsToDisplay} />
			{/key}
		</div>
	{:else if messageType === 'empty' || messageType === 'initial'}
		<div class="message-container" transition:fade={{ duration: 200 }}>
			<EmptyMessage type={messageType} message={messageText} />
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
		z-index: 5; /* Ensure messages are above panel content if needed */
	}
</style>
