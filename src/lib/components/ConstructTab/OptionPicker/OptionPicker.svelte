<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { LayoutProvider } from './layout';
	import { OptionPickerHeader } from './header';
	import { OptionDisplayArea } from './display';
	import { sequenceBeatToPictographData } from './utils';
	// Import the working store system
	import { 
		actions, 
		uiState, 
		filteredOptionsStore, 
		groupedOptionsStore 
	} from './store';
	import sequenceDataService from '$lib/services/SequenceDataService';
	import type { SequenceBeat } from '$lib/services/SequenceDataService';
	import type { PictographData } from '$lib/types/PictographData';
	import { sequenceStore } from '$lib/state/stores/sequenceStore';
	import transitionLoading from '$lib/state/stores/ui/transitionLoadingStore';
	import type { ViewModeDetail } from './components/ViewControl/types';
	import type { Letter } from '$lib/types/Letter';

	// --- Reactive UI State & Data ---
	$: isLoading = $uiState.isLoading;
	$: selectedTab = $uiState.lastSelectedTab[$uiState.sortMethod] || 'all';
	$: groupedOptions = $groupedOptionsStore;
	$: filteredOptions = $filteredOptionsStore;
	$: actualCategoryKeys = groupedOptions ? Object.keys(groupedOptions) : [];
	$: showTabs = selectedTab !== 'all';

	// Determine which options to display based on the selected tab
	$: displayOptions = selectedTab === 'all' 
		? filteredOptions 
		: (selectedTab && groupedOptions && groupedOptions[selectedTab]) || [];

	// Clear the loading state when options are loaded
	$: if (!isLoading && displayOptions && displayOptions.length > 0) {
		// Clear the transition loading state
		transitionLoading.end();
	}

	// --- Event Handlers ---
	function handleViewChange(event: CustomEvent<ViewModeDetail>) {
		const detail = event.detail;
		
		if (detail.mode === 'all') {
			// Switch to 'Show All' view
			const currentSortMethod = $uiState.sortMethod;
			actions.setLastSelectedTabForSort(currentSortMethod, 'all');
		} else if (detail.mode === 'group' && detail.method) {
			// Switch to a grouped view
			actions.setSortMethod(detail.method);
			
			// Determine which tab to select within the new grouping
			const lastSelectedForNewMethod = $uiState.lastSelectedTab[detail.method];
			const availableKeys = actualCategoryKeys;
			
			let nextTabToSelect: string | null = null;
			
			if (lastSelectedForNewMethod && lastSelectedForNewMethod !== 'all' && availableKeys.includes(lastSelectedForNewMethod)) {
				// If there was a previously selected tab for this sort method, use it
				nextTabToSelect = lastSelectedForNewMethod;
			} else if (availableKeys.length > 0) {
				// Otherwise, select the first available category tab
				nextTabToSelect = availableKeys[0];
			} else {
				// If no categories exist for this grouping, default back to 'all'
				nextTabToSelect = 'all';
			}
			
			// Update the last selected tab preference if it changed
			if (lastSelectedForNewMethod !== nextTabToSelect) {
				actions.setLastSelectedTabForSort(detail.method, nextTabToSelect);
			}
		}
	}

	function handleTabSelect(event: CustomEvent<string>) {
		const tabKey = event.detail;
		actions.setLastSelectedTabForSort($uiState.sortMethod, tabKey);
	}

	// --- onMount: Load options based on sequence ---
	onMount(() => {
		// Function to load options from sequence data
		const loadOptionsFromSequence = async () => {
			// Get current sequence data
			const fullSequence = sequenceDataService.getCurrentSequence();

			// Find the start position beat (beat 0)
			const startPosBeat = fullSequence.find(
				(beat) =>
					beat && typeof beat === 'object' && 'beat' in beat && (beat as SequenceBeat).beat === 0
			) as SequenceBeat | undefined;

			if (startPosBeat) {
				// Convert to PictographData with proper typing
				const pictographData = sequenceBeatToPictographData(startPosBeat);

				// Load options based on the pictograph data
				actions.loadOptions([pictographData]);
			} else {
				// No start position found, load empty options
				actions.loadOptions([]);
				console.log('No start position found in sequence data');
			}
		};

		// Initial load
		loadOptionsFromSequence();

		// --- Event Listeners & Subscriptions ---
		// Listen for sequence-updated events
		const handleSequenceUpdate = () => {
			loadOptionsFromSequence();
		};

		// Listen for refresh-options events (used when preserving start position after beat removal)
		const handleRefreshOptions = (event: CustomEvent) => {
			console.log('OptionPicker received refresh-options event:', event.detail);
			if (event.detail?.startPosition) {
				// Load options based on the provided start position
				actions.loadOptions([event.detail.startPosition]);
			} else {
				// Fallback to loading from sequence data
				loadOptionsFromSequence();
			}
		};

		document.addEventListener('sequence-updated', handleSequenceUpdate);
		document.addEventListener('refresh-options', handleRefreshOptions as EventListener);

		// Subscribe to the sequenceStore for updates
		const unsubscribeSequence = sequenceStore.subscribe((state) => {
			if (state && state.beats && state.beats.length > 0) {
				// Convert StoreBeatData to PictographData format
				const sequence = state.beats.map((beat) => {
					// Ensure letter is properly typed as Letter | null
					const letterValue = (beat.metadata?.letter as Letter | null) || null;

					return {
						letter: letterValue,
						startPos: beat.metadata?.startPos || null,
						endPos: beat.metadata?.endPos || null,
						redPropData: beat.redPropData || null,
						bluePropData: beat.bluePropData || null,
						// Convert motion data from the store format
						redMotionData: beat.redMotionData || null,
						blueMotionData: beat.blueMotionData || null,
						// Add required PictographData properties with default values
						timing: null,
						direction: null,
						gridMode: 'diamond',
						gridData: null,
						redArrowData: null,
						blueArrowData: null,
						grid: 'diamond'
					} as PictographData; // Explicitly cast to PictographData
				});
				actions.loadOptions(sequence);
			}
		});

		// --- Cleanup ---
		return () => {
			document.removeEventListener('sequence-updated', handleSequenceUpdate);
			document.removeEventListener('refresh-options', handleRefreshOptions as EventListener);
			unsubscribeSequence();
		};
	});
</script>

<div class="option-picker" class:mobile={false} class:portrait={false}>
	<LayoutProvider>
		<OptionPickerHeader
			{selectedTab}
			categoryKeys={actualCategoryKeys}
			{showTabs}
			on:viewChange={handleViewChange}
			on:tabSelect={handleTabSelect}
		/>

		<div class="options-container">
			<OptionDisplayArea
				{isLoading}
				{selectedTab}
				optionsToDisplay={displayOptions}
				hasCategories={actualCategoryKeys.length > 0}
			/>
		</div>
	</LayoutProvider>
</div>

<style>
	.option-picker {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		overflow: hidden;
		position: relative;
		background-color: transparent; /* Or your desired background */
		justify-content: center; /* Center content vertically */
	}

	.options-container {
		flex: 1; /* Takes remaining vertical space */
		display: flex; /* Needed for children */
		position: relative; /* For absolute positioning of children like messages */
		border-radius: 8px;
		background-color: transparent; /* Or your desired background */
		min-height: 0; /* Crucial for flex child sizing */
		overflow: hidden; /* Contains children, prevents double scrollbars */
		justify-content: center; /* Center content vertically */
	}
	/* Optional: Constrain max width on large screens */
	@media (min-width: 1400px) {
		.option-picker {
			max-width: 1400px;
			margin: 0 auto;
		}
	}
</style>