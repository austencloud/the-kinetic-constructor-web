// src/lib/components/OptionPicker/store.ts
import { writable, derived, get } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';
import { NO_ROT } from '$lib/types/Constants';
import type { PropRotDir } from '$lib/types/Types';
import type { Letter } from '$lib/types/Letter';
import { LetterType } from '$lib/types/LetterType';
import { LetterUtils } from '$lib/utils/LetterUtils';
import pictographDataStore from '$lib/stores/pictograph/pictographStore';
import { memoizeLRU } from '$lib/utils/memoizationUtils';
import type { SortMethod, ReversalFilter } from './config';

// ===== Core State =====
export const sequenceStore = writable<PictographData[]>([]);
export const optionsStore = writable<PictographData[]>([]);

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
	loadOptions: async (sequence: PictographData[]) => {
		// Update sequence
		sequenceStore.set(sequence);

		// Set loading state
		uiState.update((state) => ({ ...state, isLoading: true, error: null }));

		try {
			const nextOptions = await getNextOptions(sequence);
			optionsStore.set(nextOptions);
			uiState.update((state) => ({ ...state, isLoading: false }));
		} catch (error) {
			uiState.update((state) => ({
				...state,
				isLoading: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			}));
		}
	},

	setSortMethod: (method: SortMethod) => {
		uiState.update((state) => {
			if (state.showAllActive) return state;
			return { ...state, sortMethod: method };
		});
	},

	setReversalFilter: (filter: ReversalFilter) => {
		uiState.update((state) => {
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
	}
};

// ===== Derived Stores =====

// Filtered options - applies filtering and sorting to options
export const filteredOptionsStore = derived(
	[optionsStore, sequenceStore, uiState],
	([$options, $sequence, $ui]) => {
		// Clone options to avoid mutating original array
		let options = [...$options];

		// Apply reversal filtering
		if ($ui.reversalFilter !== 'all') {
			options = options.filter(
				(option) => determineReversalCategory($sequence, option) === $ui.reversalFilter
			);
		}

		// Apply appropriate sorting
		options.sort(getSorter($ui.sortMethod, $sequence));

		return options;
	}
);

// Grouped options - for tab organization
export const groupedOptionsStore = derived(
	[filteredOptionsStore, sequenceStore, uiState],
	([$filteredOptions, $sequence, $ui]) => {
		const effectiveSortMethod = $ui.showAllActive ? 'type' : $ui.sortMethod;

		// Group options by appropriate key
		const groups: Record<string, PictographData[]> = {};

		$filteredOptions.forEach((option) => {
			const groupKey = determineGroupKey(option, effectiveSortMethod, $sequence);

			if (!groups[groupKey]) groups[groupKey] = [];
			groups[groupKey].push(option);
		});

		// Sort the group keys
		const sortedKeys = getSortedGroupKeys(Object.keys(groups), effectiveSortMethod);

		// Build final sorted groups object
		const sortedGroups: Record<string, PictographData[]> = {};
		sortedKeys.forEach((key) => {
			sortedGroups[key] = groups[key];
		});

		return sortedGroups;
	}
);

// ===== Option Data Utilities =====

function getNextOptions(sequence: PictographData[]): Promise<PictographData[]> {
	const lastPictograph = sequence.at(-1);

	// If sequence is empty, return initial options
	if (!lastPictograph) {
		return Promise.resolve([]); // Initial options
	}

	// Find options where start position matches end position of last pictograph
	return Promise.resolve(findOptionsByStartPosition(lastPictograph.endPos ?? undefined));
}

function findOptionsByStartPosition(targetStartPos?: string): PictographData[] {
	if (!targetStartPos) {
		console.warn('Cannot find next options: Last pictograph has no end position.');
		return [];
	}

	const allPictographs = get(pictographDataStore);

	if (!Array.isArray(allPictographs) || !allPictographs.length) {
		console.warn('No pictographs available in the global store.');
		return [];
	}

	return allPictographs.filter((pictograph) => pictograph?.startPos === targetStartPos);
}

// ===== Reversal Category Functions =====

// Determines the reversal category of an option relative to the current sequence
const determineReversalCategory = memoizeLRU(
	(sequence: PictographData[], option: PictographData): Exclude<ReversalFilter, 'all'> => {
		const blueContinuous = checkColorContinuity(sequence, option, 'blue');
		const redContinuous = checkColorContinuity(sequence, option, 'red');

		if (blueContinuous && redContinuous) return 'continuous';
		if (blueContinuous || redContinuous) return 'oneReversal';
		return 'twoReversals';
	},
	100,
	(sequence, option) => {
		const lastItem = sequence[sequence.length - 1];
		return `${sequence.length}:${lastItem?.letter || 'empty'}:${option.letter || 'unknown'}:${option.startPos || ''}:${option.endPos || ''}`;
	}
);

// Finds the last non-static rotation direction for a given color in the sequence
const findLastRotation = memoizeLRU(
	(sequence: PictographData[], color: 'blue' | 'red'): PropRotDir => {
		const motionDataKey = color === 'blue' ? 'blueMotionData' : 'redMotionData';

		for (let i = sequence.length - 1; i >= 0; i--) {
			const rotation = sequence[i]?.[motionDataKey]?.propRotDir;
			if (rotation && rotation !== NO_ROT) {
				return rotation;
			}
		}
		return NO_ROT;
	},
	50,
	(sequence, color) => {
		const relevantItems = sequence.slice(-5);
		return `${color}:${relevantItems
			.map((item) => `${item.letter || ''}${item.startPos || ''}${item.endPos || ''}`)
			.join(',')}`;
	}
);

// Checks if rotation direction for a specific color is continuous
function checkColorContinuity(
	sequence: PictographData[],
	option: PictographData,
	color: 'blue' | 'red'
): boolean {
	const motionDataKey = color === 'blue' ? 'blueMotionData' : 'redMotionData';
	const lastRotation = findLastRotation(sequence, color);
	const currentRotation = option[motionDataKey]?.propRotDir ?? NO_ROT;

	return lastRotation === NO_ROT || currentRotation === NO_ROT || lastRotation === currentRotation;
}

// ===== Group & Sort Functions =====

// Determines the appropriate group key for an option
function determineGroupKey(
	option: PictographData,
	sortMethod: SortMethod,
	sequence: PictographData[] = []
): string {
	switch (sortMethod) {
		case 'type': {
			const parsedLetter = LetterUtils.tryFromString((option.letter as Letter) ?? undefined);
			const letterType = parsedLetter ? LetterType.getLetterType(parsedLetter) : null;
			return letterType?.folderName ?? 'Unknown Type';
		}

		case 'endPosition': {
			const endPos = option.endPos ?? 'Unknown';
			const match = endPos.match(/^([a-zA-Z]+)/);
			return match ? match[1] : endPos;
		}

		case 'reversals': {
			const reversalCategory = determineReversalCategory(sequence, option);
			const categoryLabels = {
				continuous: 'Continuous',
				oneReversal: 'One Reversal',
				twoReversals: 'Two Reversals'
			};
			return categoryLabels[reversalCategory];
		}

		default:
			return 'Unknown Group';
	}
}

// Sorts group keys in appropriate order
function getSortedGroupKeys(keys: string[], sortMethod: SortMethod): string[] {
	return keys.sort((a, b) => {
		if (sortMethod === 'type') {
			const typeNumA = parseInt(a.match(/Type(\d)/)?.[1] ?? '99');
			const typeNumB = parseInt(b.match(/Type(\d)/)?.[1] ?? '99');
			if (typeNumA !== typeNumB) return typeNumA - typeNumB;
			return a.localeCompare(b);
		}

		if (sortMethod === 'reversals') {
			const reversalOrder: Record<string, number> = {
				Continuous: 0,
				'One Reversal': 1,
				'Two Reversals': 2
			};
			return (reversalOrder[a] ?? 99) - (reversalOrder[b] ?? 99);
		}

		return a.localeCompare(b);
	});
}

// Gets appropriate sorter function
function getSorter(method: SortMethod, sequence: PictographData[] = []) {
	const sorters = {
		type: (a: PictographData, b: PictographData) => {
			const typeA = getLetterTypeNumber(a.letter ?? undefined);
			const typeB = getLetterTypeNumber(b.letter ?? undefined);
			if (typeA !== typeB) return typeA - typeB;
			return (a.letter ?? '').localeCompare(b.letter ?? '');
		},

		endPosition: (a: PictographData, b: PictographData) =>
			(a.endPos ?? '').localeCompare(b.endPos ?? ''),

		reversals: (a: PictographData, b: PictographData) => {
			const reversalA = determineReversalCategory(sequence, a);
			const reversalB = determineReversalCategory(sequence, b);

			const reversalOrder = {
				continuous: 0,
				oneReversal: 1,
				twoReversals: 2
			};

			return reversalOrder[reversalA] - reversalOrder[reversalB];
		},

		default: (a: PictographData, b: PictographData) =>
			(a.letter ?? '').localeCompare(b.letter ?? '')
	};

	return sorters[method] || sorters.default;
}

// Gets numerical type associated with a letter
function getLetterTypeNumber(letter?: Letter | string): number {
	if (!letter) return 1;

	const parsedLetter = LetterUtils.tryFromString(letter as Letter);
	if (!parsedLetter) return 1;

	const letterType = LetterType.getLetterType(parsedLetter);
	if (!letterType?.folderName) return 1;

	const typeMatch = letterType.folderName.match(/Type(\d)/);
	return typeMatch ? parseInt(typeMatch[1], 10) : 1;
}

// Export for backwards compatibility
export const optionPickerStore = {
	subscribe: derived([optionsStore, sequenceStore, uiState], ([$options, $sequence, $ui]) => ({
		allOptions: $options,
		currentSequence: $sequence,
		...$ui
	})).subscribe,
	...actions
};
