// src/lib/components/OptionPicker/optionPickerStore.ts
import { writable, derived } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';
import { OptionDataService } from '$lib/components/OptionPicker/OptionDataService';
import type { Letter } from '$lib/types/Letter';
import { LetterType } from '$lib/types/LetterType';
import { LetterUtils } from '$lib/utils/LetterUtils';

export type ReversalFilterType = 'all' | 'continuous' | 'one_reversal' | 'two_reversals';
export type SortMethodType = 'type' | 'endPosition' | 'reversals';

export interface OptionPickerState {
	options: PictographData[];
	filteredOptions: PictographData[];
	selectedFilter: ReversalFilterType;
	sortMethod: SortMethodType;
	isLoading: boolean;
	optionsByLetter?: Record<string, PictographData[]>;
	currentSequence: PictographData[];
	error: string | null;
}

const initialState: OptionPickerState = {
	options: [],
	filteredOptions: [],
	selectedFilter: 'all',
	sortMethod: 'type',
	isLoading: true,
	currentSequence: [],
	error: null
};

function createOptionPickerStore() {
	const { subscribe, set, update } = writable<OptionPickerState>(initialState);

	// Sort options based on the current sort method
	function sortOptions(options: PictographData[], sortMethod: SortMethodType, sequence: PictographData[]): PictographData[] {
		if (!options || options.length === 0) return [];
		
		switch (sortMethod) {
			case 'type':
				// Sort by letter type
				return [...options].sort((a, b) => {
					const letterA = LetterUtils.tryFromString(a.letter as Letter);
					const letterB = LetterUtils.tryFromString(b.letter as Letter);
					
					const typeA = letterA ? LetterType.getLetterType(letterA)?.folderName || 'Type1' : 'Type1';
					const typeB = letterB ? LetterType.getLetterType(letterB)?.folderName || 'Type1' : 'Type1';
					
					return typeA.localeCompare(typeB);
				});
				
			case 'endPosition':
				// Sort by end position (alpha, beta, gamma)
				return [...options].sort((a, b) => {
					const endPosA = a.endPos || '';
					const endPosB = b.endPos || '';
					return endPosA.localeCompare(endPosB);
				});
				
			case 'reversals':
				// Sort by number of reversals
				return [...options].sort((a, b) => {
					const reversalA = OptionDataService.determineReversalFilter(sequence, a);
					const reversalB = OptionDataService.determineReversalFilter(sequence, b);
					
					// Convert reversal types to numeric values for sorting
					const reversalValueMap = {
						'continuous': 0,
						'one_reversal': 1,
						'two_reversals': 2
					};
					
					return reversalValueMap[reversalA] - reversalValueMap[reversalB];
				});
				
			default:
				return options;
		}
	}
	
	// Group options by their category based on the current sort method
	function groupOptionsByCategory(options: PictographData[], sortMethod: SortMethodType, sequence: PictographData[]): Record<string, PictographData[]> {
		if (!options || options.length === 0) {
			return {};
		}
		
		const grouped: Record<string, PictographData[]> = {};
		
		switch (sortMethod) {
			case 'type':
				// Default letter type grouping
				options.forEach((option) => {
					try {
						if (!option || !option.letter) return;
						
						const letterValue = LetterUtils.tryFromString(option.letter as Letter);
						const letterType = letterValue ? LetterType.getLetterType(letterValue) : null;
						const typeName = letterType?.folderName || 'Type1';
						
						if (!grouped[typeName]) {
							grouped[typeName] = [];
						}
						
						grouped[typeName].push(option);
					} catch (error) {
						console.error('Error processing option:', error, option);
						if (!grouped['Type1']) grouped['Type1'] = [];
						grouped['Type1'].push(option);
					}
				});
				
				// Ensure we have entries for all types even if empty
				['Type1', 'Type2', 'Type3', 'Type4', 'Type5', 'Type6'].forEach(type => {
					if (!grouped[type]) grouped[type] = [];
				});
				break;
				
			case 'endPosition':
				// Group by end position
				options.forEach((option) => {
					const endPos = option.endPos || 'Unknown';
					
					if (!grouped[endPos]) {
						grouped[endPos] = [];
					}
					
					grouped[endPos].push(option);
				});
				break;
				
			case 'reversals':
				// Group by reversal count
				options.forEach((option) => {
					const reversalType = OptionDataService.determineReversalFilter(sequence, option);
					const categoryLabel = {
						'continuous': 'Continuous',
						'one_reversal': 'One Reversal',
						'two_reversals': 'Two Reversals'
					}[reversalType];
					
					if (!grouped[categoryLabel]) {
						grouped[categoryLabel] = [];
					}
					
					grouped[categoryLabel].push(option);
				});
				break;
				
			default:
				// Fallback to a single group
				grouped['All'] = options;
		}
		
		return grouped;
	}

	// Updated optionsByLetterType derived store implementation
	const optionsByCategory = derived({ subscribe }, ($state) => {
		return groupOptionsByCategory(
			$state.filteredOptions, 
			$state.sortMethod, 
			$state.currentSequence
		);
	});

	return {
		subscribe,
		optionsByLetterType: optionsByCategory,
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
					
					// Sort the options based on current sort method
					const sortedOptions = sortOptions(filteredOptions, state.sortMethod, sequence);

					return {
						...state,
						options,
						filteredOptions: sortedOptions,
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
				
				// Sort the filtered options based on current sort method
				const sortedOptions = sortOptions(filteredOptions, state.sortMethod, state.currentSequence);

				return {
					...state,
					selectedFilter: filter,
					filteredOptions: sortedOptions
				};
			});
		},
		setSortMethod: (method: SortMethodType) => {
			update((state) => {
				// We don't need to re-filter, just resort existing filtered options
				const sortedOptions = sortOptions(state.filteredOptions, method, state.currentSequence);
				
				return {
					...state,
					sortMethod: method,
					filteredOptions: sortedOptions
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