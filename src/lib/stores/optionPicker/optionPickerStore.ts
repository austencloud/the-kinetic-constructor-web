// src/lib/stores/optionPicker/optionPickerStore.ts
import { writable, derived } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';
import { OptionDataService } from '$lib/services/OptionDataService';
import { LetterUtils } from '$lib/utils/LetterUtils';
import type { Letter } from '$lib/types/Letter';
import { LetterType } from '$lib/types/LetterType';

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
			if (!option || !option.letter) return;

			const letterType = LetterType.getLetterType(option.letter);

			if (letterType) {
				grouped[letterType.folderName].push(option);
			}
		});

		return grouped;
	});

	function getLetterType(letter: Letter | null): LetterType | null {
		if (!letter) return null;

		const letterType = LetterUtils.getLetterType(letter);

		if (!letterType) return null;

		switch (letterType.folderName) {
			case 'Type1':
				return LetterType.Type1;
			case 'Type2':
				return LetterType.Type2;
			case 'Type3':
				return LetterType.Type3;
			case 'Type4':
				return LetterType.Type4;
			case 'Type5':
				return LetterType.Type5;
			case 'Type6':
				return LetterType.Type6;
			default:
				return null;
		}
	}

	return {
		subscribe,
		optionsByLetterType, // Exporting the derived store
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
