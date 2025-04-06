// src/lib/components/OptionPicker/services/SortingService.ts
import type { PictographData } from '$lib/types/PictographData';
import type { SortMethod } from '../store';
import { OptionDataService } from './OptionDataService';
import { ReversalService } from './ReversalService';

export class SortingService {
	/**
	 * Get a sorter function for the specified sort method
	 */
	static getSorter(method: SortMethod) {
		switch (method) {
			case 'type':
				return this.getTypeSorter();
			case 'endPosition':
				return this.getEndPositionSorter();
			default:
				return this.getDefaultSorter();
		}
	}

	/**
	 * Sorter for type-based sorting
	 */
	static getTypeSorter() {
		return (a: PictographData, b: PictographData) => {
			const typeA = OptionDataService.getLetterTypeNumber(a.letter ?? undefined);
			const typeB = OptionDataService.getLetterTypeNumber(b.letter ?? undefined);
			if (typeA !== typeB) return typeA - typeB;
			return (a.letter ?? '').localeCompare(b.letter ?? '');
		};
	}

	/**
	 * Sorter for end position based sorting
	 */
	static getEndPositionSorter() {
		return (a: PictographData, b: PictographData) => (a.endPos ?? '').localeCompare(b.endPos ?? '');
	}

	/**
	 * Sorter for reversal-based sorting
	 */
	static getReversalSorter(sequence: PictographData[]) {
		return (a: PictographData, b: PictographData) => {
			const reversalA = ReversalService.determineReversalCategory(sequence, a);
			const reversalB = ReversalService.determineReversalCategory(sequence, b);

			const reversalOrder = {
				continuous: 0,
				oneReversal: 1,
				twoReversals: 2
			};

			return reversalOrder[reversalA] - reversalOrder[reversalB];
		};
	}

	/**
	 * Default sorter (alphabetical by letter)
	 */
	static getDefaultSorter() {
		return (a: PictographData, b: PictographData) => (a.letter ?? '').localeCompare(b.letter ?? '');
	}
}
