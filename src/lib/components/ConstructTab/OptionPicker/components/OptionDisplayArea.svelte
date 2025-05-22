<script lang="ts">
	import { fade, crossfade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import type { PictographData } from '$lib/types/PictographData';
	import LoadingMessage from './messages/LoadingMessage.svelte';
	import EmptyMessage from './messages/EmptyMessage.svelte';
	import OptionsPanel from './OptionsPanel/OptionsPanel.svelte';

	// Create a crossfade transition for smooth tab switching
	const [send, receive] = crossfade({
		duration: 350,
		easing: quintOut,
		fallback(node) {
			return fade(node, { duration: 300 });
		}
	});

	// Props using Svelte 5 runes
	const props = $props<{
		isLoading: boolean;
		selectedTab: string | null;
		optionsToDisplay?: PictographData[];
		hasCategories: boolean;
	}>();

	// Set default values
	$effect(() => {
		if (!props.optionsToDisplay) props.optionsToDisplay = [];
	});

	/* ───────────── what we're going to show ───────────── */
	let hasOptions = $state(false);
	let displayState = $state<'loading' | 'empty' | 'options'>('loading');
	let messageText = $state('');

	// Update display state based on props
	$effect(() => {
		// Ensure optionsToDisplay is an array and log its length for debugging
		const options = Array.isArray(props.optionsToDisplay) ? props.optionsToDisplay : [];
		console.log('OptionDisplayArea: Options length:', options.length);

		// Update hasOptions - this is critical for determining whether to show options or an empty state
		hasOptions = options.length > 0;

		// Determine display state
		if (props.isLoading) {
			displayState = 'loading';
			messageText = 'Loading options...';
			console.log('OptionDisplayArea: Loading state');
		} else if (!hasOptions) {
			displayState = 'empty';

			// Set appropriate message text
			const currentTab = String(props.selectedTab || '');

			// Check if we're in "Show All" view
			const isShowAllView = !props.hasCategories || currentTab === 'all';

			if (isShowAllView) {
				// Generic message for "Show All" view
				messageText = 'No options available for the current position.';
			} else if (currentTab) {
				// Specific message for category tabs
				messageText = `No options available in the "${currentTab}" category.`;
			} else {
				// Fallback message
				messageText = 'No options available.';
			}

			// Debug logging
			console.log('OptionDisplayArea: Empty state with message:', {
				message: messageText,
				isShowAllView,
				currentTab,
				hasCategories: props.hasCategories,
				optionsLength: options.length
			});
		} else {
			displayState = 'options';
			console.log('OptionDisplayArea: Options state with', options.length, 'options');
		}
	});

	// Add a second effect to force a re-evaluation after a short delay
	// This helps with timing issues during initialization
	$effect(() => {
		if (typeof window !== 'undefined' && props.optionsToDisplay) {
			// Force a re-evaluation after a short delay to ensure we have the latest data
			setTimeout(() => {
				const options = Array.isArray(props.optionsToDisplay) ? props.optionsToDisplay : [];
				if (options.length > 0 && displayState === 'empty') {
					console.log('OptionDisplayArea: Forcing update from empty to options state');
					displayState = 'options';
					hasOptions = true;
				}
			}, 100);
		}
	});
</script>

<div class="display-wrapper">
	{#key props.selectedTab}
		{#if displayState === 'loading'}
			<div
				class="absolute-content"
				in:receive={{ key: `content-${props.selectedTab}-loading` }}
				out:send={{ key: `content-${props.selectedTab}-loading` }}
			>
				<LoadingMessage />
			</div>
		{:else if displayState === 'empty'}
			<div
				class="absolute-content"
				in:receive={{ key: `content-${props.selectedTab}-empty` }}
				out:send={{ key: `content-${props.selectedTab}-empty` }}
			>
				<EmptyMessage type="empty" message={messageText} />
			</div>
		{:else}
			<div
				class="absolute-content"
				in:receive={{ key: `content-${props.selectedTab}-options` }}
				out:send={{ key: `content-${props.selectedTab}-options` }}
			>
				<OptionsPanel
					options={props.optionsToDisplay}
					selectedTab={props.selectedTab}
					transitionKey={props.selectedTab}
				/>
			</div>
		{/if}
	{/key}
</div>

<style>
	.display-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.absolute-content {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>
