<script lang="ts">
	import PlaceholderTab from './PlaceholderTab.svelte';
	import SequenceWorkbench from '$lib/components/SequenceWorkbench/Workbench.svelte';
	import OptionPicker from '$lib/components/OptionPicker/OptionPicker.svelte';
	import StartPosPicker from '$lib/components/StartPosPicker/StartPosPicker.svelte';
	import { getTransitionProps } from '../utils/transitionHelpers'; // Keep transition helpers
	import { fly, fade } from 'svelte/transition';

	// --- XState Imports ---
	import { appService } from '../state/store';
	import { useSelector } from '@xstate/svelte';
	import { tabs } from '../state/appState'; // Import tabs definition

	// --- Svelte Stores (If unrelated to main app state) ---
	import { isSequenceEmpty } from '$lib/stores/sequence/sequenceStateStore'; // Keep if separate concern

	// --- Props ---
	// isVisible can be passed down or selected here. Let's select it here for independence.
	// export let isVisible: boolean = true;
	export let useTransitions: boolean = true; // Keep transition flag

	// --- Get State from XState ---
	const state = useSelector(appService, (s) => s);

	// Reactive variables from state snapshot
	$: currentTabIndex = $state.context.currentTab;
	$: previousTabIndex = $state.context.previousTab;
	$: isVisible = $state.context.contentVisible; // Use visibility from machine
	$: currentActiveTab = tabs[currentTabIndex]; // Get tab data using index from context
	$: isSlideRight = currentTabIndex > previousTabIndex;

	// Other reactive stores
	$: isEmpty = $isSequenceEmpty; // Keep if needed

	// Computed transition properties
	$: transitionProps = useTransitions
		? getTransitionProps(currentTabIndex, isSlideRight).props
		: undefined;

	// Determine if content should fade out (handled by machine's contentVisible now)
	// $: isContentFadeOut = $state.matches('ready.tabTransitioning'); // Or based on contentVisible directly
</script>

<div class="tab-content-container">
	{#if isVisible}
		{#key currentActiveTab.id}
			{#if currentActiveTab.splitView}
				<div class="split-view-container">
					<div class="sequenceWorkbenchContainer" transition:fly={transitionProps}>
						<SequenceWorkbench />
					</div>
					<div class="optionPickerContainer" transition:fly={transitionProps}>
						{#key isEmpty}
							<div class="picker-container" transition:fade={{ duration: 300 }}>
								{#if isEmpty}
									<StartPosPicker />
								{:else}
									<OptionPicker />
								{/if}
							</div>
						{/key}
					</div>
				</div>
			{:else if currentActiveTab.component}
				<div class="fullViewComponent" transition:fly={transitionProps}>
					<svelte:component this={currentActiveTab.component} />
				</div>
			{:else}
				<div class="placeholderContainer" transition:fly={transitionProps}>
					<PlaceholderTab icon={currentActiveTab.icon} title={currentActiveTab.title} />
				</div>
			{/if}
		{/key}
	{/if}
</div>

<style>
	.tab-content-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden; /* Opacity transition handled by parent MainLayout now */
	}
	/* .tab-content-container.content-fade-out { opacity: 0; } */ /* Remove this */
	.split-view-container {
		display: flex;
		width: 100%;
		height: 100%;
		position: relative;
	}
	.sequenceWorkbenchContainer,
	.optionPickerContainer {
		flex: 1;
		position: relative;
		height: 100%;
		display: flex;
		overflow: hidden;
	}
	.fullViewComponent,
	.placeholderContainer {
		width: 100%;
		height: 100%;
		position: relative;
	}
	.picker-container {
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
	}
	@media (orientation: portrait) {
		.split-view-container {
			flex-direction: column;
		}
		.sequenceWorkbenchContainer,
		.optionPickerContainer {
			flex: 1;
			width: 100%;
		}
	}
	@media (orientation: landscape) {
		.split-view-container {
			flex-direction: row;
		}
		.sequenceWorkbenchContainer {
			width: 50%;
		}
		.optionPickerContainer {
			width: 50%;
		}
	}
</style>
