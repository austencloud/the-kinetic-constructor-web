<script lang="ts">
	// Import necessary components
	import PlaceholderTab from './PlaceholderTab.svelte';
	import SequenceWorkbench from '$lib/components/SequenceWorkbench/Workbench.svelte';
	import OptionPicker from '$lib/components/OptionPicker/OptionPicker.svelte';
	import StartPosPicker from '$lib/components/StartPosPicker/StartPosPicker.svelte';
	// Import fade transition and potentially others if needed
	import { crossfade, fade } from 'svelte/transition'; // Keep fade

	// --- XState Imports ---
	import { tabs } from '$lib/components/MainWidget/state/appState';
	import { useSelector } from '@xstate/svelte';
	import { appService } from '$lib/state/machines/app/app.machine';

	// --- Svelte Stores ---
	import { isSequenceEmpty } from '$lib/stores/sequence/sequenceStateStore';

	// --- Get current tab index directly from the app service ---
	const currentTabStore = useSelector(appService, (state) => state.context.currentTab);

	// --- Reactive derivations ---
	$: isEmpty = $isSequenceEmpty;
	$: currentTabIndex = $currentTabStore as number;
	$: activeTab =
		currentTabIndex >= 0 && currentTabIndex < tabs.length ? tabs[currentTabIndex] : null;

	// Define props for the inner picker fade
	const pickerFadeProps = { duration: 200 };

	// Create a crossfade transition
	const [send, receive] = crossfade({
		duration: 400,
		fallback(node) {
			return fade(node, { duration: 300 });
		}
	});
</script>

<div class="tab-content-container">
	{#if activeTab}
		{#key activeTab.id}
			<div
				in:receive={{ key: activeTab.id }}
				out:send={{ key: activeTab.id }}
				class={activeTab.id === 'construct' ? 'split-view-container' : 'placeholderContainer'}
			>
				{#if activeTab.id === 'construct'}
					<div class="sequenceWorkbenchContainer">
						<SequenceWorkbench />
					</div>
					<div class="optionPickerContainer">
						{#key isEmpty}
							<div class="picker-container" transition:fade={pickerFadeProps}>
								{#if isEmpty}
									<StartPosPicker />
								{:else}
									<OptionPicker />
								{/if}
							</div>
						{/key}
					</div>
				{:else}
					<PlaceholderTab icon={activeTab.icon} title={activeTab.title} />
				{/if}
			</div>
		{/key}
	{/if}
</div>

<style>
	.tab-content-container {
		position: relative; /* Crucial for absolute positioning of children during transition */
		width: 100%;
		height: 100%;
		overflow: hidden; /* Prevent content spill during transition */
	}

	/* Ensure the direct children of the #key block can overlap during transition */
	.split-view-container,
	.placeholderContainer {
		position: absolute; /* Changed from relative to absolute */
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex; /* Keep flex for split-view */
		box-sizing: border-box; /* Include padding/border in element's total width and height */
	}

	/* Styles for split view content */

	.sequenceWorkbenchContainer,
	.optionPickerContainer {
		flex: 1;
		position: relative; /* Relative for picker-container positioning */
		height: 100%;
		display: flex; /* Keep display:flex */
		overflow: hidden; /* Keep overflow hidden */
	}

	/* Styles for the placeholder content */
	.placeholderContainer {
		/* display: flex; is already set above */
		/* width: 100%; height: 100%; position: absolute; are set above */
		/* Ensure placeholder content inside is centered if needed */
		align-items: center;
		justify-content: center;
	}

	.picker-container {
		/* Allows pickers to overlay within optionPickerContainer */
		width: 100%;
		height: 100%;
		position: absolute; /* Keep absolute positioning */
		top: 0;
		left: 0;
	}

	/* Responsive styles */
	@media (orientation: portrait) {
		.split-view-container {
			flex-direction: column;
		}
		.sequenceWorkbenchContainer,
		.optionPickerContainer {
			flex: 1;
			width: 100%; /* Ensure full width in column layout */
		}
	}

	@media (orientation: landscape) {
		.split-view-container {
			flex-direction: row;
		}
		.sequenceWorkbenchContainer {
			flex: 1;
		}
		.optionPickerContainer {
			flex: 1;
		}
	}
</style>
