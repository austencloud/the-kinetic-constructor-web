/**
 * Pictograph Data Loader Utility
 * Loads and parses valid pictograph data from DiamondPictographDataframe.csv
 * Provides data-driven testing capabilities with authentic pictograph combinations
 */

import type { PictographData } from '$lib/types/PictographData';

// TypeScript interfaces matching CSV structure exactly
export interface DiamondPictographEntry {
	letter: string;
	startPos: string;
	endPos: string;
	timing: 'split' | 'tog' | 'quarter' | 'none';
	direction: 'same' | 'opp' | 'none';
	blueMotionType: 'pro' | 'anti' | 'static' | 'dash';
	bluePropRotDir: 'cw' | 'ccw' | 'no_rot';
	blueStartLoc: 'n' | 's' | 'e' | 'w';
	blueEndLoc: 'n' | 's' | 'e' | 'w';
	redMotionType: 'pro' | 'anti' | 'static' | 'dash';
	redPropRotDir: 'cw' | 'ccw' | 'no_rot';
	redStartLoc: 'n' | 's' | 'e' | 'w';
	redEndLoc: 'n' | 's' | 'e' | 'w';
}

export interface PictographDataLoaderOptions {
	includeStaticMotions?: boolean;
	includeDashMotions?: boolean;
	filterByTiming?: ('split' | 'tog' | 'quarter' | 'none')[];
	filterByDirection?: ('same' | 'opp' | 'none')[];
	filterByStartPosition?: string;
	filterByEndPosition?: string;
	filterByLetter?: string[];
}

export class PictographDataLoader {
	private static instance: PictographDataLoader;
	private csvData: DiamondPictographEntry[] = [];
	private isLoaded = false;
	private loadPromise: Promise<void> | null = null;

	private constructor() {}

	public static getInstance(): PictographDataLoader {
		if (!PictographDataLoader.instance) {
			PictographDataLoader.instance = new PictographDataLoader();
		}
		return PictographDataLoader.instance;
	}

	/**
	 * Load CSV data from static file
	 */
	public async loadData(): Promise<void> {
		if (this.isLoaded) return;
		if (this.loadPromise) return this.loadPromise;

		this.loadPromise = this.performLoad();
		return this.loadPromise;
	}

	private async performLoad(): Promise<void> {
		try {
			console.log(
				'🔍 PictographDataLoader: Starting CSV load from /DiamondPictographDataframe.csv'
			);
			const response = await fetch('/DiamondPictographDataframe.csv');
			if (!response.ok) {
				throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
			}

			const csvText = await response.text();
			console.log('🔍 PictographDataLoader: CSV text loaded, length:', csvText.length);

			this.csvData = this.parseCsv(csvText);
			console.log('🔍 PictographDataLoader: Parsed CSV entries:', this.csvData.length);

			this.validateData();
			console.log('🔍 PictographDataLoader: After validation, entries:', this.csvData.length);

			this.isLoaded = true;
			console.log('✅ PictographDataLoader: CSV data loaded successfully');
		} catch (error) {
			console.error('❌ PictographDataLoader: Failed to load CSV data:', error);
			throw error;
		}
	}

	/**
	 * Parse CSV text into structured data
	 */
	private parseCsv(csvText: string): DiamondPictographEntry[] {
		const lines = csvText.split('\n').filter((line) => line.trim() && !line.startsWith('letter,'));
		const entries: DiamondPictographEntry[] = [];

		for (const line of lines) {
			const columns = line.split(',').map((col) => col.trim());

			if (columns.length >= 13 && columns[0]) {
				entries.push({
					letter: columns[0],
					startPos: columns[1],
					endPos: columns[2],
					timing: columns[3] as any,
					direction: columns[4] as any,
					blueMotionType: columns[5] as any,
					bluePropRotDir: columns[6] as any,
					blueStartLoc: columns[7] as any,
					blueEndLoc: columns[8] as any,
					redMotionType: columns[9] as any,
					redPropRotDir: columns[10] as any,
					redStartLoc: columns[11] as any,
					redEndLoc: columns[12] as any
				});
			}
		}

		return entries;
	}

	/**
	 * Validate loaded data matches expected schema
	 */
	private validateData(): void {
		const validTimings = ['split', 'tog', 'quarter', 'none'];
		const validDirections = ['same', 'opp', 'none'];
		const validMotionTypes = ['pro', 'anti', 'static', 'dash'];
		const validRotDirs = ['cw', 'ccw', 'no_rot'];
		const validLocations = ['n', 's', 'e', 'w'];

		let invalidCount = 0;

		this.csvData = this.csvData.filter((entry) => {
			const isValid =
				entry.letter &&
				validTimings.includes(entry.timing) &&
				validDirections.includes(entry.direction) &&
				validMotionTypes.includes(entry.blueMotionType) &&
				validMotionTypes.includes(entry.redMotionType) &&
				validRotDirs.includes(entry.bluePropRotDir) &&
				validRotDirs.includes(entry.redPropRotDir) &&
				validLocations.includes(entry.blueStartLoc) &&
				validLocations.includes(entry.blueEndLoc) &&
				validLocations.includes(entry.redStartLoc) &&
				validLocations.includes(entry.redEndLoc);

			if (!isValid) invalidCount++;
			return isValid;
		});

		if (invalidCount > 0) {
			console.warn(`PictographDataLoader: Filtered out ${invalidCount} invalid entries`);
		}
	}

