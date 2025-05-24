// src/lib/components/OptionPicker/services/optionsService.ts
import type { PictographData } from '$lib/types/PictographData';
import type { SortMethod, ReversalFilter } from '../config';
import { pictographData } from '$lib/state/pictograph/pictographDataState.svelte';
import { memoizeLRU } from '$lib/utils/memoizationUtils';
import { NO_ROT } from '$lib/types/Constants';
import type { PropRotDir, Orientation } from '$lib/types/Types';
import type { Letter } from '$lib/types/Letter';
import { LetterType } from '$lib/types/LetterType';
import { LetterUtils } from '$lib/utils/LetterUtils';
import { MotionOriCalculator } from '$lib/components/objects/Motion/MotionOriCalculator';

// ===== Option Data Fetching =====

/**
 * Gets the next possible pictograph options based on the sequence structure.
 *
 * Sequence Structure:
 * - sequence.length === 0: No beats, may have start position (use start position orientations)
 * - sequence.length === 1: One beat + start position (use ending orientations of the beat)
 * - sequence.length > 1: Multiple beats + start position (use ending orientations of last beat)
 */
export function getNextOptions(sequence: PictographData[]): PictographData[] {
	console.log('getNextOptions: Called with sequence:', {
		length: sequence.length,
		sequence: sequence.map((item, index) => ({
			index,
			letter: item.letter,
			startPos: item.startPos,
			endPos: item.endPos,
			isStartPosition: item.isStartPosition,
			blueMotionData: item.blueMotionData
				? {
						motionType: item.blueMotionData.motionType,
						startOri: item.blueMotionData.startOri,
						endOri: item.blueMotionData.endOri
					}
				: null,
			redMotionData: item.redMotionData
				? {
						motionType: item.redMotionData.motionType,
						startOri: item.redMotionData.startOri,
						endOri: item.redMotionData.endOri
					}
				: null
		}))
	});

	// If sequence is empty, return initial options (currently none defined)
	if (sequence.length === 0) {
		return [];
	}

	// For any sequence with beats (length >= 1), use the ending orientations of the last beat
	const lastBeat = sequence[sequence.length - 1];

	console.log('getNextOptions: Last beat identified:', {
		index: sequence.length - 1,
		letter: lastBeat.letter,
		startPos: lastBeat.startPos,
		endPos: lastBeat.endPos,
		isStartPosition: lastBeat.isStartPosition,
		blueMotionData: lastBeat.blueMotionData,
		redMotionData: lastBeat.redMotionData
	});

	// Check if this is actually a start position (has isStartPosition flag)
	// This handles the edge case where a start position is passed as the only element
	if (sequence.length === 1 && lastBeat.isStartPosition === true) {
		console.log('getNextOptions: Treating as start position');
		// This is a start position, not a beat - use start position logic
		const targetPosition = lastBeat.startPos ?? lastBeat.endPos;
		const targetPositionString = targetPosition ? String(targetPosition) : undefined;

		// For start positions, don't constrain by orientation - show all possible moves
		const options = findOptionsWithMatchingPositionAndOrientation(
			targetPositionString,
			undefined, // Don't constrain by orientation for start positions
			undefined // Don't constrain by orientation for start positions
		);

		return options;
	}

	// Normal case: This is a beat (or sequence of beats)
	// CRITICAL FIX: Use the orientations that are already calculated and stored in the motion data
	// optionPickerState.svelte.ts creates synthetic position objects with calculated orientations
	// stored in startOri/endOri, so we should use those directly instead of recalculating
	const blueEndOri = lastBeat.blueMotionData?.startOri || lastBeat.blueMotionData?.endOri;
	const redEndOri = lastBeat.redMotionData?.startOri || lastBeat.redMotionData?.endOri;

	console.log('OptionsService: Processing last beat:', {
		letter: lastBeat.letter,
		startPos: lastBeat.startPos,
		endPos: lastBeat.endPos,
		blueMotionData: lastBeat.blueMotionData,
		redMotionData: lastBeat.redMotionData,
		extractedBlueEndOri: blueEndOri,
		extractedRedEndOri: redEndOri
	});

	// Find options where start position matches end position of last beat
	// AND start orientations match calculated end orientations of the last beat
	const options = findOptionsWithMatchingPositionAndOrientation(
		lastBeat.endPos ?? undefined,
		blueEndOri,
		redEndOri
	);

	console.log('OptionsService: Found', options.length, 'options for orientations:', {
		blue: blueEndOri,
		red: redEndOri
	});

	return options;
}

/**
 * Finds all pictographs from the modern pictograph data service that match a specific position and orientations.
 * If orientations don't match, it adjusts the pictographs to have the correct orientations.
 */
