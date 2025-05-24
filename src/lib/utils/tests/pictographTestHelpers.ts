/**
 * Pictograph Test Helpers
 *
 * Helper functions for working with real pictograph data in tests.
 * Provides utilities for creating test objects, sequences, and common test scenarios.
 */

import type { PictographData } from '$lib/types/PictographData';
import type { Letter } from '$lib/types/Letter';
import type { Beat } from '$lib/types/Beat';
import type { BeatData } from '$lib/state/stores/sequence/SequenceContainer';
import type { TKAPosition } from '$lib/types/TKAPosition';
import type { VTGTiming, VTGDir } from '$lib/types/Types';
import { getPictographTestDataLoader } from './pictographTestDataLoader';

/**
 * Sample CSV content for testing (subset of real data)
 * This is used when the full CSV file is not available in test environments
 */
export const SAMPLE_DIAMOND_CSV = `letter,startPos,endPos,timing,direction,blueMotionType,bluePropRotDir,blueStartLoc,blueEndLoc,redMotionType,redPropRotDir,redStartLoc,redEndLoc
A,alpha3,alpha5,split,same,pro,cw,w,n,pro,cw,e,s
A,alpha5,alpha7,split,same,pro,cw,n,e,pro,cw,s,w
B,alpha3,alpha5,split,same,anti,ccw,w,n,anti,ccw,e,s
B,alpha5,alpha7,split,same,anti,ccw,n,e,anti,ccw,s,w
C,alpha3,alpha5,split,same,anti,ccw,w,n,pro,cw,e,s
C,alpha5,alpha7,split,same,anti,ccw,n,e,pro,cw,s,w
D,beta3,alpha5,split,opp,pro,ccw,e,n,pro,cw,e,s
E,beta3,alpha5,split,opp,anti,cw,e,n,anti,ccw,e,s
F,beta3,alpha5,split,opp,anti,cw,e,n,pro,cw,e,s
G,beta3,beta5,tog,same,pro,cw,e,s,pro,cw,e,s
H,beta3,beta5,tog,same,anti,ccw,e,s,anti,ccw,e,s
I,beta3,beta5,tog,same,anti,ccw,e,s,pro,cw,e,s
W-,gamma11,alpha5,none,none,dash,no_rot,s,n,pro,cw,e,s
X-,gamma11,alpha5,none,none,dash,no_rot,s,n,anti,ccw,e,s`;

/**
 * Initialize test data loader with sample data
 */
export async function initializeTestDataLoader(csvContent?: string): Promise<void> {
	const loader = getPictographTestDataLoader();

	if (loader.isDataLoaded()) {
		return; // Already loaded
	}

	const content = csvContent || SAMPLE_DIAMOND_CSV;
	await loader.loadFromCsvContent(content);
}

/**
 * Create a Beat object from PictographData for testing
 */
export function createBeatFromPictographData(
	pictographData: PictographData,
	beatNumber: number = 1,
	id?: string
): Beat {
	return {
		id: id || `test-beat-${beatNumber}`,
		beatNumber,
		filled: true,
		pictographData: {
			...pictographData,
			// Ensure all required fields are present
			gridData: pictographData.gridData || null,
			redArrowData: pictographData.redArrowData || null,
			blueArrowData: pictographData.blueArrowData || null,
			motions: pictographData.motions || [],
			redMotion: pictographData.redMotion || null,
			blueMotion: pictographData.blueMotion || null,
			props: pictographData.props || [],
			redPropData: pictographData.redPropData || null,
			bluePropData: pictographData.bluePropData || null,
			grid: pictographData.grid || '',
			isStartPosition: pictographData.isStartPosition || false
		},
		metadata: {
			letter: pictographData.letter?.toString() || '',
			startPos: pictographData.startPos || '',
			endPos: pictographData.endPos || '',
			tags: [`test-beat-${beatNumber}`]
		}
	};
}

/**
 * Create a BeatData object from PictographData for testing
 */
