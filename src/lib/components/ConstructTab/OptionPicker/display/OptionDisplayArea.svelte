<script lang="ts">
	import { fade, crossfade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import type { PictographData } from '$lib/types/PictographData';
	import LoadingMessage from '../components/messages/LoadingMessage.svelte';
	import EmptyMessage from '../components/messages/EmptyMessage.svelte';
	import OptionsPanel from '../components/OptionsPanel/OptionsPanel.svelte';
	import { optionPickerContainer } from '$lib/state/stores/optionPicker/optionPickerContainer';

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
		// Ensure optionsToDisplay is an array
		const options = Array.isArray(props.optionsToDisplay) ? props.optionsToDisplay : [];

		// Update hasOptions
		hasOptions = options.length > 0;

		// Determine display state
		if (props.isLoading) {
			displayState = 'loading';
			messageText = 'Loading options...';
		} else if (!hasOptions) {
			displayState = 'empty';

			// Set appropriate message text
			const currentTab = String(props.selectedTab || '');
			if (currentTab === 'all') {
				messageText = 'No options available for the current position.';
			} else if (currentTab) {
				messageText = `No options available in the "${currentTab}" category.`;
			} else {
				messageText = 'No options available.';
			}
		} else {
			displayState = 'options';
		}
	});

	// Handle option selection
	function handleOptionSelect(event: CustomEvent<PictographData>) {
		const option = event.detail;
		optionPickerContainer.selectOption(option);
	}
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
					on:optionSelect={handleOptionSelect}
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