export function findOptionsWithMatchingPositionAndOrientation(
	targetStartPos?: string,
	blueEndOri?: Orientation,
	redEndOri?: Orientation
): PictographData[] {
	if (!targetStartPos) {
		console.warn('Cannot find next options: Last pictograph has no end position.');
		return [];
	}

	// Check if pictograph data is available and initialized
	if (!pictographData.isInitialized || pictographData.isEmpty) {
		console.warn('Pictograph data not available or not initialized yet.');
		return [];
	}

	const allPictographs = pictographData.data;

	if (!Array.isArray(allPictographs) || !allPictographs.length) {
		console.warn('No pictographs available in the pictograph data service.');
		return [];
	}

	// First filter by position
	const positionMatches = allPictographs.filter(
		(pictograph) => pictograph?.startPos === targetStartPos
	);

	// If no orientation constraints, return all position matches
	if (!blueEndOri && !redEndOri) {
		return positionMatches;
	}

	// Create a result array to hold both matching and adjusted pictographs
	const result: PictographData[] = [];

	// Process each position match
	positionMatches.forEach((pictograph) => {
		// Check if orientations match
		const blueMatches =
			!blueEndOri ||
			!pictograph.blueMotionData ||
			pictograph.blueMotionData.startOri === blueEndOri;

		const redMatches =
			!redEndOri || !pictograph.redMotionData || pictograph.redMotionData.startOri === redEndOri;

		if (blueMatches && redMatches) {
			// If both orientations match, add the original pictograph
			result.push(pictograph);
		} else {
			// Create a safe copy of the pictograph to modify (avoiding circular references)
			// Instead of using JSON.stringify/parse which can't handle circular references,
			// we'll create a new object with only the properties we need
			const adjustedPictograph: PictographData = {
				letter: pictograph.letter,
				startPos: pictograph.startPos,
				endPos: pictograph.endPos,
				timing: pictograph.timing,
				direction: pictograph.direction,
				gridMode: pictograph.gridMode,
				gridData: pictograph.gridData,
				// Create new motion data objects instead of deep copying
				blueMotionData: pictograph.blueMotionData ? { ...pictograph.blueMotionData } : null,
				redMotionData: pictograph.redMotionData ? { ...pictograph.redMotionData } : null,
				redPropData: pictograph.redPropData,
				bluePropData: pictograph.bluePropData,
				redArrowData: pictograph.redArrowData,
				blueArrowData: pictograph.blueArrowData,
				grid: pictograph.grid
			};

			// Adjust blue motion data if needed
			if (!blueMatches && adjustedPictograph.blueMotionData && blueEndOri) {
				// Set the start orientation to match the required orientation
				adjustedPictograph.blueMotionData.startOri = blueEndOri;

				// Recalculate the end orientation
				try {
					const calculator = new MotionOriCalculator(adjustedPictograph.blueMotionData);
					const newEndOri = calculator.calculateEndOri();
					adjustedPictograph.blueMotionData.endOri = newEndOri;
				} catch (error) {
					console.warn('Error recalculating blue end orientation:', error);
				}
			}

			// Adjust red motion data if needed
			if (!redMatches && adjustedPictograph.redMotionData && redEndOri) {
				// Set the start orientation to match the required orientation
				adjustedPictograph.redMotionData.startOri = redEndOri;

				// Recalculate the end orientation
				try {
					const calculator = new MotionOriCalculator(adjustedPictograph.redMotionData);
					const newEndOri = calculator.calculateEndOri();
					adjustedPictograph.redMotionData.endOri = newEndOri;
				} catch (error) {
					console.warn('Error recalculating red end orientation:', error);
				}
			}

			// Add the adjusted pictograph to the result
			result.push(adjustedPictograph);
		}
	});

	return result;
}

/**
 * Legacy function kept for backward compatibility.
 * Now calls the enhanced function that also checks orientations.
 */
export function findOptionsByStartPosition(targetStartPos?: string): PictographData[] {
	return findOptionsWithMatchingPositionAndOrientation(targetStartPos);
}

// ===== Reversal Category Functions =====

/**
 * Determines the reversal category of an option relative to the current sequence.
 * Memoized for performance.
 */
export const determineReversalCategory = memoizeLRU(
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

/**
 * Finds the last non-static rotation direction for a given color in the sequence.
 * Memoized for performance.
 */
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
		const relevantItems = sequence.slice(-5); // Keep optimization
		return `${color}:${relevantItems
			.map((item) => `${item.letter || ''}${item.startPos || ''}${item.endPos || ''}`)
			.join(',')}`;
	}
);

/**
 * Checks if rotation direction for a specific color is continuous between the sequence and the option.
 */
function checkColorContinuity(
	sequence: PictographData[],
	option: PictographData,
	color: 'blue' | 'red'
): boolean {
	const motionDataKey = color === 'blue' ? 'blueMotionData' : 'redMotionData';
	const lastRotation = findLastRotation(sequence, color);
	const currentRotation = option[motionDataKey]?.propRotDir ?? NO_ROT;

	// Continuous if either is non-rotating, or if both rotate in the same direction
	return lastRotation === NO_ROT || currentRotation === NO_ROT || lastRotation === currentRotation;
}

