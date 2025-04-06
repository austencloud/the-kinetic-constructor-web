// src/lib/components/OptionPicker/store.ts
import { writable, derived } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';
import type { SortMethod, ReversalFilter } from './config';
import {
	getNextOptions,
	determineReversalCategory,
	determineGroupKey,
	getSortedGroupKeys,
	getSorter
} from './services/OptionsService'; // Import the service functions
// Import the service functions

// ===== Core State =====
export const sequenceStore = writable<PictographData[]>([]);
export const optionsStore = writable<PictographData[]>([]); // Raw options from getNextOptions

// ===== UI State =====
export const uiState = writable({
	sortMethod: 'type' as SortMethod,
	reversalFilter: 'all' as ReversalFilter,
	showAllActive: false,
	isLoading: false,
	error: null as string | null
});

// ===== Actions =====
export const actions = {
	loadOptions: (sequence: PictographData[]) => {
		// Update sequence
		sequenceStore.set(sequence);

		// Set loading state
		uiState.update((state) => ({ ...state, isLoading: true, error: null }));

		try {
			// Use the imported service function to get raw next options
			const nextOptions = getNextOptions(sequence);
			optionsStore.set(nextOptions);
			uiState.update((state) => ({ ...state, isLoading: false }));
		} catch (error) {
			console.error('Error loading options:', error);
			uiState.update((state) => ({
				...state,
				isLoading: false,
				error: error instanceof Error ? error.message : 'Unknown error loading options'
			}));
			optionsStore.set([]); // Clear options on error
		}
	},

	setSortMethod: (method: SortMethod) => {
		uiState.update((state) => ({ ...state, sortMethod: method }));
	},

	setReversalFilter: (filter: ReversalFilter) => {
		uiState.update((state) => {
			// Prevent changing filter when 'Show All' is active
			if (state.showAllActive) return state;
			return { ...state, reversalFilter: filter };
		});
	},

	toggleShowAll: () => {
		uiState.update((state) => ({ ...state, showAllActive: !state.showAllActive }));
	},

	selectOption: (option: PictographData) => {
		selectedPictograph.set(option);
	},

	reset: () => {
		optionsStore.set([]);
		sequenceStore.set([]);
		uiState.set({
			sortMethod: 'type',
			reversalFilter: 'all',
			showAllActive: false,
			isLoading: false,
			error: null
		});
		selectedPictograph.set(null); // Also reset selection
	}
};

// ===== Derived Stores =====

// Filtered options - applies filtering and sorting to the raw options
export const filteredOptionsStore = derived(
	[optionsStore, sequenceStore, uiState],
	([$options, $sequence, $ui]) => {
		let options = [...$options]; // Clone to avoid mutating the raw optionsStore

		// Apply reversal filtering *only* if Show All is inactive
		if (!$ui.showAllActive && $ui.reversalFilter !== 'all') {
			options = options.filter(
				// Use imported service function
				(option) => determineReversalCategory($sequence, option) === $ui.reversalFilter
			);
		}

		// Apply sorting
		// If Show All is active, force sort by 'type'. Otherwise, use the selected sort method.
		const effectiveSortMethod = $ui.showAllActive ? 'type' : $ui.sortMethod;
		// Use imported service function
		options.sort(getSorter(effectiveSortMethod, $sequence));

		return options;
	}
);

// Grouped options - applies grouping logic to the already filtered/sorted options
export const groupedOptionsStore = derived(
	[filteredOptionsStore, sequenceStore, uiState], // Depends on filtered options now
	([$filteredOptions, $sequence, $ui]) => {
		// Determine the effective grouping method (same logic as sorting)
		const effectiveSortMethod = $ui.showAllActive ? 'type' : $ui.sortMethod;

		const groups: Record<string, PictographData[]> = {};
		$filteredOptions.forEach((option) => {
			// Use imported service function
			const groupKey = determineGroupKey(option, effectiveSortMethod, $sequence);
			if (!groups[groupKey]) groups[groupKey] = [];
			groups[groupKey].push(option);
		});

		// Sort the group keys using the effective sort method
		// Use imported service function
		const sortedKeys = getSortedGroupKeys(Object.keys(groups), effectiveSortMethod);

		// Build final sorted groups object
		const sortedGroups: Record<string, PictographData[]> = {};
		sortedKeys.forEach((key) => {
			// Ensure keys exist before assigning
			if (groups[key]) {
				sortedGroups[key] = groups[key];
			}
		});

		return sortedGroups;
	}
);

// ===== Removed Utility Functions =====
// All data processing functions previously defined here have been moved to optionsService.ts

// Export for backwards compatibility / convenience (optional)
export const optionPickerStore = {
	subscribe: derived([optionsStore, sequenceStore, uiState], ([$options, $sequence, $ui]) => ({
		allOptions: $options, // Raw options
		currentSequence: $sequence,
		...$ui
		// Consumers needing filtered/grouped options should subscribe to those specific stores
	})).subscribe,
	...actions // Expose actions
};