	/**
	 * Convert CSV entry to PictographData interface
	 */
	private convertToPictographData(entry: DiamondPictographEntry): PictographData {
		return {
			letter: entry.letter,
			startPos: entry.startPos,
			endPos: entry.endPos,
			gridMode: 'diamond', // All entries are diamond mode

			// Blue motion data
			blueMotionData:
				entry.blueMotionType !== 'static'
					? {
							motionType: entry.blueMotionType,
							direction: entry.bluePropRotDir === 'no_rot' ? 'cw' : entry.bluePropRotDir
						}
					: null,

			// Red motion data
			redMotionData:
				entry.redMotionType !== 'static'
					? {
							motionType: entry.redMotionType,
							direction: entry.redPropRotDir === 'no_rot' ? 'cw' : entry.redPropRotDir
						}
					: null,

			// Prop data (derived from motion and rotation)
			bluePropData:
				entry.blueMotionType !== 'static' && entry.bluePropRotDir !== 'no_rot'
					? {
							propType: 'staff', // Default prop type
							rotation: entry.bluePropRotDir
						}
					: null,

			redPropData:
				entry.redMotionType !== 'static' && entry.redPropRotDir !== 'no_rot'
					? {
							propType: 'staff', // Default prop type
							rotation: entry.redPropRotDir
						}
					: null,

			// Arrow data (derived from start/end locations)
			blueArrowData:
				entry.blueStartLoc !== entry.blueEndLoc
					? {
							startLocation: entry.blueStartLoc,
							endLocation: entry.blueEndLoc,
							clockwise: entry.bluePropRotDir === 'cw'
						}
					: null,

			redArrowData:
				entry.redStartLoc !== entry.redEndLoc
					? {
							startLocation: entry.redStartLoc,
							endLocation: entry.redEndLoc,
							clockwise: entry.redPropRotDir === 'cw'
						}
					: null,

			// Grid representation (will be generated by pictograph system)
			grid: ''
		};
	}

	/**
	 * Get a random valid pictograph entry
	 */
	public async getRandomPictographData(
		options: PictographDataLoaderOptions = {}
	): Promise<PictographData> {
		await this.loadData();

		const filteredEntries = this.filterEntries(options);
		if (filteredEntries.length === 0) {
			throw new Error('No pictograph entries match the specified criteria');
		}

		const randomEntry = filteredEntries[Math.floor(Math.random() * filteredEntries.length)];
		return this.convertToPictographData(randomEntry);
	}

	/**
	 * Get all valid entries for a specific letter
	 */
	public async getPictographDataByLetter(
		letter: string,
		options: PictographDataLoaderOptions = {}
	): Promise<PictographData[]> {
		await this.loadData();

		const letterEntries = this.csvData.filter(
			(entry) => entry.letter.toLowerCase() === letter.toLowerCase()
		);

		const filteredEntries = this.filterEntries(options, letterEntries);
		return filteredEntries.map((entry) => this.convertToPictographData(entry));
	}

	/**
	 * Get a valid sequence of connected pictographs
	 */
	public async getValidPictographSequence(
		length: number,
		options: PictographDataLoaderOptions = {}
	): Promise<PictographData[]> {
		await this.loadData();

		if (length <= 0) return [];

		const sequence: PictographData[] = [];
		const filteredEntries = this.filterEntries(options);

		// Start with a random entry
		let currentEntry = filteredEntries[Math.floor(Math.random() * filteredEntries.length)];
		sequence.push(this.convertToPictographData(currentEntry));

		// Build sequence by finding entries that start where the previous ended
		for (let i = 1; i < length; i++) {
			const nextEntries = filteredEntries.filter((entry) => entry.startPos === currentEntry.endPos);

			if (nextEntries.length === 0) {
				// If no connecting entry found, pick a random one
				currentEntry = filteredEntries[Math.floor(Math.random() * filteredEntries.length)];
			} else {
				currentEntry = nextEntries[Math.floor(Math.random() * nextEntries.length)];
			}

			sequence.push(this.convertToPictographData(currentEntry));
		}

		return sequence;
	}

	/**
	 * Get array of all available letters in the dataframe
	 */
	public async getAllValidLetters(): Promise<string[]> {
		await this.loadData();

		const letters = new Set(this.csvData.map((entry) => entry.letter));
		return Array.from(letters).sort();
	}

