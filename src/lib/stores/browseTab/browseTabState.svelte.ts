/**
 * Browse Tab State Management with Svelte 5 Runes
 *
 * Modern replacement for browseTabStore.ts using Svelte 5 runes
 */

import { createPersistentObjectState } from '$lib/state/core/runes.svelte';

// Re-export types for compatibility
export type FilterType =
	| 'all'
	| 'favorites'
	| 'tag'
	| 'difficulty'
	| 'startingPosition'
	| 'startingLetter'
	| 'containsLetters'
	| 'length'
	| 'gridMode';

export type SortType = 'alphabetical' | 'difficulty' | 'dateAdded' | 'length';
export type SortDirection = 'asc' | 'desc';

export interface FilterCriteria {
	type: FilterType;
	value?: string | number | string[];
}

export interface SortCriteria {
	field: SortType;
	direction: SortDirection;
}

export interface SequenceVariation {
	id: string;
	thumbnailPath: string;
	metadata: {
		level?: number;
		author?: string;
		dateAdded?: string;
		gridMode?: string;
		startingPosition?: string;
		isFavorite?: boolean;
		length?: number;
		tags?: string[];
		[key: string]: any;
	};
}

export interface SequenceData {
	id: string;
	word: string;
	variations: SequenceVariation[];
	metadata: {
		level?: number;
		author?: string;
		dateAdded?: string;
		gridMode?: string;
		startingPosition?: string;
		length?: number;
		tags?: string[];
		[key: string]: any;
	};
}

export interface BrowseTabState {
	allSequences: SequenceData[];
	currentFilter: FilterCriteria;
	currentSort: SortCriteria;
	selectedSequenceId: string | null;
	selectedVariationIndex: number;
	isLoading: boolean;
	error: string | null;
}

// Create the state using Svelte 5 runes
const defaultState: BrowseTabState = {
	allSequences: [],
	currentFilter: { type: 'all' },
	currentSort: { field: 'alphabetical', direction: 'asc' },
	selectedSequenceId: null,
	selectedVariationIndex: 0,
	isLoading: false,
	error: null
};

// Create persistent state that syncs with localStorage
export const browseTabState = createPersistentObjectState('browseTabState', defaultState, {
	// Only persist filter and sort preferences, not the sequence data
	persistFields: ['currentFilter', 'currentSort'],
	debounceMs: 300
});

// Derived state function for filtered sequences
export function filteredSequences() {
	const { allSequences, currentFilter } = browseTabState;

	return allSequences.filter((sequence) => {
		switch (currentFilter.type) {
			case 'all':
				return true;

			case 'favorites':
				return sequence.variations.some((v) => v.metadata.isFavorite);

			case 'tag':
				return sequence.metadata.tags?.includes(currentFilter.value as string) || false;

			case 'difficulty':
				return sequence.metadata.level === currentFilter.value;

			case 'startingPosition':
				return sequence.metadata.startingPosition === currentFilter.value;

			case 'startingLetter':
				return sequence.word
					.toLowerCase()
					.startsWith((currentFilter.value as string).toLowerCase());

			case 'containsLetters':
				const letters = currentFilter.value as string[];
				return letters.every((letter) =>
					sequence.word.toLowerCase().includes(letter.toLowerCase())
				);

			case 'length':
				return sequence.metadata.length === currentFilter.value;

			case 'gridMode':
				return sequence.metadata.gridMode === currentFilter.value;

			default:
				return true;
		}
	});
}

// Derived state function for sorted sequences
export function sortedSequences() {
	const { currentSort } = browseTabState;
	const sequences = [...filteredSequences()];

	return sequences.sort((a, b) => {
		const direction = currentSort.direction === 'asc' ? 1 : -1;

		switch (currentSort.field) {
			case 'alphabetical':
				return direction * a.word.localeCompare(b.word);

			case 'difficulty':
				const levelA = a.metadata.level || 0;
				const levelB = b.metadata.level || 0;
				return direction * (levelA - levelB);

			case 'dateAdded':
				const dateA = a.metadata.dateAdded ? new Date(a.metadata.dateAdded).getTime() : 0;
				const dateB = b.metadata.dateAdded ? new Date(b.metadata.dateAdded).getTime() : 0;
				return direction * (dateA - dateB);

			case 'length':
				const lengthA = a.metadata.length || 0;
				const lengthB = b.metadata.length || 0;
				return direction * (lengthA - lengthB);

			default:
				return 0;
		}
	});
}

// Derived state function for selected sequence data
export function selectedSequenceData() {
	const { allSequences, selectedSequenceId, selectedVariationIndex } = browseTabState;

	const sequence = allSequences.find((seq) => seq.id === selectedSequenceId) || null;
	const variation =
		sequence && selectedVariationIndex >= 0 && selectedVariationIndex < sequence.variations.length
			? sequence.variations[selectedVariationIndex]
			: null;

	return { sequence, variation };
}

