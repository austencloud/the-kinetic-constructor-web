// src/lib/services/OptionDataService.ts
import type { PictographData } from '$lib/types/PictographData';
import type { BeatData } from '$lib/components/SequenceWorkbench/SequenceBeatFrame/BeatData';
import { LetterType } from '$lib/types/LetterType';
import { NO_ROT } from '$lib/types/Constants';
import { LetterUtils } from '$lib/utils/LetterUtils';

export class OptionDataService {
	/**
	 * Get the next possible options based on the current sequence
	 */
	static getNextOptions(sequence: PictographData[]): PictographData[] {
		// If sequence is empty, return initial options
		if (!sequence || sequence.length === 0) {
			return this.getInitialOptions();
		}

		// Get the last beat in the sequence
		const lastBeat = sequence[sequence.length - 1];

		// Find options that can follow the last beat
		const nextOptions = this.findNextOptions(lastBeat);

		return nextOptions;
	}

	/**
	 * Get initial options when starting a new sequence
	 */
	private static getInitialOptions(): PictographData[] {
		// Return all initial pictograph options
		// This would typically come from a pre-loaded dataset
		// For now, we'll use a placeholder implementation
		return [];
	}

	/**
	 * Find options that can follow a given beat
	 */
	private static findNextOptions(lastBeat: PictographData): PictographData[] {
		// Placeholder for actual option finding logic
		// This would involve checking:
		// 1. Start position matching end position of last beat
		// 2. Orientation continuity
		// 3. Rotation continuity
		// 4. Other sequence-specific rules
		return [];
	}

	/**
	 * Determine the reversal filter type for a potential next option
	 */
	static determineReversalFilter(
		sequence: PictographData[],
		option: PictographData
	): 'continuous' | 'one_reversal' | 'two_reversals' {
		// Check continuity for blue and red prop rotation
		const blueContinuous = this.checkColorContinuity(sequence, option, 'blue');
		const redContinuous = this.checkColorContinuity(sequence, option, 'red');

		if (blueContinuous && redContinuous) {
			return 'continuous';
		} else if (blueContinuous || redContinuous) {
			return 'one_reversal';
		}

		return 'two_reversals';
	}

	/**
	 * Check continuity of rotation for a specific color
	 */
	private static checkColorContinuity(
		sequence: PictographData[],
		option: PictographData,
		color: 'blue' | 'red'
	): boolean {
		const motionDataKey = color === 'blue' ? 'blueMotionData' : 'redMotionData';

		// Find the last non-static rotation in the sequence
		const lastRotation = this.findLastRotation(sequence, color);

		// Current option's proposed rotation
		const currentRotation = option[motionDataKey]?.propRotDir || NO_ROT;

		// Compare rotations
		return (
			lastRotation === NO_ROT || currentRotation === NO_ROT || lastRotation === currentRotation
		);
	}

	/**
	 * Find the last non-static rotation for a specific color
	 */
	private static findLastRotation(sequence: PictographData[], color: 'blue' | 'red'): string {
		const motionDataKey = color === 'blue' ? 'blueMotionData' : 'redMotionData';

		// Iterate through sequence in reverse to find last non-static rotation
		for (let i = sequence.length - 1; i >= 0; i--) {
			const rotation = sequence[i][motionDataKey]?.propRotDir;
			if (rotation && rotation !== NO_ROT) {
				return rotation;
			}
		}

		return NO_ROT;
	}

	/**
	 * Get the number associated with a letter
	 */
	static getLetterNumber(letter: string): number {
		const parsedLetter = LetterUtils.tryFromString(letter);
		const letterType = parsedLetter ? LetterUtils.getLetterType(parsedLetter) : null;

		if (!letterType) return 1;

		switch (letterType.folderName) {
			case 'Type1':
				return 1;
			case 'Type2':
				return 2;
			case 'Type3':
				return 3;
			case 'Type4':
				return 4;
			case 'Type5':
				return 5;
			case 'Type6':
				return 6;
			default:
				return 1;
		}
	}
}