	/**
	 * Get statistics about the loaded data
	 */
	public async getDataStatistics(): Promise<{
		totalEntries: number;
		uniqueLetters: number;
		motionTypes: Record<string, number>;
		timingTypes: Record<string, number>;
		directionTypes: Record<string, number>;
	}> {
		await this.loadData();

		const motionTypes: Record<string, number> = {};
		const timingTypes: Record<string, number> = {};
		const directionTypes: Record<string, number> = {};

		this.csvData.forEach((entry) => {
			// Count motion types
			motionTypes[entry.blueMotionType] = (motionTypes[entry.blueMotionType] || 0) + 1;
			motionTypes[entry.redMotionType] = (motionTypes[entry.redMotionType] || 0) + 1;

			// Count timing types
			timingTypes[entry.timing] = (timingTypes[entry.timing] || 0) + 1;

			// Count direction types
			directionTypes[entry.direction] = (directionTypes[entry.direction] || 0) + 1;
		});

		return {
			totalEntries: this.csvData.length,
			uniqueLetters: new Set(this.csvData.map((entry) => entry.letter)).size,
			motionTypes,
			timingTypes,
			directionTypes
		};
	}

	/**
	 * Filter entries based on options
	 */
	private filterEntries(
		options: PictographDataLoaderOptions,
		entries?: DiamondPictographEntry[]
	): DiamondPictographEntry[] {
		const sourceEntries = entries || this.csvData;

		return sourceEntries.filter((entry) => {
			// Filter static motions
			if (
				!options.includeStaticMotions &&
				(entry.blueMotionType === 'static' || entry.redMotionType === 'static')
			) {
				return false;
			}

			// Filter dash motions
			if (
				!options.includeDashMotions &&
				(entry.blueMotionType === 'dash' || entry.redMotionType === 'dash')
			) {
				return false;
			}

			// Filter by timing
			if (options.filterByTiming && !options.filterByTiming.includes(entry.timing)) {
				return false;
			}

			// Filter by direction
			if (options.filterByDirection && !options.filterByDirection.includes(entry.direction)) {
				return false;
			}

			// Filter by start position
			if (options.filterByStartPosition && entry.startPos !== options.filterByStartPosition) {
				return false;
			}

			// Filter by end position
			if (options.filterByEndPosition && entry.endPos !== options.filterByEndPosition) {
				return false;
			}

			// Filter by letter
			if (options.filterByLetter && !options.filterByLetter.includes(entry.letter)) {
				return false;
			}

			return true;
		});
	}

	/**
	 * Check if data is loaded
	 */
	public isDataLoaded(): boolean {
		return this.isLoaded;
	}

	/**
	 * Get valid transitions from a specific start position
	 */
	public async getValidTransitionsFromPosition(
		startPosition: string,
		options: PictographDataLoaderOptions = {}
	): Promise<PictographData[]> {
		await this.loadData();

		console.log('🔍 PictographDataLoader: Looking for transitions from position:', startPosition);
		console.log('🔍 Total CSV entries loaded:', this.csvData.length);

		// Debug: Show sample positions from CSV data
		const samplePositions = this.csvData.slice(0, 5).map((entry) => ({
			letter: entry.letter,
			startPos: entry.startPos,
			endPos: entry.endPos
		}));
		console.log('🔍 Sample CSV positions:', samplePositions);

		const transitionOptions = {
			...options,
			filterByStartPosition: startPosition
		};

		const filteredEntries = this.filterEntries(transitionOptions);
		console.log('🔍 Filtered entries found:', filteredEntries.length);

		if (filteredEntries.length === 0) {
			// Debug: Show all unique start positions in CSV
			const uniqueStartPositions = [...new Set(this.csvData.map((entry) => entry.startPos))];
			console.log('🔍 All available start positions in CSV:', uniqueStartPositions.slice(0, 10));
		}

		return filteredEntries.map((entry) => this.convertToPictographData(entry));
	}

	/**
	 * Get raw CSV entries (for advanced usage)
	 */
	public async getRawEntries(): Promise<DiamondPictographEntry[]> {
		await this.loadData();
		return [...this.csvData];
	}
}

// Convenience functions for easy usage
export const pictographDataLoader = PictographDataLoader.getInstance();

export async function getRandomPictographData(
	options?: PictographDataLoaderOptions
): Promise<PictographData> {
	return pictographDataLoader.getRandomPictographData(options);
}

export async function getPictographDataByLetter(
	letter: string,
	options?: PictographDataLoaderOptions
): Promise<PictographData[]> {
	return pictographDataLoader.getPictographDataByLetter(letter, options);
}

export async function getValidPictographSequence(
	length: number,
	options?: PictographDataLoaderOptions
): Promise<PictographData[]> {
	return pictographDataLoader.getValidPictographSequence(length, options);
}

export async function getAllValidLetters(): Promise<string[]> {
	return pictographDataLoader.getAllValidLetters();
}

export async function getValidTransitionsFromPosition(
	startPosition: string,
	options?: PictographDataLoaderOptions
): Promise<PictographData[]> {
	return pictographDataLoader.getValidTransitionsFromPosition(startPosition, options);
}
