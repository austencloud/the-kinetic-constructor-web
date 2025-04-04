import { writable, derived } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import type { Letter } from '$lib/types/Letter';
import { LetterType } from '$lib/types/LetterType';
import { LetterUtils } from '$lib/utils/LetterUtils';
import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';
import { NO_ROT } from '$lib/types/Constants';
import { OptionDataService } from './OptionDataService';

// Simplified type definitions
export type SortMethod = 'type' | 'endPosition' | 'reversals';
export type ReversalFilter = 'all' | 'continuous' | 'oneReversal' | 'twoReversals';

// Core option picker state management
export function createOptionPickerStore() {
	// Centralized state management with clear separation of concerns
	const state = writable({
		allOptions: [] as PictographData[],
		currentSequence: [] as PictographData[],
		sortMethod: 'type' as SortMethod,
		reversalFilter: 'all' as ReversalFilter,
		isLoading: false,
		error: null as string | null
	});

	// Pure function for determining reversal category
	function determineReversalCategory(
		sequence: PictographData[],
		option: PictographData
	): ReversalFilter {
		const blueReversals = checkColorReversals(sequence, option, 'blue');
		const redReversals = checkColorReversals(sequence, option, 'red');

		if (blueReversals && redReversals) return 'continuous';
		if (blueReversals || redReversals) return 'oneReversal';
		return 'twoReversals';
	}

	// Utility function for checking color reversals
	function checkColorReversals(
		sequence: PictographData[],
		option: PictographData,
		color: 'blue' | 'red'
	): boolean {
		const motionKey = `${color}MotionData` as 'blueMotionData' | 'redMotionData';
		const lastRotation = findLastRotation(sequence, color);
		const currentRotation = option[motionKey]?.propRotDir ?? 'NO_ROT';

		return (
			lastRotation === 'NO_ROT' || currentRotation === 'NO_ROT' || lastRotation === currentRotation
		);
	}

	// Find the last non-static rotation in the sequence
	function findLastRotation(sequence: PictographData[], color: 'blue' | 'red'): string {
		const motionKey = `${color}MotionData` as 'blueMotionData' | 'redMotionData';

		for (let i = sequence.length - 1; i >= 0; i--) {
			const rotation = sequence[i]?.[motionKey]?.propRotDir;
			if (rotation && rotation !== NO_ROT) return rotation;
		}

		return 'NO_ROT';
	}

	// Sorting strategies
	const sortStrategies = {
		type: (a: PictographData, b: PictographData) => {
			const letterA = LetterUtils.tryFromString(a.letter as Letter);
			const letterB = LetterUtils.tryFromString(b.letter as Letter);

			const typeA = letterA ? LetterType.getLetterType(letterA) : null;
			const typeB = letterB ? LetterType.getLetterType(letterB) : null;

			return (typeA?.folderName ?? '').localeCompare(typeB?.folderName ?? '');
		},
		endPosition: (a: PictographData, b: PictographData) =>
			(a.endPos ?? '').localeCompare(b.endPos ?? ''),
		reversals: (sequence: PictographData[]) => (a: PictographData, b: PictographData) => {
			const reversalA = determineReversalCategory(sequence, a);
			const reversalB = determineReversalCategory(sequence, b);

			const reversalOrder: Record<Exclude<ReversalFilter, 'all'>, number> = {
				continuous: 0,
				oneReversal: 1,
				twoReversals: 2
			};

			// The 'all' filter should never reach here since we're sorting based on other filters
			return reversalOrder[reversalA as Exclude<ReversalFilter, 'all'>] - reversalOrder[reversalB as Exclude<ReversalFilter, 'all'>];
		}
	};

	// Derived store for filtering and sorting
	const filteredOptions = derived(state, ($state) => {
		let options = $state.allOptions;

		// Apply reversal filter
		if ($state.reversalFilter !== 'all') {
			options = options.filter(
				(option) =>
					determineReversalCategory($state.currentSequence, option) === $state.reversalFilter
			);
		}

		// Apply sorting
		if ($state.sortMethod === 'reversals') {
			options.sort(sortStrategies.reversals($state.currentSequence));
		} else {
			options.sort(sortStrategies[$state.sortMethod]);
		}

		return options;
	});

	// Grouped options by current sort method
	const groupedOptions = derived([filteredOptions, state], ([$filteredOptions, $state]) => {
		const groups: Record<string, PictographData[]> = {};

		$filteredOptions.forEach((option) => {
			const groupKey = determineGroupKey(option, $state.sortMethod, $state.currentSequence);
			if (!groups[groupKey]) groups[groupKey] = [];
			groups[groupKey].push(option);
		});

		return groups;
	});

	// Determine group key based on sort method
	function determineGroupKey(option: PictographData, sortMethod: SortMethod, sequence: PictographData[] = []): string {
		switch (sortMethod) {
			case 'type':
				const parsedLetter = LetterUtils.tryFromString(option.letter as Letter);
				const letterType = parsedLetter ? LetterType.getLetterType(parsedLetter) : null;
				return letterType?.folderName ?? 'Unknown Type';
			case 'endPosition':
				return option.endPos ?? 'Unknown Position';
			case 'reversals':
				const reversalCategory = determineReversalCategory(sequence, option);
				const categoryLabels = {
					continuous: 'Continuous',
					oneReversal: 'One Reversal',
					twoReversals: 'Two Reversals'
				};
				return categoryLabels[reversalCategory as keyof typeof categoryLabels];
		}
	}

	return {
		subscribe: state.subscribe,
		groupedOptions,

		// Actions
		loadOptions: (sequence: PictographData[]) => {
			state.update((s) => ({
				...s,
				currentSequence: sequence,
				isLoading: true,
				error: null
			}));

			try {
				const nextOptions = getNextOptions(sequence);

				state.update((s) => ({
					...s,
					allOptions: nextOptions,
					isLoading: false
				}));
			} catch (error) {
				state.update((s) => ({
					...s,
					isLoading: false,
					error: error instanceof Error ? error.message : 'Unknown error'
				}));
			}
		},

		setSortMethod: (method: SortMethod) => {
			state.update((s) => ({ ...s, sortMethod: method }));
		},

		setReversalFilter: (filter: ReversalFilter) => {
			state.update((s) => ({ ...s, reversalFilter: filter }));
		},

		selectOption: (option: PictographData) => {
			selectedPictograph.set(option);
		}
	};
}

// Utility function to get next options (placeholder - replace with actual logic)
function getNextOptions(sequence: PictographData[]): PictographData[] {
    return OptionDataService.getNextOptions(sequence);
}

export const optionPickerStore = createOptionPickerStore();
