// src/lib/components/OptionPicker/services/ReversalService.ts
import type { PictographData } from '$lib/types/PictographData';
import { NO_ROT } from '$lib/types/Constants';
import type { PropRotDir } from '$lib/types/Types';
import type { ReversalFilter } from '../stores/optionPickerStore';
// src/lib/components/OptionPicker/services/ReversalService.ts
import { memoizeLRU } from '$lib/utils/memoizationUtils';

export class ReversalService {
	static determineReversalCategory = memoizeLRU(
		(sequence: PictographData[], option: PictographData): Exclude<ReversalFilter, 'all'> => {
			const blueContinuous = ReversalService.checkColorContinuity(sequence, option, 'blue');
			const redContinuous = ReversalService.checkColorContinuity(sequence, option, 'red');

			if (blueContinuous && redContinuous) return 'continuous';
			if (blueContinuous || redContinuous) return 'oneReversal';
			return 'twoReversals';
		},
		100,
		(sequence, option) => {
			// Use properties we know exist
			const lastItem = sequence[sequence.length - 1];
			return `${sequence.length}:${lastItem?.letter || 'empty'}:${option.letter || 'unknown'}:${option.startPos || ''}:${option.endPos || ''}`;
		}
	);

	private static findLastRotation = memoizeLRU(
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
			// Create unique keys using properties we know exist
			const relevantItems = sequence.slice(-5);
			return `${color}:${relevantItems
				.map((item) => `${item.letter || ''}${item.startPos || ''}${item.endPos || ''}`)
				.join(',')}`;
		}
	);
	// Keep this as a regular method that uses the memoized methods above
	private static checkColorContinuity(
		sequence: PictographData[],
		option: PictographData,
		color: 'blue' | 'red'
	): boolean {
		const motionDataKey = color === 'blue' ? 'blueMotionData' : 'redMotionData';
		const lastRotation = ReversalService.findLastRotation(sequence, color);
		const currentRotation = option[motionDataKey]?.propRotDir ?? NO_ROT;

		return (
			lastRotation === NO_ROT || currentRotation === NO_ROT || lastRotation === currentRotation
		);
	}
}
