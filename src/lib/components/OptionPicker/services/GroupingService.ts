// src/lib/components/OptionPicker/services/GroupingService.ts
import type { PictographData } from '$lib/types/PictographData';
import type { SortMethod } from '../stores/optionPickerStore';
import type { Letter } from '$lib/types/Letter';
import { LetterType } from '$lib/types/LetterType';
import { LetterUtils } from '$lib/utils/LetterUtils';
import { ReversalService } from './ReversalService';

export class GroupingService {
	/**
	 * Determines the appropriate group key for an option based on sort method
	 */
	static determineGroupKey(
		option: PictographData,
		sortMethod: SortMethod,
		sequence: PictographData[] = []
	): string {
		switch (sortMethod) {
			case 'type':
				const parsedLetter = LetterUtils.tryFromString((option.letter as Letter) ?? undefined);
				const letterType = parsedLetter ? LetterType.getLetterType(parsedLetter) : null;
				return letterType?.folderName ?? 'Unknown Type';

			case 'endPosition':
				const endPos = option.endPos ?? 'Unknown';
				// Extract only the leading letters (e.g., "alpha" from "alpha1")
				const match = endPos.match(/^([a-zA-Z]+)/);
				// Use the matched letters or fallback to the original/unknown
				return match ? match[1] : endPos;

			case 'reversals':
				const reversalCategory = ReversalService.determineReversalCategory(sequence, option);
				const categoryLabels = {
					continuous: 'Continuous',
					oneReversal: 'One Reversal',
					twoReversals: 'Two Reversals'
				};
				return categoryLabels[reversalCategory];

			default:
				return 'Unknown Group';
		}
	}

	/**
	 * Sorts group keys in the appropriate order based on sort method
	 */
	static getSortedGroupKeys(keys: string[], sortMethod: SortMethod): string[] {
		return keys.sort((a, b) => {
			if (sortMethod === 'type') {
				const typeNumA = parseInt(a.match(/Type(\d)/)?.[1] ?? '99');
				const typeNumB = parseInt(b.match(/Type(\d)/)?.[1] ?? '99');
				if (typeNumA !== typeNumB) return typeNumA - typeNumB;
				// Fallback sort for non-standard type names or if numbers are equal
				return a.localeCompare(b);
			}

			if (sortMethod === 'reversals') {
				const reversalOrder: Record<string, number> = {
					Continuous: 0, // Match the labels from determineGroupKey
					'One Reversal': 1,
					'Two Reversals': 2
				};
				return (reversalOrder[a] ?? 99) - (reversalOrder[b] ?? 99);
			}

			// Default sort (covers endPosition groups like "alpha", "beta", etc.)
			return a.localeCompare(b);
		});
	}
}
