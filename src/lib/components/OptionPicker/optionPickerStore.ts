// src/lib/components/OptionPicker/optionPickerStore.ts
import { writable, derived } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore'; // Global store for the selected option
import { OptionDataService } from './OptionDataService';
import type { Letter } from '$lib/types/Letter';
import { LetterType } from '$lib/types/LetterType';
import { LetterUtils } from '$lib/utils/LetterUtils';

// --- Types ---

// Defines the possible filters for motion reversals
export type ReversalFilterType = 'all' | 'continuous' | 'one_reversal' | 'two_reversals';
// Defines the available methods for sorting options
export type SortMethodType = 'type' | 'endPosition' | 'reversals';
// Defines the structure of the store's state
export interface OptionPickerState {
	allOptions: PictographData[];       // Raw options fetched based on sequence
	filteredOptions: PictographData[];  // Options after applying reversal filter and sorting
	selectedFilter: ReversalFilterType; // Currently active reversal filter
	sortMethod: SortMethodType;         // Currently active sort method
	isLoading: boolean;                 // Indicates if options are being loaded/processed
	currentSequence: PictographData[];  // The sequence used to determine options
	error: string | null;               // Stores any error message during loading
}

// --- Initial State ---
const initialState: OptionPickerState = {
	allOptions: [],
	filteredOptions: [],
	selectedFilter: 'all', // Default filter shows all options
	sortMethod: 'type',   // Default sort is by letter type
	isLoading: true,      // Start in loading state
	currentSequence: [],
	error: null,
};

// --- Store Logic ---

/**
 * Sorts an array of pictograph options based on the selected method.
 * @param options The array of options to sort.
 * @param sortMethod The sorting criterion ('type', 'endPosition', 'reversals').
 * @param sequence The current sequence (needed for 'reversals' sort).
 * @returns A new, sorted array of pictograph options.
 */
function sortOptions(
	options: PictographData[],
	sortMethod: SortMethodType,
	sequence: PictographData[]
): PictographData[] {
	// Create a shallow copy to avoid mutating the original array
	const sorted = [...options];

	switch (sortMethod) {
		case 'type':
			// Sort primarily by letter type number, secondarily by letter itself
			sorted.sort((a, b) => {
				const typeNumA = OptionDataService.getLetterTypeNumber(a.letter || '');
				const typeNumB = OptionDataService.getLetterTypeNumber(b.letter || '');
				if (typeNumA !== typeNumB) {
					return typeNumA - typeNumB;
				}
				// If types are the same, sort alphabetically by letter
				return (a.letter || '').localeCompare(b.letter || '');
			});
			break;

		case 'endPosition':
			// Sort alphabetically by end position string
			sorted.sort((a, b) => (a.endPos || '').localeCompare(b.endPos || ''));
			break;

		case 'reversals':
			// Sort by the number of motion reversals (continuous < one < two)
			const reversalValueMap = { continuous: 0, one_reversal: 1, two_reversals: 2 };
			sorted.sort((a, b) => {
				const reversalA = OptionDataService.determineReversalFilter(sequence, a);
				const reversalB = OptionDataService.determineReversalFilter(sequence, b);
				return reversalValueMap[reversalA] - reversalValueMap[reversalB];
			});
			break;
	}
	return sorted;
}

/**
 * Filters an array of pictograph options based on the selected reversal filter.
 * @param options The array of options to filter.
 * @param filter The reversal filter criterion.
 * @param sequence The current sequence (needed for determining reversals).
 * @returns A new, filtered array of pictograph options.
 */
function filterOptionsByReversal(
    options: PictographData[],
    filter: ReversalFilterType,
    sequence: PictographData[]
): PictographData[] {
    if (filter === 'all') {
        return options; // No filtering needed
    }
    return options.filter(opt =>
        OptionDataService.determineReversalFilter(sequence, opt) === filter
    );
}


/**
 * Groups sorted and filtered options into categories based on the current sort method.
 * @param options The pre-filtered and pre-sorted options.
 * @param sortMethod The current sort method (determines grouping).
 * @param sequence The current sequence (needed for reversal grouping).
 * @returns A record where keys are category names and values are arrays of options.
 */
