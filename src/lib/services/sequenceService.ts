// src/lib/services/sequenceService.ts
import { browser } from '$app/environment';
import type { SequenceData, SequenceVariation } from '$lib/stores/browseTab/browseTabStore';

// Mock data for development
const MOCK_SEQUENCES: SequenceData[] = [
	{
		id: '1',
		word: 'Alpha',
		variations: [
			{
				id: '1-1',
				thumbnailPath: '/images/sequences/alpha-1.png',
				metadata: {
					level: 1,
					author: 'John Doe',
					dateAdded: '2023-01-15',
					gridMode: 'diamond',
					startingPosition: 'home',
					isFavorite: true,
					length: 4,
					tags: ['beginner', 'tutorial']
				}
			},
			{
				id: '1-2',
				thumbnailPath: '/images/sequences/alpha-2.png',
				metadata: {
					level: 1,
					author: 'John Doe',
					dateAdded: '2023-01-16',
					gridMode: 'diamond',
					startingPosition: 'home',
					isFavorite: false,
					length: 4,
					tags: ['beginner', 'tutorial']
				}
			}
		],
		metadata: {
			level: 1,
			author: 'John Doe',
			dateAdded: '2023-01-15',
			gridMode: 'diamond',
			startingPosition: 'home',
			length: 4,
			tags: ['beginner', 'tutorial']
		}
	},
	{
		id: '2',
		word: 'Beta',
		variations: [
			{
				id: '2-1',
				thumbnailPath: '/images/sequences/beta-1.png',
				metadata: {
					level: 2,
					author: 'Jane Smith',
					dateAdded: '2023-02-10',
					gridMode: 'box',
					startingPosition: 'extended',
					isFavorite: false,
					length: 6,
					tags: ['intermediate']
				}
			}
		],
		metadata: {
			level: 2,
			author: 'Jane Smith',
			dateAdded: '2023-02-10',
			gridMode: 'box',
			startingPosition: 'extended',
			length: 6,
			tags: ['intermediate']
		}
	},
	{
		id: '3',
		word: 'Gamma',
		variations: [
			{
				id: '3-1',
				thumbnailPath: '/images/sequences/gamma-1.png',
				metadata: {
					level: 3,
					author: 'Alex Johnson',
					dateAdded: '2023-03-05',
					gridMode: 'diamond',
					startingPosition: 'split',
					isFavorite: true,
					length: 8,
					tags: ['advanced', 'complex']
				}
			},
			{
				id: '3-2',
				thumbnailPath: '/images/sequences/gamma-2.png',
				metadata: {
					level: 3,
					author: 'Alex Johnson',
					dateAdded: '2023-03-06',
					gridMode: 'diamond',
					startingPosition: 'split',
					isFavorite: false,
					length: 8,
					tags: ['advanced', 'complex']
				}
			},
			{
				id: '3-3',
				thumbnailPath: '/images/sequences/gamma-3.png',
				metadata: {
					level: 3,
					author: 'Alex Johnson',
					dateAdded: '2023-03-07',
					gridMode: 'diamond',
					startingPosition: 'split',
					isFavorite: false,
					length: 8,
					tags: ['advanced', 'complex']
				}
			}
		],
		metadata: {
			level: 3,
			author: 'Alex Johnson',
			dateAdded: '2023-03-05',
			gridMode: 'diamond',
			startingPosition: 'split',
			length: 8,
			tags: ['advanced', 'complex']
		}
	},
	{
		id: '4',
		word: 'Delta',
		variations: [
			{
				id: '4-1',
				thumbnailPath: '/images/sequences/delta-1.png',
				metadata: {
					level: 4,
					author: 'Sarah Williams',
					dateAdded: '2023-04-20',
					gridMode: 'box',
					startingPosition: 'home',
					isFavorite: false,
					length: 10,
					tags: ['expert', 'performance']
				}
			}
		],
		metadata: {
			level: 4,
			author: 'Sarah Williams',
			dateAdded: '2023-04-20',
			gridMode: 'box',
			startingPosition: 'home',
			length: 10,
			tags: ['expert', 'performance']
		}
	},
	{
		id: '5',
		word: 'Epsilon',
		variations: [
			{
				id: '5-1',
				thumbnailPath: '/images/sequences/epsilon-1.png',
				metadata: {
					level: 5,
					author: 'Michael Brown',
					dateAdded: '2023-05-15',
					gridMode: 'diamond',
					startingPosition: 'extended',
					isFavorite: true,
					length: 12,
					tags: ['master', 'showcase']
				}
			},
			{
				id: '5-2',
				thumbnailPath: '/images/sequences/epsilon-2.png',
				metadata: {
					level: 5,
					author: 'Michael Brown',
					dateAdded: '2023-05-16',
					gridMode: 'diamond',
					startingPosition: 'extended',
					isFavorite: false,
					length: 12,
					tags: ['master', 'showcase']
				}
			}
		],
		metadata: {
			level: 5,
			author: 'Michael Brown',
			dateAdded: '2023-05-15',
			gridMode: 'diamond',
			startingPosition: 'extended',
			length: 12,
			tags: ['master', 'showcase']
		}
	}
];

