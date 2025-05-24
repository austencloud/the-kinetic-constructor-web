<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { LayoutProvider } from './layout';
	import OptionPickerHeader from './components/OptionPickerHeader';
	import OptionDisplayArea from './components/OptionDisplayArea.svelte';
	// Import the modern runes-based sequence state
	import { sequenceState } from '$lib/state/sequence/sequenceState.svelte';
	// Import the modern runes-based option picker state
	import { optionPickerState } from './optionPickerState.svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import type { SortMethod } from './config';
	import { getSorter, determineGroupKey, getSortedGroupKeys } from './services/OptionsService';
	import transitionLoading from '$lib/state/stores/ui/transitionLoadingStore';

	// --- Svelte 5 Reactive State using modern runes ---
	let isLoading = $derived(optionPickerState.isLoading);

	// selectedTab MUST be reactive to sortMethod and lastSelectedTab changes
	let selectedTab = $derived.by(() => {
		const currentSortMethod = optionPickerState.sortMethod;
		const currentLastSelectedTab = optionPickerState.lastSelectedTab;

		return currentSortMethod === 'all' ? 'all' : currentLastSelectedTab[currentSortMethod] || 'all';
	});

	// CRITICAL FIX: Track the underlying state directly - now reactive!
	let rawOptions = $derived(optionPickerState.options);
	let sortMethod = $derived(optionPickerState.sortMethod);
	let sequence = $derived(optionPickerState.sequence);

	// Compute filteredOptions directly in the component to ensure reactivity
	let filteredOptions = $derived.by(() => {
		let options = [...rawOptions];

		// Only sort if we have a valid sort method (not 'all')
		if (sortMethod !== 'all') {
			options.sort(getSorter(sortMethod as SortMethod, sequence));
		} else {
			// For 'all' view, use a simple alphabetical sort by letter
			options.sort((a, b) => (a.letter ?? '').localeCompare(b.letter ?? ''));
		}
		return options;
	});

	// Compute groupedOptions directly in the component to ensure reactivity
	let groupedOptions = $derived.by(() => {
		// Special case for 'all' view - don't group options
		if (sortMethod === 'all') {
			return {};
		}

		// For valid sort methods, proceed with grouping
		const groups: Record<string, PictographData[]> = {};
		filteredOptions.forEach((option) => {
			const groupKey = determineGroupKey(option, sortMethod as SortMethod, sequence);
			if (!groups[groupKey]) groups[groupKey] = [];
			groups[groupKey].push(option);
		});

		// Sort the group keys based on the sort method
		const sortedKeys = getSortedGroupKeys(Object.keys(groups), sortMethod as SortMethod);
		const sortedGroups: Record<string, PictographData[]> = {};
		sortedKeys.forEach((key) => {
			if (groups[key]) {
				sortedGroups[key] = groups[key];
			}
		});
		return sortedGroups;
	});

	let actualCategoryKeys = $derived(groupedOptions ? Object.keys(groupedOptions) : []);
	let showTabs = $derived(sortMethod !== 'all' && actualCategoryKeys.length > 0);

	// Remove the debug logging effect - it can cause loops
	// Instead, use a single controlled effect for debugging
	let debugTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		// Clear any existing timer
		if (debugTimer) clearTimeout(debugTimer);

		return () => {
			if (debugTimer) clearTimeout(debugTimer);
		};
	});

	// Determine display options - MUST be reactive to filteredOptions, selectedTab, and groupedOptions
	let displayOptions = $derived.by(() => {
		// These variables MUST be reactive for the UI to update
		const currentFilteredOptions = filteredOptions;
		const currentSelectedTab = selectedTab;
		const currentGroupedOptions = groupedOptions;
		const currentSortMethod = sortMethod;

		let result;
		if (currentSortMethod === 'all' || currentSelectedTab === 'all') {
			result = currentFilteredOptions;
		} else {
			result =
				(currentSelectedTab &&
					currentGroupedOptions &&
					currentGroupedOptions[currentSelectedTab]) ||
				[];
		}

		// Reactivity verified - displayOptions now properly updates when state changes

		return result;
	});

	// Note: Reactive effects for sequence state changes are now handled
	// centrally in optionPickerState.initializeReactiveEffects()

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

	// Function to load options from sequence data using modern runes-based state
	const loadOptionsFromSequence = async () => {
		try {
			// Use the modern optionPickerState method which handles all the logic
			await optionPickerState.loadOptionsFromSequence();
		} catch (error) {
			console.error('OptionPicker: Error in loadOptionsFromSequence:', error);
		}
	};

	// Handle option selection - this will trigger options reload
	async function handleOptionSelect(option: PictographData) {
		try {
			// Use the modern option picker state to handle selection
			await optionPickerState.selectOption(option);
		} catch (error) {
			console.error('OptionPicker: Error handling option selection:', error);
		}
	}

	// --- onMount: Load options based on sequence ---
	onMount(() => {
		console.log('🔥🔥🔥 OptionPicker: Component mounted, initializing...');

		// Initialize reactive effects for the option picker state
		optionPickerState.initializeReactiveEffects();

		// Initialize state if needed
		if (optionPickerState.sortMethod === 'all' && selectedTab !== 'all') {
			untrack(() => {
				optionPickerState.setLastSelectedTabForSort('all', 'all');
			});
		}

		// Async initialization
		const initializeSequence = async () => {
			// Ensure sequence state is loaded
			if (!sequenceState.startPosition && !sequenceState.isLoading) {
				await sequenceState.loadSequence();
			}

			// Initial load with a small delay to ensure everything is ready
			setTimeout(() => {
				loadOptionsFromSequence();
			}, 100);
		};

		// Start the initialization
		initializeSequence();

		// --- Event Listeners & Subscriptions ---
		// Listen for sequence-updated events
		const handleSequenceUpdate = () => {
			loadOptionsFromSequence();
		};

		// Listen for refresh-options events (used when preserving start position after beat removal)
		const handleRefreshOptions = async (event: Event) => {
			const customEvent = event as CustomEvent;
			if (customEvent.detail?.startPosition) {
				// Load options based on the provided start position
				await optionPickerState.loadOptions([customEvent.detail.startPosition]);
			} else {
				// Fallback to loading from sequence data
				await loadOptionsFromSequence();
			}
		};

		// Listen for start-position-selected events (immediate response to start position changes)
		const handleStartPositionSelected = async (event: Event) => {
			const customEvent = event as CustomEvent;
			if (customEvent.detail?.startPosition) {
				// Immediately load options based on the new start position
				await optionPickerState.loadOptions([customEvent.detail.startPosition]);
			}
		};

		// Listen for beat-added events (immediate response to new beats)
		const handleBeatAdded = () => {
			// When a beat is added, reload options from the current sequence
			// This ensures the option picker shows options that can follow the new beat
			loadOptionsFromSequence();
		};

		// Listen for tab selection events from TabsContainer
		const handleTabSelected = (event: CustomEvent) => {
			if (event.detail?.sortMethod && event.detail?.tabKey) {
				// Update the state with the selected tab
				untrack(() => {
					optionPickerState.setLastSelectedTabForSort(event.detail.sortMethod, event.detail.tabKey);
				});
			}
		};

		// Listen for direct tab selection events from TabButton
		const handleDirectTabSelect = (event: CustomEvent<string>) => {
			// Get the current sort method
			const currentSortMethod = optionPickerState.sortMethod;

			// Update the state with the selected tab
			untrack(() => {
				optionPickerState.setLastSelectedTabForSort(currentSortMethod, event.detail);
			});
		};

		// Listen for force-update-tabs events from ViewControl
		const handleForceUpdateTabs = (event: CustomEvent) => {
			if (event.detail?.sortMethod) {
				// Get the sort method from the event
				const sortMethod = event.detail.sortMethod;

				// Update the state with the sort method
				untrack(() => {
					optionPickerState.setSortMethod(sortMethod);
				});

				// Force a UI update by updating the showTabs variable
				// This will trigger a reactive update in the component
				setTimeout(() => {
					// Get the grouped options for this sort method
					const currentGroupedOptions = optionPickerState.groupedOptions;

					// Update the actualCategoryKeys variable
					if (currentGroupedOptions && Object.keys(currentGroupedOptions).length > 0) {
						// This will trigger a reactive update of showTabs
					}
				}, 0);
			}
		};

		// Listen for show-all-view events from ViewControl
		const handleShowAllView = () => {
			// Force the UI to update to show all options without categories
			// This is critical for the "Show All" view to work correctly
			setTimeout(() => {
				untrack(() => {
					// Ensure we're in "Show All" mode
					if (optionPickerState.sortMethod !== 'all') {
						optionPickerState.setSortMethod('all');
					}
				});
			}, 0);
		};

		// Listen for reset-option-picker events (triggered during sequence clearing)
		const handleResetOptionPicker = () => {
			untrack(() => {
				optionPickerState.reset();
				// CRITICAL: Also clear the transition loading state to remove stuck overlay
				transitionLoading.end();
			});
		};

		document.addEventListener('sequence-updated', handleSequenceUpdate);
		document.addEventListener('refresh-options', handleRefreshOptions);
		document.addEventListener('start-position-selected', handleStartPositionSelected);
		document.addEventListener('beat-added', handleBeatAdded as EventListener);
		document.addEventListener('option-picker-tab-selected', handleTabSelected as EventListener);
		document.addEventListener('direct-tab-select', handleDirectTabSelect as EventListener);
		document.addEventListener('force-update-tabs', handleForceUpdateTabs as EventListener);
		document.addEventListener('show-all-view', handleShowAllView as EventListener);
		document.addEventListener('reset-option-picker', handleResetOptionPicker);

		// Note: Reactive effects for sequence state changes are now handled
		// centrally in optionPickerState.initializeReactiveEffects()
		// This prevents duplicate reactive effects and ensures proper state synchronization

		// --- Cleanup ---
		return () => {
			document.removeEventListener('sequence-updated', handleSequenceUpdate);
			document.removeEventListener('refresh-options', handleRefreshOptions);
			document.removeEventListener('start-position-selected', handleStartPositionSelected);
			document.removeEventListener('beat-added', handleBeatAdded as EventListener);
			document.removeEventListener(
				'option-picker-tab-selected',
				handleTabSelected as EventListener
			);
			document.removeEventListener('direct-tab-select', handleDirectTabSelect as EventListener);
			document.removeEventListener('force-update-tabs', handleForceUpdateTabs as EventListener);
			document.removeEventListener('show-all-view', handleShowAllView as EventListener);
			document.removeEventListener('reset-option-picker', handleResetOptionPicker);
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
				onoptionselect={handleOptionSelect}
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
