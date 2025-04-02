<script lang="ts">
	import { activeTab, slideDirection, appState } from '../state/appState';
	import PlaceholderTab from './PlaceholderTab.svelte';
	import SequenceWorkbench from '$lib/components/SequenceWorkbench/Workbench.svelte';
	import OptionPicker from '$lib/components/OptionPicker/OptionPicker.svelte';
	import StartPosPicker from '$lib/components/StartPosPicker/StartPosPicker.svelte';
	import { selectedStartPos } from '$lib/stores/sequence/selectionStore';
	import { derived } from 'svelte/store';
	import { getTransitionProps } from '../utils/transitionHelpers';
	import { fly } from 'svelte/transition';

	export let isVisible: boolean = true;
	export let useTransitions: boolean = false;

	const activeTabIndex = derived(appState, (s) => s.currentTab);
	const contentFadeOut = derived(appState, (s) => s.contentFadeOut);
</script>

<div 
	class="tab-content-container" 
	class:content-fade-out={$contentFadeOut}
>
	{#if isVisible}
		{#key $activeTab.id}
			{#if $activeTab.splitView}
				<div class="split-view-container">
					<div
						class="sequenceWorkbenchContainer"
						in:fly={useTransitions
							? getTransitionProps($activeTabIndex, $slideDirection).props
							: undefined}
					>
						<SequenceWorkbench />
					</div>

					<div
						class="optionPickerContainer"
						in:fly={useTransitions
							? getTransitionProps($activeTabIndex, $slideDirection).props
							: undefined}
					>
						{#if $selectedStartPos}
							<OptionPicker />
						{:else}
							<StartPosPicker />
						{/if}
					</div>
				</div>
			{:else if $activeTab.component}
				<div
					class="fullViewComponent"
					in:fly={useTransitions
						? getTransitionProps($activeTabIndex, $slideDirection).props
						: undefined}
				>
					<svelte:component this={$activeTab.component} />
				</div>
			{:else}
				<div
					class="placeholderContainer"
					in:fly={useTransitions
						? getTransitionProps($activeTabIndex, $slideDirection).props
						: undefined}
				>
					<PlaceholderTab icon={$activeTab.icon} title={$activeTab.title} />
				</div>
			{/if}
		{/key}
	{/if}
</div>

<style>
	/* NEW: Fixed container to prevent layout shifts */
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

	/* NEW: Container for split view to maintain consistent layout */
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

	/* Responsive layouts */
	@media (orientation: portrait) {
		.split-view-container {
			flex-direction: column;
		}

		.sequenceWorkbenchContainer {
			flex:1;
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