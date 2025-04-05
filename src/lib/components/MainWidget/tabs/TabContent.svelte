<script lang="ts">
	import { appStore, activeTab, slideDirection } from '../state/appState';
	import PlaceholderTab from './PlaceholderTab.svelte';
	import SequenceWorkbench from '$lib/components/SequenceWorkbench/Workbench.svelte';
	import OptionPicker from '$lib/components/OptionPicker/OptionPicker.svelte';
	import StartPosPicker from '$lib/components/StartPosPicker/StartPosPicker.svelte';
	import { isSequenceEmpty } from '$lib/stores/sequence/sequenceStateStore';
	import { getTransitionProps } from '../utils/transitionHelpers';
	import { fly, fade } from 'svelte/transition';
	
	// Using property destructuring with defaults
	export let isVisible = true;
	export let useTransitions = true;

	// Using reactive declarations with $ syntax
	$: currentTabIndex = $appStore.currentTab;
	$: contentFadeOut = $appStore.contentFadeOut;
	$: currentTab = $activeTab;
	$: direction = $slideDirection;
	$: isEmpty = $isSequenceEmpty;
	
	// Memoized computed property
	$: transitionProps = useTransitions 
		? getTransitionProps(currentTabIndex, direction).props 
		: undefined;
</script>

<div 
	class="tab-content-container" 
	class:content-fade-out={contentFadeOut}
	role="tabpanel"
	aria-label="{currentTab.title} content"
>
	{#if isVisible}
		{#key currentTab.id}
			{#if currentTab.splitView}
				<div class="split-view-container">
					<!-- Workbench Panel -->
					<section
						class="sequenceWorkbenchContainer"
						in:fly={transitionProps}
					>
						<SequenceWorkbench />
					</section>

					<!-- Options Panel with conditional rendering -->
					<section
						class="optionPickerContainer"
						in:fly={transitionProps}
					>
						{#key isEmpty}
							<div 
								class="picker-container" 
								transition:fade={{ duration: 300 }}
							>
								<svelte:component 
									this={isEmpty ? StartPosPicker : OptionPicker} 
								/>
							</div>
						{/key}
					</section>
				</div>
			{:else if currentTab.component}
				<!-- Full view component with dynamic component loading -->
				<div
					class="fullViewComponent"
					in:fly={transitionProps}
				>
					<svelte:component this={currentTab.component} />
				</div>
			{:else}
				<!-- Fallback placeholder for undefined tabs -->
				<div
					class="placeholderContainer"
					in:fly={transitionProps}
				>
					<PlaceholderTab 
						icon={currentTab.icon} 
						title={currentTab.title} 
					/>
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
		overflow: hidden;
		opacity: 1;
		transition: opacity 0.3s ease-in-out;
	}

	.tab-content-container.content-fade-out {
		opacity: 0;
	}

	.split-view-container {
		display: grid;
		width: 100%;
		height: 100%;
		position: relative;
		/* Using CSS Grid for better responsive layout */
		grid-template-columns: 1fr;
		grid-template-rows: 1fr 1fr;
	}

	.sequenceWorkbenchContainer,
	.optionPickerContainer {
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
		inset: 0;
	}
	
	/* Responsive layouts using modern container queries where supported */
	@container (min-width: 768px) {
		.split-view-container {
			grid-template-columns: 1fr 1fr;
			grid-template-rows: 1fr;
		}
	}

	/* Fallback for browsers without container queries */
	@media (orientation: portrait) {
		.split-view-container {
			grid-template-columns: 1fr;
			grid-template-rows: 1fr 1fr;
		}
	}

	@media (orientation: landscape) {
		.split-view-container {
			grid-template-columns: 1fr 1fr;
			grid-template-rows: 1fr;
		}
	}
</style>