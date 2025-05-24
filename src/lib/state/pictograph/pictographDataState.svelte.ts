/**
 * Modern Svelte 5 runes-based pictograph data state management
 * Replaces the legacy pictographDataStore with reactive runes
 */

import { browser } from '$app/environment';
import type { PictographData } from '$lib/types/PictographData';
import { LetterUtils } from '$lib/utils/LetterUtils';
import type { Letter } from '$lib/types/Letter';

// Helper function to convert string to camelCase
function toCamelCase(str: string): string {
	return str.replace(/([-_][a-z])/g, (group) =>
		group.toUpperCase().replace('-', '').replace('_', '')
	);
}

// Extract motion attributes from CSV record
function extractAttributes(record: Record<string, any>, color: 'red' | 'blue') {
	const prefix = color === 'red' ? 'red' : 'blue';

	return {
		id: `${color}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		motionType: record[`${prefix}MotionType`] || 'static',
		startOri: record[`${prefix}StartOri`] || 'in',
		endOri: record[`${prefix}EndOri`] || record[`${prefix}StartOri`] || 'in',
		propRotDir: record[`${prefix}PropRotDir`] || 'no_rot',
		startLoc: record[`${prefix}StartLoc`] || 's',
		endLoc: record[`${prefix}EndLoc`] || 's',
		turns: typeof record[`${prefix}Turns`] === 'number' ? record[`${prefix}Turns`] : 0,
		color,
		leadState: null,
		prefloatMotionType: null,
		prefloatPropRotDir: null
	};
}

// Parse CSV data to JSON format
function parseCsvToJson(csv: string, gridMode: string) {
	const lines = csv
		.split('\n')
		.map((line) => line.trim()) // Trim whitespace
		.filter((line) => line.length > 0); // Remove empty lines

	const rawHeaders = lines.shift()?.split(',') || [];
	const headers = rawHeaders.map(toCamelCase);

	return lines
		.filter((line) => line.trim().length > 0) // Additional filter for safety
		.map((line) => {
			const values = line.split(',');
			return headers.reduce(
				(acc, header, index) => {
					acc[header.trim()] = values[index]?.trim();
					return acc;
				},
				{ gridMode } as Record<string, any>
			);
		});
}

// Convert raw CSV records to PictographData
function groupPictographsByLetter(pictographs: Record<string, any>[]): PictographData[] {
	const processedPictographs: PictographData[] = [];
	let skippedCount = 0;
	const skippedReasons: Record<string, number> = {};
	const skippedLetterExamples: string[] = [];

	pictographs.forEach((record, index) => {
		const rawLetter = record.letter;

		// Check for missing or invalid letter field
		if (!rawLetter || typeof rawLetter !== 'string') {
			skippedCount++;
			const reason = !rawLetter ? 'missing_letter' : 'non_string_letter';
			skippedReasons[reason] = (skippedReasons[reason] || 0) + 1;

			if (skippedLetterExamples.length < 10) {
				skippedLetterExamples.push(
					`Record ${index}: ${reason} - value: ${JSON.stringify(rawLetter)}`
				);
			}
			return;
		}

		try {
			// Attempt to convert letter with more lenient parsing
			const letter = LetterUtils.tryFromString(rawLetter);

			if (!letter) {
				skippedCount++;
				const reason = 'letter_parse_failed';
				skippedReasons[reason] = (skippedReasons[reason] || 0) + 1;

				if (skippedLetterExamples.length < 10) {
					skippedLetterExamples.push(`Record ${index}: ${reason} - letter: "${rawLetter}"`);
				}
				return;
			}

			const redMotionData = extractAttributes(record, 'red');
			const blueMotionData = extractAttributes(record, 'blue');

			processedPictographs.push({
				letter,
				startPos: record.startPos,
				endPos: record.endPos,
				timing: record.timing,
				direction: record.direction,
				redMotionData,
				blueMotionData,
				gridMode: record.gridMode,
				grid: '',
				gridData: null,
				redArrowData: null,
				blueArrowData: null,
				motions: [],
				redMotion: null,
				blueMotion: null,
				props: [],
				redPropData: null,
				bluePropData: null
			});
		} catch (error) {
			skippedCount++;
			const reason = 'processing_error';
			skippedReasons[reason] = (skippedReasons[reason] || 0) + 1;

			if (skippedLetterExamples.length < 10) {
				skippedLetterExamples.push(
					`Record ${index}: ${reason} - letter: "${rawLetter}", error: ${error}`
				);
			}
		}
	});

	if (skippedCount > 0) {
		console.warn(`Skipped ${skippedCount} invalid pictograph records during processing`);
		console.warn('Skip reasons breakdown:', skippedReasons);

		// Log unique letter values that failed to parse
		const failedLetters = new Set<string>();
		pictographs.forEach((record) => {
			if (record.letter && typeof record.letter === 'string') {
				const letter = LetterUtils.tryFromString(record.letter);
				if (!letter) {
					failedLetters.add(record.letter);
				}
			}
		});

		if (failedLetters.size > 0) {
			console.warn('Unique letter values that failed to parse:', Array.from(failedLetters).sort());
			console.warn('Examples of skipped records:', skippedLetterExamples.slice(0, 5));
		}
	}

	return processedPictographs;
}

// Modern runes-based pictograph data manager
class PictographDataManager {
	// Core reactive state
	#data = $state<PictographData[]>([]);
	#isLoading = $state(false);
	#error = $state<string | null>(null);
	#isInitialized = $state(false);

	// Getters for reactive access
	get data() {
		return this.#data;
	}
	get isLoading() {
		return this.#isLoading;
	}
	get error() {
		return this.#error;
	}
	get isInitialized() {
		return this.#isInitialized;
	}

	// Computed properties
	get isEmpty() {
		return this.#data.length === 0;
	}

	get count() {
		return this.#data.length;
	}

	// Get pictographs by letter
	getByLetter(letter: Letter): PictographData[] {
		return this.#data.filter((p) => p.letter === letter);
	}

	// Get pictographs by start position
	getByStartPosition(startPos: string): PictographData[] {
		return this.#data.filter((p) => p.startPos === startPos);
	}

	// Get pictographs by end position
	getByEndPosition(endPos: string): PictographData[] {
		return this.#data.filter((p) => p.endPos === endPos);
	}

	// Find pictographs matching position and orientations
	findByPositionAndOrientation(
		targetStartPos?: string,
		blueStartOri?: string,
		redStartOri?: string
	): PictographData[] {
		if (!targetStartPos) {
			return [];
		}

		// First filter by position
		const positionMatches = this.#data.filter(
			(pictograph) => pictograph?.startPos === targetStartPos
		);

		// If no orientation constraints, return all position matches
		if (!blueStartOri && !redStartOri) {
			return positionMatches;
		}

		// Filter by orientations
		return positionMatches.filter((pictograph) => {
			const blueMatches =
				!blueStartOri ||
				!pictograph.blueMotionData ||
				pictograph.blueMotionData.startOri === blueStartOri;

			const redMatches =
				!redStartOri ||
				!pictograph.redMotionData ||
				pictograph.redMotionData.startOri === redStartOri;

			return blueMatches && redMatches;
		});
	}

	// Initialize from CSV data
	async initializeFromCsv(csvData: { diamondData: string; boxData: string }) {
		this.#isLoading = true;
		this.#error = null;

		try {
			if (!csvData.diamondData && !csvData.boxData) {
				throw new Error('No CSV data provided for initialization.');
			}

			const diamondPictographs = parseCsvToJson(csvData.diamondData || '', 'diamond');
			const boxPictographs = parseCsvToJson(csvData.boxData || '', 'box');

			const combinedData = [...diamondPictographs, ...boxPictographs];
			const allPictographData = groupPictographsByLetter(combinedData);

			// Update reactive state
			this.#data = allPictographData;
			this.#isInitialized = true;
		} catch (error) {
			this.#error = error instanceof Error ? error.message : 'Failed to initialize pictograph data';
			console.error('PictographData: Initialization error:', error);
			this.#data = []; // Set to empty on error
		} finally {
			this.#isLoading = false;
		}
	}

	// Load from server
	async loadFromServer() {
		this.#isLoading = true;
		this.#error = null;

		try {
			if (!browser) {
				return;
			}

			// Fetch CSV files
			const [diamondResponse, boxResponse] = await Promise.all([
				fetch('/DiamondPictographDataframe.csv'),
				fetch('/BoxPictographDataframe.csv')
			]);

			if (!diamondResponse.ok || !boxResponse.ok) {
				throw new Error('Failed to fetch pictograph data files from server');
			}

			const diamondData = await diamondResponse.text();
			const boxData = await boxResponse.text();

			// Initialize with the fetched data
			await this.initializeFromCsv({ diamondData, boxData });
		} catch (error) {
			this.#error =
				error instanceof Error ? error.message : 'Failed to load pictograph data from server';
			console.error('PictographData: Server load error:', error);
		} finally {
			this.#isLoading = false;
		}
	}

	// Reset state
	reset() {
		this.#data = [];
		this.#isLoading = false;
		this.#error = null;
		this.#isInitialized = false;
	}

	// Wait for initialization to complete
	async waitForInitialization(timeoutMs = 10000): Promise<boolean> {
		if (this.#isInitialized) {
			return true;
		}

		return new Promise((resolve) => {
			const startTime = Date.now();

			const checkInitialized = () => {
				if (this.#isInitialized) {
					resolve(true);
				} else if (Date.now() - startTime > timeoutMs) {
					resolve(false);
				} else {
					setTimeout(checkInitialized, 50);
				}
			};

			checkInitialized();
		});
	}
}

// Create and export the singleton instance
export const pictographData = new PictographDataManager();

// Auto-initialize when in browser (for backward compatibility)
if (browser) {
	// Try to load from server on module initialization
	pictographData.loadFromServer().catch((error) => {
		console.warn('PictographData: Auto-initialization failed:', error);
	});
}
