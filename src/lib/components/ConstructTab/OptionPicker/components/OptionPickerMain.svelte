<script lang="ts">
	import { onMount, untrack, getContext } from 'svelte';
	import { LayoutProvider } from '../layout';
	import OptionPickerHeader from './OptionPickerHeader';
	import OptionDisplayArea from './OptionDisplayArea.svelte';
	import type { SequenceService } from '$lib/services/SequenceService.svelte';
	import { createBeat } from '$lib/components/SequenceWorkbench/BeatFrame/BeatData';
	import { optionPickerState } from '../optionPickerState.svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import type { SortMethod } from '../config';
	import { getSorter, determineGroupKey, getSortedGroupKeys } from '../services/OptionsService';
	import transitionLoading from '$lib/state/stores/ui/transitionLoadingStore.svelte';

	// Get the modern sequence service from context
	const sequenceService = getContext<SequenceService>('sequenceService');

	// ===== REACTIVE ISOLATION LAYER =====
	// Use untrack() to prevent circular dependencies and create isolated reactive contexts

	// Primary reactive state - directly from optionPickerState
	let rawOptions = $derived(optionPickerState.options);
	let sortMethod = $derived(optionPickerState.sortMethod);
	let sequence = $derived(optionPickerState.sequence);
	let isLoading = $derived(optionPickerState.isLoading);

	// Isolated computed values - prevent reactive cascading
	let selectedTab = $derived.by(() => {
		return untrack(() => {
			const currentSortMethod = sortMethod;
			const currentLastSelectedTab = optionPickerState.lastSelectedTab;
			// Fix: 'all' is not a valid sort method, only a filter value
			return currentLastSelectedTab[currentSortMethod] || 'all';
		});
	});

	let filteredOptions = $derived.by(() => {
		// CRITICAL: This MUST be reactive to rawOptions changes
		let options = [...rawOptions];
		const currentSortMethod = sortMethod;
		const currentSequence = sequence;

		// Always apply proper sorting since 'all' is not a valid sort method
		options.sort(getSorter(currentSortMethod as SortMethod, currentSequence));
		return options;
	});

	let groupedOptions = $derived.by(() => {
		// CRITICAL: This MUST be reactive to filteredOptions changes
		const currentSortMethod = sortMethod;
		const currentFilteredOptions = filteredOptions;
		const currentSequence = sequence;

		// Always create groups since we have valid sort methods
		const groups: Record<string, PictographData[]> = {};
		currentFilteredOptions.forEach((option) => {
			const groupKey = determineGroupKey(option, currentSortMethod as SortMethod, currentSequence);
			if (!groups[groupKey]) groups[groupKey] = [];
			groups[groupKey].push(option);
		});

		const sortedKeys = getSortedGroupKeys(Object.keys(groups), currentSortMethod as SortMethod);
		const sortedGroups: Record<string, PictographData[]> = {};
		sortedKeys.forEach((key) => {
			if (groups[key]) {
				sortedGroups[key] = groups[key];
			}
		});
		return sortedGroups;
	});

	let actualCategoryKeys = $derived.by(() => {
		return untrack(() => {
			const currentGroupedOptions = groupedOptions;
			return currentGroupedOptions ? Object.keys(currentGroupedOptions) : [];
		});
	});

	let showTabs = $derived.by(() => {
		return untrack(() => {
			const currentCategoryKeys = actualCategoryKeys;
			// Always show tabs if we have categories since all sort methods are valid
			return currentCategoryKeys.length > 0;
		});
	});

	let displayOptions = $derived.by(() => {
		// CRITICAL: This MUST be reactive to show options in UI
		const currentFilteredOptions = filteredOptions;
		const currentSelectedTab = selectedTab;
		const currentGroupedOptions = groupedOptions;

		// If 'all' tab is selected, show all filtered options
		if (currentSelectedTab === 'all') {
			return currentFilteredOptions;
		} else {
			return (
				(currentSelectedTab &&
					currentGroupedOptions &&
					currentGroupedOptions[currentSelectedTab]) ||
				[]
			);
		}
	});

	// ===== CONTROLLED REACTIVE EFFECTS =====
	// Single effect for handling loading state transitions
	$effect(() => {
		const currentIsLoading = isLoading;
		const currentDisplayOptions = displayOptions;

		// Only handle loading transition, avoid side effects that could trigger loops
		if (!currentIsLoading && currentDisplayOptions && currentDisplayOptions.length > 0) {
			// Use setTimeout to break reactive chain and prevent loops
			setTimeout(() => {
				untrack(() => {
					transitionLoading.end();
				});
			}, 50);
		}
	});

	// ===== NON-REACTIVE HELPER FUNCTIONS =====
	// These functions explicitly avoid triggering reactive updates

	let isRefreshing = false;
	const refreshOptionsFromSequence = async () => {
		if (isRefreshing) {
			return;
		}

		isRefreshing = true;
		try {
			// Get the current sequence from the modern SequenceService
			const currentBeats = sequenceService.state.beats;

			if (currentBeats.length > 0) {
				// Use the last beat's pictograph data to determine next options
				const lastBeat = currentBeats[currentBeats.length - 1];
				await optionPickerState.loadOptions([lastBeat.pictographData]);
			} else {
				// No beats, load empty options
				await optionPickerState.loadOptions([]);
			}
		} catch (error) {
			console.error('OptionPickerMain: Error refreshing options:', error);
		} finally {
			isRefreshing = false;
		}
	};

	// Debounced option selection to prevent rapid-fire clicks
	let isSelectingOption = false;
	let lastSelectionTime = 0;
	const selectionDebounceMs = 300;

	async function handleOptionSelect(option: PictographData) {
		const now = Date.now();
		if (isSelectingOption || now - lastSelectionTime < selectionDebounceMs) {
			return;
		}

		isSelectingOption = true;
		lastSelectionTime = now;

		try {
			// Get the current beat count to determine the beat number
			const currentBeatCount = sequenceService.state.beats.length;

			// Create proper BeatData using the createBeat helper
			const beatData = createBeat(currentBeatCount + 1, option, {
				filled: true,
				duration: 1,
				tags: [`letter-${option.letter || 'unknown'}`]
			});

			// Use the modern SequenceService instead of legacy optionPickerState
			sequenceService.addBeats([beatData]);
		} catch (error) {
			console.error('OptionPickerMain: Error handling option selection:', error);
		} finally {
			// Reset selection flag after a delay to prevent rapid successive calls
			setTimeout(() => {
				isSelectingOption = false;
			}, 200);
		}
	}

	// ===== LIFECYCLE AND EVENT HANDLING =====
	onMount(() => {
		// Initialize option picker state reactive effects
		optionPickerState.initializeReactiveEffects();

		// ===== SAFE INITIALIZATION: Load options after mount using event-driven approach =====
		// This runs after the component is fully mounted and uses event listeners instead of reactive effects
		setTimeout(() => {
			// For now, just initialize with empty options since we're using the modern service
			// The start position will be handled by the StartPositionPicker component
			const currentOptions = untrack(() => optionPickerState.options);

			if (currentOptions.length === 0) {
				// Use untrack to prevent reactive loops
				untrack(() => {
					optionPickerState.loadOptions([]);
				});
			}
		}, 100);

		// ===== EVENT HANDLERS =====
		// All event handlers use untrack() to prevent reactive loops

		const handleSequenceUpdate = () => {
			setTimeout(() => {
				refreshOptionsFromSequence();
			}, 50);
		};

		const handleRefreshOptions = async (event: Event) => {
			const customEvent = event as CustomEvent;
			if (customEvent.detail?.startPosition) {
				await untrack(() => optionPickerState.loadOptions([customEvent.detail.startPosition]));
			} else {
				await refreshOptionsFromSequence();
			}
		};

		const handleStartPositionSelected = async (event: Event) => {
			const customEvent = event as CustomEvent;
			if (customEvent.detail?.startPosition) {
				await untrack(() => optionPickerState.loadOptions([customEvent.detail.startPosition]));
			}
		};

		const handleTabSelected = (event: CustomEvent) => {
			if (event.detail?.sortMethod && event.detail?.tabKey) {
				untrack(() => {
					optionPickerState.setLastSelectedTabForSort(event.detail.sortMethod, event.detail.tabKey);
				});
			}
		};

		const handleDirectTabSelect = (event: CustomEvent<string>) => {
			untrack(() => {
				const currentSortMethod = optionPickerState.sortMethod;
				optionPickerState.setLastSelectedTabForSort(currentSortMethod, event.detail);
			});
		};

		const handleForceUpdateTabs = (event: CustomEvent) => {
			if (event.detail?.sortMethod) {
				untrack(() => {
					optionPickerState.setSortMethod(event.detail.sortMethod);
				});
			}
		};

		const handleShowAllView = () => {
			setTimeout(() => {
				untrack(() => {
					// Set the selected tab to 'all' instead of trying to change sort method
					const currentSortMethod = optionPickerState.sortMethod;
					optionPickerState.setLastSelectedTabForSort(currentSortMethod, 'all');
				});
			}, 0);
		};

		const handleResetOptionPicker = () => {
			untrack(() => {
				optionPickerState.reset();
				transitionLoading.end();
			});
		};

		// Register event listeners
		document.addEventListener('sequence-updated', handleSequenceUpdate);
		document.addEventListener('refresh-options', handleRefreshOptions);
		document.addEventListener('start-position-selected', handleStartPositionSelected);
		document.addEventListener('option-picker-tab-selected', handleTabSelected as EventListener);
		document.addEventListener('direct-tab-select', handleDirectTabSelect as EventListener);
		document.addEventListener('force-update-tabs', handleForceUpdateTabs as EventListener);
		document.addEventListener('show-all-view', handleShowAllView as EventListener);
		document.addEventListener('reset-option-picker', handleResetOptionPicker);

		// Cleanup function
		return () => {
			document.removeEventListener('sequence-updated', handleSequenceUpdate);
			document.removeEventListener('refresh-options', handleRefreshOptions);
			document.removeEventListener('start-position-selected', handleStartPositionSelected);
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

<!-- Option Picker Mode -->
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

<style>
	.options-container {
		flex: 1;
		display: flex;
		position: relative;
		border-radius: 8px;
		background-color: transparent;
		min-height: 0;
		overflow: hidden;
		justify-content: center;
	}
</style>