/**
 * Fetch all sequences from the API
 * @returns Promise resolving to an array of sequence data
 */
export async function fetchSequences(): Promise<SequenceData[]> {
	if (!browser) return [];

	// In a real implementation, this would fetch from an API endpoint
	// For now, we'll use mock data with a simulated delay
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(MOCK_SEQUENCES);
		}, 500);
	});
}

/**
 * Update the favorite status of a sequence variation
 * @param sequenceId The ID of the sequence
 * @param variationId The ID of the variation
 * @param isFavorite Whether the variation should be marked as favorite
 * @returns Promise resolving when the update is complete
 */
export async function updateFavoriteStatus(
	sequenceId: string,
	variationId: string,
	isFavorite: boolean
): Promise<void> {
	if (!browser) return;

	// In a real implementation, this would call an API endpoint
	// For now, we'll simulate a delay
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			// Simulate success (90% of the time)
			if (Math.random() > 0.1) {
				resolve();
			} else {
				// Simulate occasional failure
				reject(new Error('Failed to update favorite status'));
			}
		}, 300);
	});
}

/**
 * Delete a sequence variation
 * @param sequenceId The ID of the sequence
 * @param variationId The ID of the variation to delete
 * @returns Promise resolving when the deletion is complete
 */
export async function deleteVariationApi(sequenceId: string, variationId: string): Promise<void> {
	if (!browser) return;

	// In a real implementation, this would call an API endpoint
	// For now, we'll simulate a delay
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			// Simulate success (90% of the time)
			if (Math.random() > 0.1) {
				resolve();
			} else {
				// Simulate occasional failure
				reject(new Error('Failed to delete variation'));
			}
		}, 500);
	});
}

/**
 * Delete an entire sequence
 * @param sequenceId The ID of the sequence to delete
 * @returns Promise resolving when the deletion is complete
 */
export async function deleteSequenceApi(sequenceId: string): Promise<void> {
	if (!browser) return;

	// In a real implementation, this would call an API endpoint
	// For now, we'll simulate a delay
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			// Simulate success (90% of the time)
			if (Math.random() > 0.1) {
				resolve();
			} else {
				// Simulate occasional failure
				reject(new Error('Failed to delete sequence'));
			}
		}, 700);
	});
}

// Import the PictographData type and constants
import type { PictographData } from '$lib/types/PictographData';
import type { Letter } from '$lib/types/Letter';
import { DIAMOND } from '$lib/types/Constants';