function groupOptionsByCategory(
	options: PictographData[],
	sortMethod: SortMethodType,
	sequence: PictographData[]
): Record<string, PictographData[]> {
	const grouped: Record<string, PictographData[]> = {};

	if (!options || options.length === 0) {
		return grouped; // Return empty object if no options
	}

	switch (sortMethod) {
		case 'type':
			// Group by letter type (Type1, Type2, etc.)
			options.forEach((option) => {
				const letterValue = LetterUtils.tryFromString(option.letter as Letter);
				const letterType = letterValue ? LetterType.getLetterType(letterValue) : null;
				// Use 'Unknown Type' as a fallback category name
				const typeName = letterType?.folderName ?? 'Unknown Type';
				if (!grouped[typeName]) grouped[typeName] = [];
				grouped[typeName].push(option);
			});
			// Optional: Ensure all standard types exist as keys, even if empty
			// ['Type1', 'Type2', 'Type3', 'Type4', 'Type5', 'Type6'].forEach(type => {
			// 	if (!grouped[type]) grouped[type] = [];
			// });
			break;

		case 'endPosition':
			// Group by end position string
			options.forEach((option) => {
				const endPos = option.endPos || 'Unknown Position';
				if (!grouped[endPos]) grouped[endPos] = [];
				grouped[endPos].push(option);
			});
			break;

		case 'reversals':
			// Group by reversal category (Continuous, One Reversal, Two Reversals)
			const categoryLabels: Record<ReversalFilterType, string> = {
				all: 'All', // Should not happen if pre-filtered
				continuous: 'Continuous',
				one_reversal: 'One Reversal',
				two_reversals: 'Two Reversals',
			};
			options.forEach((option) => {
				const reversalType = OptionDataService.determineReversalFilter(sequence, option);
				const categoryLabel = categoryLabels[reversalType];
				if (!grouped[categoryLabel]) grouped[categoryLabel] = [];
				grouped[categoryLabel].push(option);
			});
			break;

		default:
			// Fallback: Group all options under a single 'All' category
			grouped['All'] = options;
	}

	return grouped;
}

// --- Store Creation ---

function createOptionPickerStore() {
	const { subscribe, set, update } = writable<OptionPickerState>(initialState);

    // Internal processing function to apply filter and sort
    const processOptions = (state: OptionPickerState): PictographData[] => {
        const filtered = filterOptionsByReversal(state.allOptions, state.selectedFilter, state.currentSequence);
        const sortedAndFiltered = sortOptions(filtered, state.sortMethod, state.currentSequence);
        return sortedAndFiltered;
    };

	// --- Derived Store ---
	// Automatically groups the filtered+sorted options whenever the state changes
	const optionsByCategory = derived(
		{ subscribe }, // Depend on the main store's state
		($state) => groupOptionsByCategory($state.filteredOptions, $state.sortMethod, $state.currentSequence)
	);

	// --- Actions ---
	return {
		subscribe,
		optionsByLetterType: optionsByCategory, // Expose the derived grouped options

		/** Loads and processes options based on the provided sequence. */
		loadOptions: (sequence: PictographData[]) => {
			update((state) => ({
				...state,
				isLoading: true,
				currentSequence: sequence, // Store the sequence that triggered the load
				error: null,               // Clear previous errors
			}));

			try {
				// Fetch the raw next options based on the sequence
				const rawOptions = OptionDataService.getNextOptions(sequence);

				update((state) => {
                    // Update allOptions first
                    const newState = { ...state, allOptions: rawOptions };
                    // Then process (filter and sort) them
                    const processedOptions = processOptions(newState);

					return {
						...newState,
                        filteredOptions: processedOptions,
						isLoading: false, // Loading complete
					};
				});
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
				console.error('OptionPickerStore - Failed to load options:', errorMessage, err);
				update((state) => ({
					...state,
					isLoading: false, // Stop loading on error
					error: `Failed to load options: ${errorMessage}`,
					allOptions: [], // Clear options on error
					filteredOptions: [],
				}));
			}
		},

		/** Sets the reversal filter and re-processes the options. */
		setReversalFilter: (filter: ReversalFilterType) => {
			update((state) => {
                const newState = { ...state, selectedFilter: filter };
                const processedOptions = processOptions(newState);
				return {
                    ...newState,
                    filteredOptions: processedOptions
                };
			});
		},

		/** Sets the sort method and re-processes the options. */
		setSortMethod: (method: SortMethodType) => {
			update((state) => {
                const newState = { ...state, sortMethod: method };
                // Re-sort the *already filtered* options
                const reSortedOptions = sortOptions(state.filteredOptions, method, state.currentSequence);
				return {
                    ...newState,
                    filteredOptions: reSortedOptions // Update only filteredOptions
                };
			});
		},

		/** Selects an option, updating the global selectedPictograph store. */
		selectOption: (option: PictographData) => {
			selectedPictograph.set(option); // Update the external store
            // Optionally, could add logic here if the picker needs to react to its own selection
		},

		/** Resets the store to its initial state. */
		reset: () => {
			set(initialState);
            selectedPictograph.set(null); // Also clear global selection on reset
		},
	};
}

// --- Export Store Instance ---
export const optionPickerStore = createOptionPickerStore();
export default optionPickerStore; // Default export for convenience
