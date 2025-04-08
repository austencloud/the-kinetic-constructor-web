

<script lang="ts">
	import { fade, crossfade } from 'svelte/transition'; // Import crossfade
	import { quintOut } from 'svelte/easing'; // Import easing for crossfade
	import type { PictographData } from '$lib/types/PictographData';

	import LoadingMessage from './messages/LoadingMessage.svelte';
	import EmptyMessage from './messages/EmptyMessage.svelte';
	import OptionsPanel from './OptionsPanel.svelte'; // The refactored panel

	// --- Props ---
	export let isLoading: boolean;
	export let selectedTab: string | null; // Can be 'all' or category key
	export let optionsToDisplay: PictographData[]; // The options relevant to the current view
	export let panelKey: string; // Key for transitions ('all', category key, or 'none')
	export let hasCategories: boolean; // Whether any categories actually exist

	// --- Display State ---
	$: hasOptions = optionsToDisplay.length > 0;

	// --- Message Logic ---
	$: messageType = determineMessageType(isLoading, hasOptions, selectedTab, hasCategories);
	$: messageText = generateMessageText(messageType, selectedTab);

	// --- Transitions ---
	// Create the crossfade transition pair
	const [send, receive] = crossfade({
		duration: 500, // Using a fixed duration often works well
		// duration: (d) => Math.sqrt(d * 200), // Original example duration calculation
		fallback(node, params) {
			const style = getComputedStyle(node);
			const transform = style.transform === 'none' ? '' : style.transform;
			return {
				duration: 500, // Slightly faster fallback fade
				easing: quintOut,
				css: (t) => `
					transform: ${transform} scale(${t * 0.9 + 0.1}); // Fade + slight scale
					opacity: ${t}
				`
			};
		}
	});


	// --- Helper Functions ---
	function determineMessageType(
		loading: boolean,
		optionsExist: boolean,
		tab: string | null,
		categoriesExist: boolean
	): 'loading' | 'empty' | 'initial' | null {
		if (loading) return 'loading';
		if (!optionsExist) {
			if (tab) return 'empty';
			if (!tab && categoriesExist) return 'initial'; // Show "Select category"
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
		<div class="message-container" transition:fade={{ duration: 150 }}>
			<LoadingMessage />
		</div>
	{:else if hasOptions}
		<div class="panels-stack">
			{#key panelKey}
				<div
					class="panel-wrapper"
					in:receive={{ key: panelKey }}
					out:send={{ key: panelKey }}
				>
					<OptionsPanel
						options={optionsToDisplay}
						{selectedTab}
					/>
				</div>
			{/key}
		</div>
	{:else if messageType === 'empty' || messageType === 'initial'}
		<div class="message-container" transition:fade={{ duration: 150 }}>
			<EmptyMessage type={messageType} message={messageText} />
		</div>
	{/if}
</div>

<style>
	.option-display-area {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden; /* Keep hidden to contain transitions */
	}

	.panels-stack {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden; /* Critical for containing panels while allowing inner scroll */
	}

	/* Wrapper div for applying transitions */
	.panel-wrapper {
		position: absolute; /* Important for crossfade */
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		/* Ensure it doesn't prevent interaction with panel content */
		pointer-events: auto;
		/* Add background for smoother visual transition if needed */
		/* background-color: var(--background-color, transparent); */
	}

	.message-container {
		position: absolute;
		top: 0; /* Ensure messages overlay correctly */
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 5;
		pointer-events: none; /* Allow clicks through message area */
	}
</style>