// Action functions
export const browseTabActions = {
	async loadInitialData() {
		browseTabState.isLoading = true;
		browseTabState.error = null;

		try {
			const { fetchSequences } = await import('$lib/services/sequenceService');
			const sequences = await fetchSequences();

			browseTabState.allSequences = sequences;
			browseTabState.isLoading = false;
		} catch (error) {
			browseTabState.isLoading = false;
			browseTabState.error = error instanceof Error ? error.message : 'Failed to load sequences';
		}
	},

	applyFilter(filterCriteria: FilterCriteria) {
		browseTabState.currentFilter = filterCriteria;
		browseTabState.selectedSequenceId = null;
		browseTabState.selectedVariationIndex = 0;
	},

	applySort(sortCriteria: SortCriteria) {
		browseTabState.currentSort = sortCriteria;
	},

	selectSequence(sequenceId: string) {
		const sequence = browseTabState.allSequences.find((seq) => seq.id === sequenceId);
		if (sequence) {
			browseTabState.selectedSequenceId = sequenceId;
			browseTabState.selectedVariationIndex = 0;
		}
	},

	selectVariation(index: number) {
		const sequence = browseTabState.allSequences.find(
			(seq) => seq.id === browseTabState.selectedSequenceId
		);
		if (sequence && index >= 0 && index < sequence.variations.length) {
			browseTabState.selectedVariationIndex = index;
		}
	},

	async toggleFavorite(sequenceId: string, variationId: string) {
		const sequence = browseTabState.allSequences.find((seq) => seq.id === sequenceId);
		if (!sequence) return;

		const variationIndex = sequence.variations.findIndex((v) => v.id === variationId);
		if (variationIndex === -1) return;

		const isFavorite = sequence.variations[variationIndex].metadata.isFavorite || false;

		// Update optimistically
		sequence.variations[variationIndex].metadata.isFavorite = !isFavorite;

		try {
			const { updateFavoriteStatus } = await import('$lib/services/sequenceService');
			await updateFavoriteStatus(sequenceId, variationId, !isFavorite);
		} catch (error) {
			// Revert on error
			sequence.variations[variationIndex].metadata.isFavorite = isFavorite;
			browseTabState.error =
				error instanceof Error ? error.message : 'Failed to update favorite status';
		}
	},

	async deleteVariation(sequenceId: string, variationId: string) {
		const sequenceIndex = browseTabState.allSequences.findIndex((seq) => seq.id === sequenceId);
		if (sequenceIndex === -1) return;

		const sequence = browseTabState.allSequences[sequenceIndex];
		const originalVariations = [...sequence.variations];

		// Update optimistically
		const newVariations = sequence.variations.filter((v) => v.id !== variationId);

		if (newVariations.length === 0) {
			// Remove entire sequence
			browseTabState.allSequences.splice(sequenceIndex, 1);
			browseTabState.selectedSequenceId = null;
			browseTabState.selectedVariationIndex = 0;
		} else {
			// Update sequence with remaining variations
			sequence.variations = newVariations;
			if (browseTabState.selectedVariationIndex >= newVariations.length) {
				browseTabState.selectedVariationIndex = newVariations.length - 1;
			}
		}

		try {
			const { deleteVariationApi } = await import('$lib/services/sequenceService');
			await deleteVariationApi(sequenceId, variationId);
		} catch (error) {
			// Revert on error
			if (newVariations.length === 0) {
				browseTabState.allSequences.splice(sequenceIndex, 0, sequence);
			} else {
				sequence.variations = originalVariations;
			}
			browseTabState.error = error instanceof Error ? error.message : 'Failed to delete variation';
		}
	},

	async deleteSequence(sequenceId: string) {
		const sequenceIndex = browseTabState.allSequences.findIndex((seq) => seq.id === sequenceId);
		if (sequenceIndex === -1) return;

		const originalSequence = browseTabState.allSequences[sequenceIndex];

		// Update optimistically
		browseTabState.allSequences.splice(sequenceIndex, 1);
		browseTabState.selectedSequenceId = null;
		browseTabState.selectedVariationIndex = 0;

		try {
			const { deleteSequenceApi } = await import('$lib/services/sequenceService');
			await deleteSequenceApi(sequenceId);
		} catch (error) {
			// Revert on error
			browseTabState.allSequences.splice(sequenceIndex, 0, originalSequence);
			browseTabState.error = error instanceof Error ? error.message : 'Failed to delete sequence';
		}
	},

	clearError() {
		browseTabState.error = null;
	}
};
