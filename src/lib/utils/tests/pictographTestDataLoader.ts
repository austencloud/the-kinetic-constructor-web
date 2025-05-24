/**
 * Pictograph Test Data Loader
 *
 * Provides standardized access to real pictograph data from CSV files for testing purposes.
 * Replaces hardcoded mock data with actual valid pictograph combinations from the dataset.
 */

import type { PictographData } from '$lib/types/PictographData';
import type { Letter } from '$lib/types/Letter';
import type { TKAPosition } from '$lib/types/TKAPosition';
import type { VTGTiming, VTGDir, HandRotDir } from '$lib/types/Types';
import type { MotionData } from '$lib/components/objects/Motion/MotionData';
import { LetterUtils } from '$lib/utils/LetterUtils';
import { HandpathCalculator } from '$lib/components/objects/Motion/HandpathCalculator';

// Helper function to convert string to camelCase (same as in pictographDataState)
function toCamelCase(str: string): string {
	return str.replace(/([-_][a-z])/g, (group) =>
		group.toUpperCase().replace('-', '').replace('_', '')
	);
}

// Create a single instance of HandpathCalculator for reuse
const handpathCalculator = new HandpathCalculator();

// Extract motion attributes from CSV record
function extractMotionData(record: Record<string, any>, color: 'red' | 'blue'): MotionData {
	const prefix = color === 'red' ? 'red' : 'blue';

	const startLoc = record[`${prefix}StartLoc`] || 's';
	const endLoc = record[`${prefix}EndLoc`] || 's';

	// Calculate hand rotation direction based on start and end locations
	const handRotDir = handpathCalculator.getHandRotDir(startLoc, endLoc);

	return {
		id: `${color}-test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
		motionType: record[`${prefix}MotionType`] || 'static',
		startOri: 'in', // Default orientation for tests
		endOri: 'in', // Default orientation for tests
		propRotDir: record[`${prefix}PropRotDir`] || 'no_rot',
		startLoc,
		endLoc,
		turns: 0, // Default for tests
		color,
		leadState: null,
		prefloatMotionType: null,
		prefloatPropRotDir: null,
		handRotDir // Calculated based on actual start/end locations
	};
}

// Parse CSV data to JSON format
function parseCsvToJson(csv: string, gridMode: string = 'diamond') {
	const lines = csv.split('\n').filter((line) => line.trim() && !line.startsWith('#'));
	const headers = lines.shift()?.split(',').map(toCamelCase) || [];

	return lines.map((line) => {
		const values = line.split(',');
		const record = headers.reduce(
			(acc, header, index) => {
				acc[header.trim()] = values[index]?.trim();
				return acc;
			},
			{} as Record<string, any>
		);

		record.gridMode = gridMode;
		return record;
	});
}

// Convert raw CSV records to PictographData
function convertToPictographData(records: Record<string, any>[]): PictographData[] {
	const processedPictographs: PictographData[] = [];

	records.forEach((record) => {
		const rawLetter = record.letter;

		if (!rawLetter || typeof rawLetter !== 'string') {
			return;
		}

		try {
			const letter = LetterUtils.tryFromString(rawLetter);
			if (!letter) {
				return;
			}

			const redMotionData = extractMotionData(record, 'red');
			const blueMotionData = extractMotionData(record, 'blue');

			processedPictographs.push({
				letter,
				startPos: record.startPos as TKAPosition,
				endPos: record.endPos as TKAPosition,
				timing: record.timing as VTGTiming,
				direction: record.direction as VTGDir,
				redMotionData,
				blueMotionData,
				gridMode: record.gridMode || 'diamond',
				grid: '',
				gridData: null,
				redArrowData: null,
				blueArrowData: null,
				motions: [],
				redMotion: null,
				blueMotion: null,
				props: [],
				redPropData: null,
				bluePropData: null,
				isStartPosition: false
			});
		} catch (error) {
			console.warn(`Failed to process pictograph record for letter ${rawLetter}:`, error);
		}
	});

	return processedPictographs;
}

/**
 * Main class for loading and managing pictograph test data
 */
export class PictographTestDataLoader {
	private static instance: PictographTestDataLoader | null = null;
	private pictographs: PictographData[] = [];
	private isLoaded = false;

	private constructor() {}

	/**
	 * Get singleton instance
	 */
	static getInstance(): PictographTestDataLoader {
		if (!PictographTestDataLoader.instance) {
			PictographTestDataLoader.instance = new PictographTestDataLoader();
		}
		return PictographTestDataLoader.instance;
	}

	/**
	 * Load pictograph data from CSV content
	 */
	async loadFromCsvContent(csvContent: string, gridMode: string = 'diamond'): Promise<void> {
		try {
			const records = parseCsvToJson(csvContent, gridMode);
			this.pictographs = convertToPictographData(records);
			this.isLoaded = true;
			console.log(`Loaded ${this.pictographs.length} pictographs for testing`);
		} catch (error) {
			console.error('Failed to load pictograph test data:', error);
			throw error;
		}
	}

	/**
	 * Load pictograph data from file path (for Node.js environments)
	 */
	async loadFromFile(filePath: string, gridMode: string = 'diamond'): Promise<void> {
		try {
			// This would be used in Node.js test environments
			const fs = await import('fs');
			const csvContent = fs.readFileSync(filePath, 'utf-8');
			await this.loadFromCsvContent(csvContent, gridMode);
		} catch (error) {
			console.error(`Failed to load pictograph data from file ${filePath}:`, error);
			throw error;
		}
	}

	/**
	 * Get all loaded pictographs
	 */
	getAllPictographs(): PictographData[] {
		this.ensureLoaded();
		return [...this.pictographs];
	}

	/**
	 * Get pictographs by letter
	 */
	getByLetter(letter: Letter): PictographData[] {
		this.ensureLoaded();
		return this.pictographs.filter((p) => p.letter === letter);
	}

	/**
	 * Get a single pictograph by letter (first match)
	 */
	getFirstByLetter(letter: Letter): PictographData | null {
		const matches = this.getByLetter(letter);
		return matches.length > 0 ? matches[0] : null;
	}

	/**
	 * Get pictographs by start position
	 */
	getByStartPosition(startPos: TKAPosition): PictographData[] {
		this.ensureLoaded();
		return this.pictographs.filter((p) => p.startPos === startPos);
	}

	/**
	 * Get pictographs by end position
	 */
	getByEndPosition(endPos: TKAPosition): PictographData[] {
		this.ensureLoaded();
		return this.pictographs.filter((p) => p.endPos === endPos);
	}

	/**
	 * Get pictographs by timing
	 */
	getByTiming(timing: VTGTiming): PictographData[] {
		this.ensureLoaded();
		return this.pictographs.filter((p) => p.timing === timing);
	}

	/**
	 * Get pictographs by direction
	 */
	getByDirection(direction: VTGDir): PictographData[] {
		this.ensureLoaded();
		return this.pictographs.filter((p) => p.direction === direction);
	}

	/**
	 * Get pictographs by motion type
	 */
	getByMotionType(motionType: string, color?: 'red' | 'blue'): PictographData[] {
		this.ensureLoaded();
		return this.pictographs.filter((p) => {
			if (color === 'red') {
				return p.redMotionData?.motionType === motionType;
			} else if (color === 'blue') {
				return p.blueMotionData?.motionType === motionType;
			} else {
				return (
					p.redMotionData?.motionType === motionType || p.blueMotionData?.motionType === motionType
				);
			}
		});
	}

	/**
	 * Get a random pictograph
	 */
	getRandomPictograph(): PictographData | null {
		this.ensureLoaded();
		if (this.pictographs.length === 0) return null;
		const randomIndex = Math.floor(Math.random() * this.pictographs.length);
		return this.pictographs[randomIndex];
	}

	/**
	 * Get multiple random pictographs
	 */
	getRandomPictographs(count: number): PictographData[] {
		this.ensureLoaded();
		const shuffled = [...this.pictographs].sort(() => 0.5 - Math.random());
		return shuffled.slice(0, Math.min(count, this.pictographs.length));
	}

	/**
	 * Get pictographs matching multiple criteria
	 */
	getByMultipleCriteria(criteria: {
		letter?: Letter;
		startPos?: TKAPosition;
		endPos?: TKAPosition;
		timing?: VTGTiming;
		direction?: VTGDir;
		redMotionType?: string;
		blueMotionType?: string;
	}): PictographData[] {
		this.ensureLoaded();

		return this.pictographs.filter((p) => {
			if (criteria.letter && p.letter !== criteria.letter) return false;
			if (criteria.startPos && p.startPos !== criteria.startPos) return false;
			if (criteria.endPos && p.endPos !== criteria.endPos) return false;
			if (criteria.timing && p.timing !== criteria.timing) return false;
			if (criteria.direction && p.direction !== criteria.direction) return false;
			if (criteria.redMotionType && p.redMotionData?.motionType !== criteria.redMotionType)
				return false;
			if (criteria.blueMotionType && p.blueMotionData?.motionType !== criteria.blueMotionType)
				return false;
			return true;
		});
	}

	/**
	 * Check if data is loaded
	 */
	isDataLoaded(): boolean {
		return this.isLoaded;
	}

	/**
	 * Get count of loaded pictographs
	 */
	getCount(): number {
		return this.pictographs.length;
	}

	/**
	 * Reset the loader (for testing purposes)
	 */
	reset(): void {
		this.pictographs = [];
		this.isLoaded = false;
	}

	private ensureLoaded(): void {
		if (!this.isLoaded) {
			throw new Error(
				'Pictograph test data not loaded. Call loadFromCsvContent() or loadFromFile() first.'
			);
		}
	}
}

/**
 * Convenience function to get the singleton instance
 */
export function getPictographTestDataLoader(): PictographTestDataLoader {
	return PictographTestDataLoader.getInstance();
}
