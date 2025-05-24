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
		onoptionselect?: (option: PictographData) => void;
	}>();

	// Handle option selection events from OptionsPanel
	function handleOptionSelect(option: PictographData) {
		// Call the callback if provided
		if (props.onoptionselect) {
			props.onoptionselect(option);
		}
	}

	// Set default values
	$effect(() => {
		if (!props.optionsToDisplay) props.optionsToDisplay = [];
	});

	/* ───────────── what we're going to show ───────────── */
	let hasOptions = $state(false);
	let displayState = $state<'loading' | 'empty' | 'options'>('loading');
	let messageText = $state('');

	// Simplify display state logic - FIXED: Removed untrack() to enable reactivity
	$effect(() => {
		const options = Array.isArray(props.optionsToDisplay) ? props.optionsToDisplay : [];

		hasOptions = options.length > 0;

		if (props.isLoading) {
			displayState = 'loading';
			messageText = 'Loading options...';
		} else if (!hasOptions) {
			displayState = 'empty';
			const currentTab = String(props.selectedTab || '');
			const isShowAllView = !props.hasCategories || currentTab === 'all';

			messageText = isShowAllView
				? 'No options available for the current position.'
				: `No options available in the "${currentTab}" category.`;
		} else {
			displayState = 'options';
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
					onoptionselect={handleOptionSelect}
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
