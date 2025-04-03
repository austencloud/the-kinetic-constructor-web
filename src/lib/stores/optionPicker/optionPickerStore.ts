// src/lib/stores/optionPicker/optionPickerStore.ts
import { writable, derived } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';
import { OptionDataService } from '$lib/services/OptionDataService';
import type { Letter } from '$lib/types/Letter';
import { LetterType } from '$lib/types/LetterType';
import { LetterUtils } from '$lib/utils/LetterUtils';

export type ReversalFilterType = 'all' | 'continuous' | 'one_reversal' | 'two_reversals';

export interface OptionPickerState {
	options: PictographData[];
	filteredOptions: PictographData[];
	selectedFilter: ReversalFilterType;
	isLoading: boolean;
	optionsByLetter?: Record<string, PictographData[]>;
	currentSequence: PictographData[];
	error: string | null;
}

const initialState: OptionPickerState = {
	options: [],
	filteredOptions: [],
	selectedFilter: 'all',
	isLoading: true,
	currentSequence: [],
	error: null
};

function createOptionPickerStore() {
	const { subscribe, set, update } = writable<OptionPickerState>(initialState);

	// Updated optionsByLetterType derived store implementation
	const optionsByLetterType = derived({ subscribe }, ($state) => {
		const grouped: Record<string, PictographData[]> = {
			Type1: [],
			Type2: [],
			Type3: [],
			Type4: [],
			Type5: [],
			Type6: []
		};

		$state.filteredOptions.forEach((option) => {
			try {
				if (!option || !option.letter) return;

				// Convert letter to string if it's not already

				// use the letter utils to convert the letter to its enum value
				// Get letter type - use a more robust approach

				const letterValue = LetterUtils.tryFromString(option.letter as Letter);
				const letterType = letterValue ? LetterType.getLetterType(letterValue) : null;


				// Fallback to Type1 if no letter type is found
				const typeName = letterType?.folderName || 'Type1';

				// Make sure the array exists before pushing
				if (!grouped[typeName]) {
					grouped[typeName] = [];
				}

				grouped[typeName].push(option);
			} catch (error) {
				console.error('Error processing option:', error, option);
				// Put unclassified options in Type1 as fallback
				grouped.Type1.push(option);
			}
		});

		return grouped;
	});

	return {
		subscribe,
		optionsByLetterType,
		loadOptions: (sequence: PictographData[]) => {
			update((state) => ({
				...state,
				isLoading: true,
				currentSequence: sequence,
				error: null
			}));

			try {
				const options = OptionDataService.getNextOptions(sequence);

				update((state) => {
					const filteredOptions =
						state.selectedFilter === 'all'
							? options
							: options.filter(
									(opt) =>
										OptionDataService.determineReversalFilter(sequence, opt) ===
										state.selectedFilter
								);


					return {
						...state,
						options,
						filteredOptions,
						isLoading: false
					};
				});
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				console.error('Failed to load options:', errorMessage);

				update((state) => ({
					...state,
					isLoading: false,
					error: `Failed to load options: ${errorMessage}`
				}));
			}
		},
		setReversalFilter: (filter: ReversalFilterType) => {
			update((state) => {
				const filteredOptions =
					filter === 'all'
						? state.options
						: state.options.filter(
								(opt) =>
									OptionDataService.determineReversalFilter(state.currentSequence, opt) === filter
							);

				return {
					...state,
					selectedFilter: filter,
					filteredOptions
				};
			});
		},
		selectOption: (option: PictographData) => {
			selectedPictograph.set(option);
		},
		reset: () => {
			set(initialState);
		}
		
	};
}

export const optionPickerStore = createOptionPickerStore();

export default optionPickerStore;