export function createBeatDataFromPictographData(
	pictographData: PictographData,
	beatNumber: number = 1,
	id?: string
): BeatData {
	return {
		id: id || `test-beatdata-${beatNumber}`,
		number: beatNumber,
		letter: pictographData.letter?.toString() || '',
		position: pictographData.startPos || 'alpha1',
		orientation: '',
		turnsTuple: '',
		redPropData: pictographData.redPropData,
		bluePropData: pictographData.bluePropData,
		redArrowData: pictographData.redArrowData,
		blueArrowData: pictographData.blueArrowData,
		redMotionData: pictographData.redMotionData,
		blueMotionData: pictographData.blueMotionData,
		metadata: {
			letter: pictographData.letter?.toString() || '',
			startPos: pictographData.startPos || '',
			endPos: pictographData.endPos || '',
			gridMode: pictographData.gridMode,
			timing: pictographData.timing,
			direction: pictographData.direction
		}
	};
}

/**
 * Get a test pictograph by letter with fallback to sample data
 */
export async function getTestPictographByLetter(letter: Letter): Promise<PictographData | null> {
	await initializeTestDataLoader();
	const loader = getPictographTestDataLoader();
	return loader.getFirstByLetter(letter);
}

/**
 * Get multiple test pictographs by letters
 */
export async function getTestPictographsByLetters(letters: Letter[]): Promise<PictographData[]> {
	await initializeTestDataLoader();
	const loader = getPictographTestDataLoader();

	const results: PictographData[] = [];
	for (const letter of letters) {
		const pictograph = loader.getFirstByLetter(letter);
		if (pictograph) {
			results.push(pictograph);
		}
	}

	return results;
}

/**
 * Test sequence structure that separates start position from beats
 */
export interface TestSequence {
	startPosition: Beat | null;
	beats: Beat[];
	/** Total length of actual beats (excludes start position) */
	length: number;
}

/**
 * Create a test sequence of beats from real pictograph data
 * Returns an object that clearly separates start position from sequence beats
 */