// Dictionary mapping letters to their pictograph representations with proper data structure
const LETTER_PICTOGRAPHS: Record<string, PictographData> = {
	A: {
		id: 'a_pictograph',
		letter: 'A' as Letter,
		startPos: 'alpha1',
		endPos: 'alpha1',
		timing: null,
		direction: null,
		gridMode: DIAMOND,
		grid: DIAMOND,
		blueMotionData: {
			color: 'blue',
			motionType: 'clockwise',
			startOri: 'high',
			endOri: 'high',
			turns: 1
		},
		redMotionData: {
			color: 'red',
			motionType: 'clockwise',
			startOri: 'high',
			endOri: 'high',
			turns: 1
		},
		redPropData: {
			propType: 'poi',
			color: 'red',
			coords: { x: 425, y: 475 },
			rotAngle: 0
		},
		bluePropData: {
			propType: 'poi',
			color: 'blue',
			coords: { x: 525, y: 475 },
			rotAngle: 0
		},
		redArrowData: {
			color: 'red',
			motionType: 'clockwise',
			startOri: 'high',
			endOri: 'high',
			turns: 1,
			coords: { x: 425, y: 375 },
			rotAngle: -90
		},
		blueArrowData: {
			color: 'blue',
			motionType: 'clockwise',
			startOri: 'high',
			endOri: 'high',
			turns: 1,
			coords: { x: 525, y: 375 },
			rotAngle: -90
		},
		gridData: null,
		motions: [],
		redMotion: null,
		blueMotion: null,
		props: []
	},
	B: {
		id: 'b_pictograph',
		letter: 'B' as Letter,
		startPos: 'beta5',
		endPos: 'beta5',
		timing: null,
		direction: null,
		gridMode: DIAMOND,
		grid: DIAMOND,
		blueMotionData: {
			color: 'blue',
			motionType: 'counter',
			startOri: 'middle',
			endOri: 'middle',
			turns: 1
		},
		redMotionData: {
			color: 'red',
			motionType: 'counter',
			startOri: 'middle',
			endOri: 'middle',
			turns: 1
		},
		redPropData: {
			propType: 'poi',
			color: 'red',
			coords: { x: 425, y: 475 },
			rotAngle: 0
		},
		bluePropData: {
			propType: 'poi',
			color: 'blue',
			coords: { x: 525, y: 475 },
			rotAngle: 0
		},
		redArrowData: {
			color: 'red',
			motionType: 'counter',
			startOri: 'middle',
			endOri: 'middle',
			turns: 1,
			coords: { x: 425, y: 475 },
			rotAngle: 90
		},
		blueArrowData: {
			color: 'blue',
			motionType: 'counter',
			startOri: 'middle',
			endOri: 'middle',
			turns: 1,
			coords: { x: 525, y: 475 },
			rotAngle: 90
		},
		gridData: null,
		motions: [],
		redMotion: null,
		blueMotion: null,
		props: []
	},
	C: {
		id: 'c_pictograph',
		letter: 'C' as Letter,
		startPos: 'alpha1',
		endPos: 'alpha1',
		timing: null,
		direction: null,
		gridMode: DIAMOND,
		grid: DIAMOND,
		blueMotionData: {
			color: 'blue',
			motionType: 'counter',
			startOri: 'high',
			endOri: 'high',
			turns: 1
		},
		redMotionData: {
			color: 'red',
			motionType: 'counter',
			startOri: 'high',
			endOri: 'high',
			turns: 1
		},
		redPropData: {
			propType: 'poi',
			color: 'red',
			coords: { x: 425, y: 475 },
			rotAngle: 0
		},
		bluePropData: {
			propType: 'poi',
			color: 'blue',
			coords: { x: 525, y: 475 },
			rotAngle: 0
		},
		redArrowData: {
			color: 'red',
			motionType: 'counter',
			startOri: 'high',
			endOri: 'high',
			turns: 1,
			coords: { x: 425, y: 375 },
			rotAngle: 90
		},
		blueArrowData: {
			color: 'blue',
			motionType: 'counter',
			startOri: 'high',
			endOri: 'high',
			turns: 1,
			coords: { x: 525, y: 375 },
			rotAngle: 90
		},
		gridData: null,
		motions: [],
		redMotion: null,
		blueMotion: null,
		props: []
	},
	D: {
		id: 'd_pictograph',
		letter: 'D' as Letter,
		startPos: 'gamma11',
		endPos: 'gamma11',
		timing: null,
		direction: null,
		gridMode: DIAMOND,
		grid: DIAMOND,
		blueMotionData: {
			color: 'blue',
			motionType: 'clockwise',
			startOri: 'low',
			endOri: 'low',
			turns: 1
		},
		redMotionData: {
			color: 'red',
			motionType: 'clockwise',
			startOri: 'low',
			endOri: 'low',
			turns: 1
		},
		redPropData: {
			propType: 'poi',
			color: 'red',
			coords: { x: 425, y: 575 },
			rotAngle: 0
		},
		bluePropData: {
			propType: 'poi',
			color: 'blue',
			coords: { x: 525, y: 575 },
			rotAngle: 0
		},
		redArrowData: {
			color: 'red',
			motionType: 'clockwise',
			startOri: 'low',
			endOri: 'low',
			turns: 1,
			coords: { x: 425, y: 575 },
			rotAngle: -90
		},
		blueArrowData: {
			color: 'blue',
			motionType: 'clockwise',
			startOri: 'low',
			endOri: 'low',
			turns: 1,
			coords: { x: 525, y: 575 },
			rotAngle: -90
		},
		gridData: null,
		motions: [],
		redMotion: null,
		blueMotion: null,
		props: []
	},
	L: {
		id: 'l_pictograph',
		letter: 'L' as Letter,
		startPos: 'beta5',
		endPos: 'beta5',
		timing: null,
		direction: null,
		gridMode: DIAMOND,
		grid: DIAMOND,
		blueMotionData: {
			color: 'blue',
			motionType: 'clockwise',
			startOri: 'middle',
			endOri: 'middle',
			turns: 1
		},
		redMotionData: {
			color: 'red',
			motionType: 'clockwise',
			startOri: 'middle',
			endOri: 'middle',
			turns: 1
		},
		redPropData: {
			propType: 'poi',
			color: 'red',
			coords: { x: 425, y: 475 },
			rotAngle: 0
		},
		bluePropData: {
			propType: 'poi',
			color: 'blue',
			coords: { x: 525, y: 475 },
			rotAngle: 0
		},
		redArrowData: {
			color: 'red',
			motionType: 'clockwise',
			startOri: 'middle',
			endOri: 'middle',
			turns: 1,
			coords: { x: 425, y: 475 },
			rotAngle: -90
		},
		blueArrowData: {
			color: 'blue',
			motionType: 'clockwise',
			startOri: 'middle',
			endOri: 'middle',
			turns: 1,
			coords: { x: 525, y: 475 },
			rotAngle: -90
		},
		gridData: null,
		motions: [],
		redMotion: null,
		blueMotion: null,
		props: []
	},
	M: {
		id: 'm_pictograph',
		letter: 'M' as Letter,
		startPos: 'beta5',
		endPos: 'beta5',
		timing: null,
		direction: null,
		gridMode: DIAMOND,
		grid: DIAMOND,
		blueMotionData: {
			color: 'blue',
			motionType: 'both',
			startOri: 'middle',
			endOri: 'middle',
			turns: 1
		},
		redMotionData: {
			color: 'red',
			motionType: 'both',
			startOri: 'middle',
			endOri: 'middle',
			turns: 1
		},
		redPropData: {
			propType: 'poi',
			color: 'red',
			coords: { x: 425, y: 475 },
			rotAngle: 0
		},
		bluePropData: {
			propType: 'poi',
			color: 'blue',
			coords: { x: 525, y: 475 },
			rotAngle: 0
		},
		redArrowData: {
			color: 'red',
			motionType: 'both',
			startOri: 'middle',
			endOri: 'middle',
			turns: 1,
			coords: { x: 425, y: 475 },
			rotAngle: 0
		},
		blueArrowData: {
			color: 'blue',
			motionType: 'both',
			startOri: 'middle',
			endOri: 'middle',
			turns: 1,
			coords: { x: 525, y: 475 },
			rotAngle: 0
		},
		gridData: null,
		motions: [],
		redMotion: null,
		blueMotion: null,
		props: []
	},
	R: {
		id: 'r_pictograph',
		letter: 'R' as Letter,
		startPos: 'gamma11',
		endPos: 'gamma11',
		timing: null,
		direction: null,
		gridMode: DIAMOND,
		grid: DIAMOND,
		blueMotionData: {
			color: 'blue',
			motionType: 'counter',
			startOri: 'low',
			endOri: 'low',
			turns: 1
		},
		redMotionData: {
			color: 'red',
			motionType: 'counter',
			startOri: 'low',
			endOri: 'low',
			turns: 1
		},
		redPropData: {
			propType: 'poi',
			color: 'red',
			coords: { x: 425, y: 575 },
			rotAngle: 0
		},
		bluePropData: {
			propType: 'poi',
			color: 'blue',
			coords: { x: 525, y: 575 },
			rotAngle: 0
		},
		redArrowData: {
			color: 'red',
			motionType: 'counter',
			startOri: 'low',
			endOri: 'low',
			turns: 1,
			coords: { x: 425, y: 575 },
			rotAngle: 90
		},
		blueArrowData: {
			color: 'blue',
			motionType: 'counter',
			startOri: 'low',
			endOri: 'low',
			turns: 1,
			coords: { x: 525, y: 575 },
			rotAngle: 90
		},
		gridData: null,
		motions: [],
		redMotion: null,
		blueMotion: null,
		props: []
	},
	T: {
		id: 't_pictograph',
		letter: 'T' as Letter,
		startPos: 'alpha1',
		endPos: 'alpha1',
		timing: null,
		direction: null,
		gridMode: DIAMOND,
		grid: DIAMOND,
		blueMotionData: {
			color: 'blue',
			motionType: 'both',
			startOri: 'high',
			endOri: 'high',
			turns: 1
		},
		redMotionData: {
			color: 'red',
			motionType: 'both',
			startOri: 'high',
			endOri: 'high',
			turns: 1
		},
		redPropData: {
			propType: 'poi',
			color: 'red',
			coords: { x: 425, y: 375 },
			rotAngle: 0
		},
		bluePropData: {
			propType: 'poi',
			color: 'blue',
			coords: { x: 525, y: 375 },
			rotAngle: 0
		},
		redArrowData: {
			color: 'red',
			motionType: 'both',
			startOri: 'high',
			endOri: 'high',
			turns: 1,
			coords: { x: 425, y: 375 },
			rotAngle: 0
		},
		blueArrowData: {
			color: 'blue',
			motionType: 'both',
			startOri: 'high',
			endOri: 'high',
			turns: 1,
			coords: { x: 525, y: 375 },
			rotAngle: 0
		},
		gridData: null,
		motions: [],
		redMotion: null,
		blueMotion: null,
		props: []
	}
};

