<script lang="ts">
	import { activeTab, slideDirection, appState } from '../state/appState';
	import PlaceholderTab from './PlaceholderTab.svelte';
	import SequenceWorkbench from '$lib/components/SequenceWorkbench/Workbench.svelte';
	import OptionPicker from '$lib/components/OptionPicker/OptionPicker.svelte';
	import StartPosPicker from '$lib/components/StartPosPicker/StartPosPicker.svelte';
	import { isSequenceEmpty } from '$lib/stores/sequence/sequenceStateStore';
	import { getTransitionProps } from '../utils/transitionHelpers';
	import { fly } from 'svelte/transition';
	import { fade } from 'svelte/transition';

	export let isVisible: boolean = true;
	export let useTransitions: boolean = false;

	// Reactive store values (these are the store subscriptions)
	$: currentActiveTab = $activeTab;
	$: isSlideRight = $slideDirection;
	$: isEmpty = $isSequenceEmpty;
	$: currentState = $appState;
	
	// Derived values from the store's data (not stores themselves)
	$: currentTabIndex = currentState.currentTab;
	$: previousTabIndex = currentState.previousTab;
	$: isContentFadeOut = currentState.contentFadeOut;
	
	// Computed transition properties
	$: transitionProps = useTransitions 
		? getTransitionProps(currentTabIndex, isSlideRight).props 
		: undefined;
</script>

<div class="tab-content-container" class:content-fade-out={isContentFadeOut}>
	{#if isVisible}
		{#key currentActiveTab.id}
			{#if currentActiveTab.splitView}
				<div class="split-view-container">
					<div
						class="sequenceWorkbenchContainer"
						in:fly={transitionProps}
					>
						<SequenceWorkbench />
					</div>

					<div
						class="optionPickerContainer"
						in:fly={transitionProps}
					>
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
				<div
					class="fullViewComponent"
					in:fly={transitionProps}
				>
					<svelte:component this={currentActiveTab.component} />
				</div>
			{:else}
				<div
					class="placeholderContainer"
					in:fly={transitionProps}
				>
					<PlaceholderTab icon={currentActiveTab.icon} title={currentActiveTab.title} />
				</div>
			{/if}
		{/key}
	{/if}
</div>

<style>
	/* Container with improved properties but keeping your original layout approach */
	.tab-content-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		opacity: 1;
		transition: opacity 0.3s ease;
	}

	.tab-content-container.content-fade-out {
		opacity: 0;
	}

	/* Keep your original split view container but with improved flex properties */
	.split-view-container {
		display: flex;
		width: 100%;
		height: 100%;
		position: relative;
	}

	/* Keep your original component containers */
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
	
	/* Keep your original media queries for responsive layouts */
	@media (orientation: portrait) {
		.split-view-container {
			flex-direction: column;
		}

		.sequenceWorkbenchContainer {
			flex: 1;
		}

		.optionPickerContainer {
			flex: 1;
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