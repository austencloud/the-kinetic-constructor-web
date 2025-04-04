// src/lib/components/OptionPicker/stores/optionPickerStore.ts
import { writable, derived, get } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';
import { OptionDataService } from '../services/OptionDataService';

// Core types
export type SortMethod = 'type' | 'endPosition' | 'reversals';
export type ReversalFilter = 'all' | 'continuous' | 'oneReversal' | 'twoReversals';

// Base state type
export interface OptionPickerState {
	allOptions: PictographData[];
	currentSequence: PictographData[];
	sortMethod: SortMethod;
	reversalFilter: ReversalFilter;
	showAllActive: boolean;
	isLoading: boolean;
	error: string | null;
}

// Initial state
const initialState: OptionPickerState = {
	allOptions: [],
	currentSequence: [],
	sortMethod: 'type',
	reversalFilter: 'all',
	showAllActive: false,
	isLoading: false,
	error: null
};

// Create the base store
const createBaseStore = () => {
	const { subscribe, set, update } = writable<OptionPickerState>(initialState);

	return {
		subscribe,

		// Actions
		loadOptions: async (sequence: PictographData[]) => {
			update((state) => ({ ...state, isLoading: true, error: null, currentSequence: sequence }));

			try {
				const nextOptions = await OptionDataService.getNextOptions(sequence);
				update((state) => ({ ...state, allOptions: nextOptions, isLoading: false }));
			} catch (error) {
				update((state) => ({
					...state,
					isLoading: false,
					error: error instanceof Error ? error.message : 'Unknown error'
				}));
			}
		},

		setSortMethod: (method: SortMethod) => {
			update((state) => {
				if (state.showAllActive) return state;
				return { ...state, sortMethod: method };
			});
		},

		setReversalFilter: (filter: ReversalFilter) => {
			update((state) => {
				if (state.showAllActive) return state;
				return { ...state, reversalFilter: filter };
			});
		},

		toggleShowAll: () => {
			update((state) => ({ ...state, showAllActive: !state.showAllActive }));
		},

		selectOption: (option: PictographData) => {
			selectedPictograph.set(option);
		},

		reset: () => set(initialState)
	};
};

// Create the base store instance
export const optionPickerStore = createBaseStore();