// Lists of valid options for different lesson types
const POSITIONS = ['high', 'middle', 'low'];
const TURNS = ['clockwise', 'counter', 'both'];
const LETTERS = Object.keys(LETTER_PICTOGRAPHS);

/**
 * Fetch pictographs for a specific letter
 * @param letter The letter to fetch pictographs for
 * @returns Promise resolving to an array of pictograph objects
 */
export async function fetchPictographsForLetter(letter: string): Promise<any[]> {
	if (!browser) return [];

	// In a real implementation, this would fetch from an API endpoint
	// For now, we'll use the mock data with a simulated delay
	return new Promise((resolve) => {
		setTimeout(() => {
			const pictograph = LETTER_PICTOGRAPHS[letter.toUpperCase()];
			resolve(pictograph ? [pictograph] : []);
		}, 300);
	});
}

/**
 * Fetch all available pictographs
 * @returns Promise resolving to an array of all pictograph objects
 */
export async function fetchAllPictographs(): Promise<any[]> {
	if (!browser) return [];

	// In a real implementation, this would fetch from an API endpoint
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(Object.values(LETTER_PICTOGRAPHS));
		}, 500);
	});
}

/**
 * Get pictographs filtered by position
 * @param position The position to filter by
 * @returns Promise resolving to an array of matching pictograph objects
 */
