<script lang="ts">
	// Removed fade import
	import type { PictographData } from '$lib/types/PictographData';
	import LoadingMessage from './messages/LoadingMessage.svelte';
	import EmptyMessage from './messages/EmptyMessage.svelte';
	import OptionsPanel from './OptionsPanel/OptionsPanel.svelte';
	// Removed any transition containers or imports

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
		// Update hasOptions
		hasOptions = props.optionsToDisplay && props.optionsToDisplay.length > 0;

		console.log('Display state calculation:', {
			isLoading: props.isLoading,
			hasOptions,
			selectedTab: props.selectedTab,
			optionsCount: props.optionsToDisplay?.length || 0
		});

		// Determine display state
		if (props.isLoading) {
			displayState = 'loading';
			messageText = 'Loading options...';
		} else if (!hasOptions) {
			displayState = 'empty';

			// Set appropriate message text
			if (props.selectedTab === 'all') {
				messageText = 'No options available for the current position.';
			} else if (props.selectedTab) {
				messageText = `No options available in the "${props.selectedTab}" category.`;
			} else {
				messageText = 'No options available.';
			}
		} else {
			displayState = 'options';
		}
	});
</script>

<div class="display-wrapper">
	{#if displayState === 'loading'}
		<div class="absolute-content">
			<LoadingMessage />
		</div>
	{:else if displayState === 'empty'}
		<div class="absolute-content">
			<EmptyMessage type="empty" message={messageText} />
		</div>
	{:else}
		<div class="absolute-content">
			<OptionsPanel options={props.optionsToDisplay} selectedTab={props.selectedTab} />
		</div>
	{/if}
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