// ===== Group & Sort Functions =====

/**
 * Determines the appropriate group key for an option based on the sorting method.
 */
export function determineGroupKey(
	option: PictographData,
	sortMethod: SortMethod,
	sequence: PictographData[] = [] // Sequence needed for 'reversals' grouping
): string {
	switch (sortMethod) {
		case 'type': {
			const parsedLetter = LetterUtils.tryFromString((option.letter as Letter) ?? undefined);
			const letterType = parsedLetter ? LetterType.getLetterType(parsedLetter) : null;
			return letterType?.folderName ?? 'Unknown Type';
		}
		case 'endPosition': {
			const endPos = option.endPos ?? 'Unknown';
			// Extract the alphabetical part (e.g., 'alpha', 'beta', 'gamma')
			const match = endPos.match(/^([a-zA-Z]+)/);
			return match ? match[1] : endPos;
		}
		case 'reversals': {
			// Use the memoized function defined above
			const reversalCategory = determineReversalCategory(sequence, option);
			const categoryLabels: Record<Exclude<ReversalFilter, 'all'>, string> = {
				continuous: 'Continuous',
				oneReversal: 'One Reversal',
				twoReversals: 'Two Reversals'
			};
			return categoryLabels[reversalCategory];
		}
		default:
			console.warn(`Unknown sort method for grouping: ${sortMethod}`);
			return 'Unknown Group';
	}
}

/**
 * Sorts an array of group keys based on the sorting method.
 */
export function getSortedGroupKeys(keys: string[], sortMethod: SortMethod): string[] {
	return keys.sort((a, b) => {
		if (sortMethod === 'type') {
			// Extract Type number (e.g., from "Type1") for primary sort
			const typeNumA = parseInt(a.match(/Type(\d)/)?.[1] ?? '99');
			const typeNumB = parseInt(b.match(/Type(\d)/)?.[1] ?? '99');
			if (typeNumA !== typeNumB) return typeNumA - typeNumB;
			// Fallback to alphabetical sort if types are the same or not found
			return a.localeCompare(b);
		}

		if (sortMethod === 'reversals') {
			const reversalOrder: Record<string, number> = {
				Continuous: 0,
				'One Reversal': 1,
				'Two Reversals': 2
			};
			// Sort based on predefined order, putting unknowns last
			return (reversalOrder[a] ?? 99) - (reversalOrder[b] ?? 99);
		}

		// Default alphabetical sort for endPosition or unknown methods
		return a.localeCompare(b);
	});
}

/**
 * Returns a comparison function for sorting PictographData arrays based on the specified method.
 */
export function getSorter(method: SortMethod, sequence: PictographData[] = []) {
	const sorters = {
		type: (a: PictographData, b: PictographData) => {
			const typeA = getLetterTypeNumber(a.letter ?? undefined);
			const typeB = getLetterTypeNumber(b.letter ?? undefined);
			if (typeA !== typeB) return typeA - typeB;
			// Secondary sort by letter within the same type
			return (a.letter ?? '').localeCompare(b.letter ?? '');
		},

		endPosition: (a: PictographData, b: PictographData) =>
			(a.endPos ?? '').localeCompare(b.endPos ?? ''),

		reversals: (a: PictographData, b: PictographData) => {
			// Use the memoized function
			const reversalA = determineReversalCategory(sequence, a);
			const reversalB = determineReversalCategory(sequence, b);

			const reversalOrder: Record<Exclude<ReversalFilter, 'all'>, number> = {
				continuous: 0,
				oneReversal: 1,
				twoReversals: 2
			};

			// Sort based on the numerical order of reversal categories
			return reversalOrder[reversalA] - reversalOrder[reversalB];
		},

		// Default sort (alphabetical by letter if method is unrecognized)
		default: (a: PictographData, b: PictographData) =>
			(a.letter ?? '').localeCompare(b.letter ?? '')
	};

	return sorters[method] || sorters.default;
}

/**
 * Gets the numerical type (e.g., 1-6) associated with a letter string.
 * Returns a high number (e.g., 99) for unknowns to sort them last within 'type' sort.
 */
export function getLetterTypeNumber(letter?: Letter | string): number {
	if (!letter) return 99; // Unknowns last

	const parsedLetter = LetterUtils.tryFromString(letter as Letter);
	if (!parsedLetter) return 99;

	const letterType = LetterType.getLetterType(parsedLetter);
	if (!letterType?.folderName) return 99;

	const typeMatch = letterType.folderName.match(/Type(\d)/);
	return typeMatch ? parseInt(typeMatch[1], 10) : 99; // Extract number or default to last
}
