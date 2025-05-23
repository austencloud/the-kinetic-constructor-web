<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { get } from 'svelte/store';
	import { LayoutProvider } from './layout';
	import OptionPickerHeader from './components/OptionPickerHeader';
	import OptionDisplayArea from './components/OptionDisplayArea.svelte';
	import { sequenceBeatToPictographData } from './utils';
	// Import the working store system
	import { actions, uiState, filteredOptionsStore, groupedOptionsStore } from './store';
	import sequenceDataService from '$lib/services/SequenceDataService';
	import type { SequenceBeat } from '$lib/services/SequenceDataService';
	import type { PictographData } from '$lib/types/PictographData';
	import { sequenceStore } from '$lib/state/stores/sequenceStore';
	import transitionLoading from '$lib/state/stores/ui/transitionLoadingStore';

	import type { Letter } from '$lib/types/Letter';

	// --- Svelte 5 Reactive State using runes ---
	let isLoading = $derived($uiState.isLoading);
	
	// Use untrack to prevent circular dependencies
	let selectedTab = $derived.by(() => {
		return untrack(() => {
			return $uiState.sortMethod === ('all' as any)
				? 'all'
				: $uiState.lastSelectedTab[$uiState.sortMethod] || 'all';
		});
	});
	
	let groupedOptions = $derived($groupedOptionsStore);
	let filteredOptions = $derived($filteredOptionsStore);
	let actualCategoryKeys = $derived(groupedOptions ? Object.keys(groupedOptions) : []);
	let showTabs = $derived($uiState.sortMethod !== ('all' as any) && actualCategoryKeys.length > 0);

	// Remove the debug logging effect - it can cause loops
	// Instead, use a single controlled effect for debugging
	let debugTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		// Clear any existing timer
		if (debugTimer) clearTimeout(debugTimer);
		
		// Debounce the debug logging
		debugTimer = setTimeout(() => {
			untrack(() => {
				console.log('OptionPicker state:', {
					sortMethod: $uiState.sortMethod,
					selectedTab,
					showTabs,
					actualCategoryKeys,
					filteredOptionsLength: filteredOptions.length
				});
			});
		}, 100);
		
		return () => {
			if (debugTimer) clearTimeout(debugTimer);
		};
	});

	// Determine display options with untrack to prevent loops
	let displayOptions = $derived.by(() => {
		return untrack(() => {
			if ($uiState.sortMethod === ('all' as any) || selectedTab === 'all') {
				return filteredOptions;
			}
			return (selectedTab && groupedOptions && groupedOptions[selectedTab]) || [];
		});
	});

	// Clear loading state - use a more controlled approach
	let loadingClearTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		if (!isLoading && displayOptions && displayOptions.length > 0) {
			// Clear any existing timer
			if (loadingClearTimer) clearTimeout(loadingClearTimer);
			
			// Debounce the loading clear
			loadingClearTimer = setTimeout(() => {
				untrack(() => {
					transitionLoading.end();
				});
			}, 50);
		}
		
		return () => {
			if (loadingClearTimer) clearTimeout(loadingClearTimer);
		};
	});

	// --- onMount: Load options based on sequence ---
	onMount(() => {
		// Initialize state if needed
		if ($uiState.sortMethod === ('all' as any) && selectedTab !== 'all') {
			console.log('OptionPicker: Initializing "Show All" view');
			untrack(() => {
				actions.setLastSelectedTabForSort('all', 'all');
			});
		}

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

		// Listen for tab selection events from TabsContainer
		const handleTabSelected = (event: CustomEvent) => {
			console.log('OptionPicker received tab-selected event:', event.detail);
			if (event.detail?.sortMethod && event.detail?.tabKey) {
				// Update the store with the selected tab
				untrack(() => {
					actions.setLastSelectedTabForSort(event.detail.sortMethod, event.detail.tabKey);
				});
			}
		};

		// Listen for direct tab selection events from TabButton
		const handleDirectTabSelect = (event: CustomEvent<string>) => {
			console.log('OptionPicker received direct-tab-select event:', event.detail);

			// Get the current sort method
			const currentSortMethod = get(uiState).sortMethod;

			// Update the store with the selected tab
			untrack(() => {
				actions.setLastSelectedTabForSort(currentSortMethod, event.detail);
			});
		};

		// Listen for force-update-tabs events from ViewControl
		const handleForceUpdateTabs = (event: CustomEvent) => {
			console.log('OptionPicker received force-update-tabs event:', event.detail);

			if (event.detail?.sortMethod) {
				// Get the sort method from the event
				const sortMethod = event.detail.sortMethod;

				// Update the store with the sort method
				untrack(() => {
					actions.setSortMethod(sortMethod);
				});

				// Force a UI update by updating the showTabs variable
				// This will trigger a reactive update in the component
				setTimeout(() => {
					// Get the grouped options for this sort method
					const groupedOptions = get(groupedOptionsStore);
					console.log('OptionPicker: Grouped options after force update:', groupedOptions);

					// Update the actualCategoryKeys variable
					if (groupedOptions && Object.keys(groupedOptions).length > 0) {
						// This will trigger a reactive update of showTabs
						console.log(
							'OptionPicker: Category keys after force update:',
							Object.keys(groupedOptions)
						);
					}
				}, 0);
			}
		};

		// Listen for show-all-view events from ViewControl
		const handleShowAllView = (event: CustomEvent) => {
			console.log('OptionPicker received show-all-view event:', event.detail);

			// Force the UI to update to show all options without categories
			// This is critical for the "Show All" view to work correctly
			setTimeout(() => {
				untrack(() => {
					// Ensure we're in "Show All" mode
					if (get(uiState).sortMethod !== ('all' as any)) {
						actions.setSortMethod('all' as any);
					}
				});

				// Log the current state
				console.log('OptionPicker: Show All View state:', {
					sortMethod: get(uiState).sortMethod,
					selectedTab,
					showTabs,
					filteredOptions: get(filteredOptionsStore).length
				});
			}, 0);
		};

		document.addEventListener('sequence-updated', handleSequenceUpdate);
		document.addEventListener('refresh-options', handleRefreshOptions as EventListener);
		document.addEventListener('option-picker-tab-selected', handleTabSelected as EventListener);
		document.addEventListener('direct-tab-select', handleDirectTabSelect as EventListener);
		document.addEventListener('force-update-tabs', handleForceUpdateTabs as EventListener);
		document.addEventListener('show-all-view', handleShowAllView as EventListener);

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
			document.removeEventListener(
				'option-picker-tab-selected',
				handleTabSelected as EventListener
			);
			document.removeEventListener('direct-tab-select', handleDirectTabSelect as EventListener);
			document.removeEventListener('force-update-tabs', handleForceUpdateTabs as EventListener);
			document.removeEventListener('show-all-view', handleShowAllView as EventListener);
			unsubscribeSequence();
		};
	});
</script>

<div class="option-picker" class:mobile={false} class:portrait={false}>
	<LayoutProvider>
		<OptionPickerHeader {selectedTab} categoryKeys={actualCategoryKeys} {showTabs} />

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