export async function createTestSequence(
	letters: Letter[],
	includeStartPosition: boolean = false
): Promise<TestSequence> {
	const pictographs = await getTestPictographsByLetters(letters);
	const beats: Beat[] = [];
	let startPosition: Beat | null = null;

	if (includeStartPosition && pictographs.length > 0) {
		// Create start position beat (separate from sequence)
		startPosition = createBeatFromPictographData(
			{
				...pictographs[0],
				letter: null,
				isStartPosition: true
			},
			0,
			'start-position'
		);
	}

	// Create actual sequence beats (numbered 1, 2, 3, etc.)
	pictographs.forEach((pictograph, index) => {
		const beat = createBeatFromPictographData(
			pictograph,
			index + 1, // Always start from 1 for actual beats
			`beat-${pictograph.letter}`
		);
		beats.push(beat);
	});

	return {
		startPosition,
		beats,
		length: beats.length // Clear: this is the actual sequence length
	};
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use createTestSequence() which returns TestSequence object
 */
export async function createTestSequenceArray(
	letters: Letter[],
	includeStartPosition: boolean = false
): Promise<Beat[]> {
	const sequence = await createTestSequence(letters, includeStartPosition);
	const result: Beat[] = [];

	if (sequence.startPosition) {
		result.push(sequence.startPosition);
	}
	result.push(...sequence.beats);

	return result;
}

/**
 * Test BeatData sequence structure that separates start position from beats
 */
export interface TestBeatDataSequence {
	startPosition: BeatData | null;
	beatData: BeatData[];
	/** Total length of actual beats (excludes start position) */
	length: number;
}

/**
 * Create a test sequence of BeatData from real pictograph data
 * Returns an object that clearly separates start position from sequence beats
 */
export async function createTestBeatDataSequence(
	letters: Letter[],
	includeStartPosition: boolean = false
): Promise<TestBeatDataSequence> {
	const pictographs = await getTestPictographsByLetters(letters);
	const beatData: BeatData[] = [];
	let startPosition: BeatData | null = null;

	if (includeStartPosition && pictographs.length > 0) {
		// Create start position beat data (separate from sequence)
		startPosition = createBeatDataFromPictographData(
			{
				...pictographs[0],
				letter: null
			},
			0,
			'start-position-data'
		);
	}

	// Create actual sequence beat data (numbered 1, 2, 3, etc.)
	pictographs.forEach((pictograph, index) => {
		const data = createBeatDataFromPictographData(
			pictograph,
			index + 1, // Always start from 1 for actual beats
			`beatdata-${pictograph.letter}`
		);
		beatData.push(data);
	});

	return {
		startPosition,
		beatData,
		length: beatData.length // Clear: this is the actual sequence length
	};
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use createTestBeatDataSequence() which returns TestBeatDataSequence object
 */
export async function createTestBeatDataSequenceArray(
	letters: Letter[],
	includeStartPosition: boolean = false
): Promise<BeatData[]> {
	const sequence = await createTestBeatDataSequence(letters, includeStartPosition);
	const result: BeatData[] = [];

	if (sequence.startPosition) {
		result.push(sequence.startPosition);
	}
	result.push(...sequence.beatData);

	return result;
}

/**
 * Get random test pictographs for comprehensive testing
 */
export async function getRandomTestPictographs(count: number = 5): Promise<PictographData[]> {
	await initializeTestDataLoader();
	const loader = getPictographTestDataLoader();
	return loader.getRandomPictographs(count);
}

/**
 * Get test pictographs by specific criteria
 */
export async function getTestPictographsByCriteria(criteria: {
	letter?: Letter;
	startPos?: TKAPosition;
	endPos?: TKAPosition;
	timing?: VTGTiming;
	direction?: VTGDir;
	redMotionType?: string;
	blueMotionType?: string;
}): Promise<PictographData[]> {
	await initializeTestDataLoader();
	const loader = getPictographTestDataLoader();
	return loader.getByMultipleCriteria(criteria);
}

/**
 * Create a Type 3 (dash) pictograph for testing
 */
export async function getType3TestPictograph(): Promise<PictographData | null> {
	await initializeTestDataLoader();
	const loader = getPictographTestDataLoader();

	// Look for dash motion types (Type 3 letters like W-, X-, etc.)
	const dashPictographs = loader.getByMotionType('dash');
	return dashPictographs.length > 0 ? dashPictographs[0] : null;
}

/**
 * Create a pro motion pictograph for testing
 */
export async function getProMotionTestPictograph(): Promise<PictographData | null> {
	await initializeTestDataLoader();
	const loader = getPictographTestDataLoader();

	const proPictographs = loader.getByMotionType('pro');
	return proPictographs.length > 0 ? proPictographs[0] : null;
}

/**
 * Create an anti motion pictograph for testing
 */
export async function getAntiMotionTestPictograph(): Promise<PictographData | null> {
	await initializeTestDataLoader();
	const loader = getPictographTestDataLoader();

	const antiPictographs = loader.getByMotionType('anti');
	return antiPictographs.length > 0 ? antiPictographs[0] : null;
}

/**
 * Reset test data (useful for test cleanup)
 */
export function resetTestData(): void {
	const loader = getPictographTestDataLoader();
	loader.reset();
}

/**
 * Validate that a pictograph has all required fields for testing
 */
export function validateTestPictograph(pictograph: PictographData): boolean {
	return !!(
		pictograph.letter &&
		pictograph.startPos &&
		pictograph.endPos &&
		pictograph.gridMode &&
		pictograph.redMotionData &&
		pictograph.blueMotionData
	);
}

/**
 * Get test data statistics
 */
export async function getTestDataStats(): Promise<{
	totalCount: number;
	letterCounts: Record<string, number>;
	motionTypeCounts: Record<string, number>;
	positionCounts: Record<string, number>;
}> {
	await initializeTestDataLoader();
	const loader = getPictographTestDataLoader();
	const allPictographs = loader.getAllPictographs();

	const letterCounts: Record<string, number> = {};
	const motionTypeCounts: Record<string, number> = {};
	const positionCounts: Record<string, number> = {};

	allPictographs.forEach((p) => {
		// Count letters
		if (p.letter) {
			letterCounts[p.letter.toString()] = (letterCounts[p.letter.toString()] || 0) + 1;
		}

		// Count motion types
		if (p.redMotionData?.motionType) {
			motionTypeCounts[p.redMotionData.motionType] =
				(motionTypeCounts[p.redMotionData.motionType] || 0) + 1;
		}
		if (p.blueMotionData?.motionType) {
			motionTypeCounts[p.blueMotionData.motionType] =
				(motionTypeCounts[p.blueMotionData.motionType] || 0) + 1;
		}

		// Count positions
		if (p.startPos) {
			positionCounts[p.startPos] = (positionCounts[p.startPos] || 0) + 1;
		}
	});

	return {
		totalCount: allPictographs.length,
		letterCounts,
		motionTypeCounts,
		positionCounts
	};
}