export async function getPictographsByPosition(position: string): Promise<any[]> {
	if (!browser || !POSITIONS.includes(position)) return [];

	return new Promise((resolve) => {
		setTimeout(() => {
			const filtered = Object.values(LETTER_PICTOGRAPHS).filter(
				(p) => p.data.position === position
			);
			resolve(filtered);
		}, 300);
	});
}

/**
 * Get pictographs filtered by turn type
 * @param turnType The turn type to filter by
 * @returns Promise resolving to an array of matching pictograph objects
 */
export async function getPictographsByTurn(turnType: string): Promise<any[]> {
	if (!browser || !TURNS.includes(turnType)) return [];

	return new Promise((resolve) => {
		setTimeout(() => {
			const filtered = Object.values(LETTER_PICTOGRAPHS).filter((p) => p.data.turn === turnType);
			resolve(filtered);
		}, 300);
	});
}

/**
 * Get all valid letters for pictographs
 * @returns Array of valid letters
 */
export function getValidLetters(): string[] {
	return LETTERS;
}

/**
 * Get all valid positions for pictographs
 * @returns Array of valid positions
 */
export function getValidPositions(): string[] {
	return POSITIONS;
}

/**
 * Get all valid turn types for pictographs
 * @returns Array of valid turn types
 */
export function getValidTurnTypes(): string[] {
	return TURNS;
}
