// src/lib/components/OptionPicker/OptionDataService.ts
import type { PictographData } from '$lib/types/PictographData';
import { LetterType } from '$lib/types/LetterType';
import type { Letter } from '$lib/types/Letter';
import { LetterUtils } from '$lib/utils/LetterUtils';
import pictographDataStore from '$lib/stores/pictograph/pictographStore'; // Global pictograph data
import { get } from 'svelte/store';
import { NO_ROT } from '$lib/types/Constants';
import type { PropRotDir } from '$lib/types/Types';

type Color = 'blue' | 'red';
type ReversalCategory = 'continuous' | 'one_reversal' | 'two_reversals';

export class OptionDataService {
	/**
	 * Gets the next possible pictograph options based on the last pictograph in a sequence.
	 * @param sequence The current sequence of pictographs.
	 * @returns An array of possible next pictographs.
	 */
	static getNextOptions(sequence: PictographData[]): PictographData[] {
		const lastPictograph = sequence.at(-1); // Use .at() for cleaner access to the last element

		// If the sequence is empty, return initial options (currently defined as empty).
		if (!lastPictograph) {
			return this.getInitialOptions();
		}

		// Find options where the start position matches the end position of the last pictograph.
		return this.findOptionsByStartPosition(lastPictograph.endPos ?? undefined);
	}

	/**
	 * Provides the initial set of options when no sequence exists yet.
	 * Placeholder: Currently returns an empty array.
	 */
	private static getInitialOptions(): PictographData[] {
		// Potential future implementation: Fetch all 'Type1' or starting pictographs.
		console.log('Fetching initial options (currently none).');
		return [];
	}

	/**
	 * Finds all pictographs from the global store that start at a specific position.
	 * @param targetStartPos The required start position for the next options.
	 * @returns An array of matching pictographs.
	 */
	private static findOptionsByStartPosition(targetStartPos?: string): PictographData[] {
		if (!targetStartPos) {
			console.warn('Cannot find next options: Last pictograph has no end position.');
			return [];
		}

		const allPictographs = get(pictographDataStore);

		if (!Array.isArray(allPictographs) || allPictographs.length === 0) {
			console.warn('No pictographs available in the global store.');
			return [];
		}

		// Filter for pictographs that have a matching start position.
		return allPictographs.filter(
			(pictograph) => pictograph?.startPos === targetStartPos
		);
	}

	/**
	 * Determines the reversal category of an option relative to the current sequence.
	 * Categories: 'continuous', 'one_reversal', 'two_reversals'.
	 * @param sequence The current sequence of pictographs.
	 * @param option The potential next pictograph option.
	 * @returns The reversal category.
	 */
	static determineReversalFilter(
		sequence: PictographData[],
		option: PictographData
	): ReversalCategory {
		// Check continuity for both blue and red motions.
		const blueContinuous = this.checkColorContinuity(sequence, option, 'blue');
		const redContinuous = this.checkColorContinuity(sequence, option, 'red');

		// Determine category based on continuity checks.
		if (blueContinuous && redContinuous) {
			return 'continuous';
		} else if (blueContinuous || redContinuous) {
			return 'one_reversal';
		} else {
			return 'two_reversals';
		}
	}

	/**
	 * Checks if the rotation direction for a specific color is continuous
	 * between the end of the sequence and the given option.
	 * @param sequence The current sequence.
	 * @param option The potential next option.
	 * @param color The color ('blue' or 'red') to check.
	 * @returns True if the rotation is continuous, false otherwise.
	 */
	private static checkColorContinuity(
		sequence: PictographData[],
		option: PictographData,
		color: Color
	): boolean {
		const motionDataKey = color === 'blue' ? 'blueMotionData' : 'redMotionData';
		const lastRotation = this.findLastRotation(sequence, color);
		// Use optional chaining for safer access
		const currentRotation = option[motionDataKey]?.propRotDir ?? NO_ROT;

		// Rotation is considered continuous if:
		// - The previous rotation was NO_ROT (start of movement for this color).
		// - The current rotation is NO_ROT (end of movement for this color).
		// - Both rotations exist and are the same direction.
		return (
			lastRotation === NO_ROT || currentRotation === NO_ROT || lastRotation === currentRotation
		);
	}

	/**
	 * Finds the last non-'static'/'no_rot' rotation direction for a given color in the sequence.
	 * Iterates backwards through the sequence.
	 * @param sequence The current sequence.
	 * @param color The color ('blue' or 'red') to check.
	 * @returns The last rotation direction found, or NO_ROT if none exists.
	 */
	private static findLastRotation(sequence: PictographData[], color: Color): PropRotDir {
		const motionDataKey = color === 'blue' ? 'blueMotionData' : 'redMotionData';

        // Iterate backwards to find the most recent relevant rotation
		for (let i = sequence.length - 1; i >= 0; i--) {
			const rotation = sequence[i]?.[motionDataKey]?.propRotDir;
			// If a valid rotation direction is found, return it
			if (rotation && rotation !== NO_ROT) {
				return rotation;
			}
		}
		// If no relevant rotation is found in the sequence, return NO_ROT
		return NO_ROT;
	}

	/**
	 * Gets the numerical type (1-6) associated with a letter.
	 * @param letter The letter string (e.g., "A", "B", "α").
	 * @returns The type number (1-6) or 1 as a default fallback.
	 */
	static getLetterTypeNumber(letter?: Letter | string): number {
		if (!letter) return 1; // Default if letter is missing

		const parsedLetter = LetterUtils.tryFromString(letter as Letter);
		if (!parsedLetter) return 1; // Default if parsing fails

		const letterType = LetterType.getLetterType(parsedLetter);
		if (!letterType?.folderName) return 1; // Default if type or folderName is missing

		// Extract number from "TypeX" string
		const typeMatch = letterType.folderName.match(/Type(\d)/);
        return typeMatch ? parseInt(typeMatch[1], 10) : 1; // Return extracted number or default
	}
}
