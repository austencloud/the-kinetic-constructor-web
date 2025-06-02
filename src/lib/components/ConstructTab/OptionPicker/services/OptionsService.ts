// src/lib/components/OptionPicker/services/optionsService.ts
import { get } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import type { SortMethod, ReversalFilter } from '../config';
import pictographDataStore from '$lib/stores/pictograph/pictographStore';
import { pictographDataLoader } from '$lib/utils/testing/PictographDataLoader';
import { memoizeLRU } from '$lib/utils/memoizationUtils';
import { NO_ROT } from '$lib/types/Constants';
import type { PropRotDir, Orientation } from '$lib/types/Types';
import type { Letter } from '$lib/types/Letter';
import { LetterType } from '$lib/types/LetterType';
import { LetterUtils } from '$lib/utils/LetterUtils';
import { MotionOriCalculator } from '$lib/components/objects/Motion/MotionOriCalculator';

// ===== Option Data Fetching =====

/**
 * Gets the next possible pictograph options based on the last pictograph in a sequence.
 * Returns an empty array for an empty sequence (initial state).
 * Enhanced with TransitionValidator for authentic data-driven filtering.
 */
export async function getNextOptions(sequence: PictographData[]): Promise<PictographData[]> {
	console.log('🔧 DEBUG: getNextOptions called with sequence:', {
		sequenceLength: sequence.length,
		sequence: sequence.map((s) => ({ letter: s.letter, startPos: s.startPos, endPos: s.endPos }))
	});

	const lastPictograph = sequence.at(-1);

	// If sequence is empty, return initial options (currently none defined)
	if (!lastPictograph) {
		console.log('🔧 DEBUG: Empty sequence, returning empty options');
		return [];
	}

	console.log('🔧 DEBUG: Last pictograph:', {
		letter: lastPictograph.letter,
		startPos: lastPictograph.startPos,
		endPos: lastPictograph.endPos
	});

	// Calculate the actual end orientations using MotionOriCalculator
	const blueEndOri = calculateActualEndOrientation(lastPictograph.blueMotionData);
	const redEndOri = calculateActualEndOrientation(lastPictograph.redMotionData);

	// Find options where start position matches end position of last pictograph
	// AND start orientations match calculated end orientations of the last pictograph
	const options = await findOptionsWithMatchingPositionAndOrientation(
		lastPictograph.endPos ?? undefined,
		blueEndOri,
		redEndOri
	);

	return options;
}

/**
 * Calculate the actual end orientation of a motion using the MotionOriCalculator
 */
function calculateActualEndOrientation(motionData: any): Orientation | undefined {
	if (!motionData) return undefined;

	// Create temporary calculator to get the correct end orientation
	try {
		const calculator = new MotionOriCalculator(motionData);
		const calculatedEndOri = calculator.calculateEndOri();

		return calculatedEndOri;
	} catch (error) {
		console.warn('Error calculating end orientation:', error);
		// Fall back to the stored end orientation
		return motionData.endOri;
	}
}

/**
 * Finds all pictographs from the global store that match a specific position and orientations.
 * If orientations don't match, it adjusts the pictographs to have the correct orientations.
 */
export async function findOptionsWithMatchingPositionAndOrientation(
	targetStartPos?: string,
	blueEndOri?: Orientation,
	redEndOri?: Orientation
): Promise<PictographData[]> {
	console.log('🔧 DEBUG: findOptionsWithMatchingPositionAndOrientation called with:', {
		targetStartPos,
		blueEndOri,
		redEndOri
	});

	if (!targetStartPos) {
		console.warn('🔧 DEBUG: Cannot find next options: Last pictograph has no end position.');
		return [];
	}

	// Try to get data from the legacy store first
	let allPictographs = get(pictographDataStore);
	console.log('🔧 DEBUG: pictographDataStore contains:', {
		isArray: Array.isArray(allPictographs),
		length: allPictographs?.length || 0
	});

	// If the legacy store is empty, try to get data from PictographDataLoader
	if (!Array.isArray(allPictographs) || !allPictographs.length) {
		console.log('🔧 DEBUG: Legacy store empty, trying PictographDataLoader...');
		try {
			// Get all available pictographs from the loader
			const loaderData = await pictographDataLoader.getAllPictographData();
			allPictographs = loaderData;
			console.log('🔧 DEBUG: PictographDataLoader provided:', {
				isArray: Array.isArray(allPictographs),
				length: allPictographs?.length || 0,
				firstFew: Array.isArray(allPictographs)
					? allPictographs.slice(0, 3).map((p) => ({
							letter: p?.letter,
							startPos: p?.startPos,
							endPos: p?.endPos
						}))
					: 'Not an array'
			});
		} catch (error) {
			console.error('🔧 DEBUG: Failed to load data from PictographDataLoader:', error);
			return [];
		}
	}

	if (!Array.isArray(allPictographs) || !allPictographs.length) {
		console.warn('🔧 DEBUG: No pictographs available from any source.');
		return [];
	}

	// First filter by position
	const positionMatches = allPictographs.filter(
		(pictograph) => pictograph?.startPos === targetStartPos
	);
	console.log('🔧 DEBUG: Position matches found:', {
		targetStartPos,
		matchCount: positionMatches.length,
		matches: positionMatches.slice(0, 5).map((p) => ({
			letter: p.letter,
			startPos: p.startPos,
			endPos: p.endPos
		}))
	});

	// If no orientation constraints, return all position matches
	if (!blueEndOri && !redEndOri) {
		console.log('🔧 DEBUG: No orientation constraints, returning all position matches');
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
export async function findOptionsByStartPosition(
	targetStartPos?: string
): Promise<PictographData[]> {
	return await findOptionsWithMatchingPositionAndOrientation(targetStartPos);
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
	sequence: PictographData[] = []
): string {
	if (!sortMethod) {
		return 'All Options';
	}

	// Handle invalid sort methods (like 'all' which is a tab key, not a sort method)
	const validSortMethods: SortMethod[] = ['type', 'endPosition', 'reversals'];
	if (!validSortMethods.includes(sortMethod)) {
		// Silently handle invalid methods by returning a default group key
		return 'All Options';
	}

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
			return 'All Options';
	}
}

/**
 * Sorts an array of group keys based on the sorting method.
 */
export function getSortedGroupKeys(keys: string[], sortMethod: SortMethod): string[] {
	// Handle invalid sort methods
	const validSortMethods: SortMethod[] = ['type', 'endPosition', 'reversals'];
	if (!validSortMethods.includes(sortMethod)) {
		// Silently handle invalid methods with default alphabetical sorting
		return keys.sort((a, b) => a.localeCompare(b));
	}

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
	// Handle invalid sort methods
	const validSortMethods: SortMethod[] = ['type', 'endPosition', 'reversals'];
	if (!validSortMethods.includes(method)) {
		// Silently handle invalid methods with default alphabetical sorting
		return (a: PictographData, b: PictographData) => (a.letter ?? '').localeCompare(b.letter ?? '');
	}

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
