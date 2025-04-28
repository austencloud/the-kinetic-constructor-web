<script lang="ts">
	import { fade, crossfade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { PictographData } from '$lib/types/PictographData';

	import LoadingMessage from './messages/LoadingMessage.svelte';
	import EmptyMessage from './messages/EmptyMessage.svelte';
	import OptionsPanel from './OptionsPanel.svelte';

	// --- Props ---
	export let isLoading: boolean;
	export let selectedTab: string | null; // Can be 'all' or category key
	export let optionsToDisplay: PictographData[]; // The options relevant to the current view
	export let hasCategories: boolean; // Whether any categories actually exist

	// --- Display State ---
	$: hasOptions = optionsToDisplay.length > 0;

	// --- Stack State ---
	let currentStackIndex = 0;
	let stackKey = selectedTab || 'default';

	// Setup crossfade effect
	const [send, receive] = crossfade({
		duration: 300,
		easing: cubicOut,
		fallback(node) {
			return fade(node, { duration: 250, easing: cubicOut });
		}
	});

	// Update stack indices when content changes
	$: {
		if (isLoading) {
			currentStackIndex = 0;
		} else if (hasOptions && selectedTab) {
			currentStackIndex = 1;
		} else {
			currentStackIndex = 2;
		}
	}

	// Update stack key when tab changes to force re-render
	$: {
		if (selectedTab) {
			stackKey = selectedTab;
		}
	}

	// --- Message Logic ---
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
	<div class="stack-container">
		{#if isLoading}
			<div class="stack-layer active" in:receive={{ key: 'loading' }} out:send={{ key: 'loading' }}>
				<div class="stack-content">
					<LoadingMessage />
				</div>
			</div>
		{:else if hasOptions && selectedTab}
			<div
				class="stack-layer active"
				in:receive={{ key: `options-${stackKey}` }}
				out:send={{ key: `options-${stackKey}` }}
			>
				<div class="stack-content">
					<OptionsPanel options={optionsToDisplay} {selectedTab} />
				</div>
			</div>
		{:else if messageType === 'empty' || messageType === 'initial'}
			<div
				class="stack-layer active"
				in:receive={{ key: `message-${messageType}` }}
				out:send={{ key: `message-${messageType}` }}
			>
				<div class="stack-content">
					<EmptyMessage type={messageType} message={messageText} />
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.option-display-area {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
	}

	.stack-container {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
	}

	.stack-layer {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		pointer-events: none;
		z-index: 0;
	}

	.stack-layer.active {
		opacity: 1;
		pointer-events: auto;
		z-index: 1;
	}

	.stack-content {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		will-change: opacity, transform;
	}
</style>
