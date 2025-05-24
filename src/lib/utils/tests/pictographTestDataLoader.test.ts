/**
 * Tests for PictographTestDataLoader
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PictographTestDataLoader, getPictographTestDataLoader } from './pictographTestDataLoader';
import {
	initializeTestDataLoader,
	getTestPictographByLetter,
	createTestSequence,
	getRandomTestPictographs,
	resetTestData,
	SAMPLE_DIAMOND_CSV
} from './pictographTestHelpers';
import { Letter } from '$lib/types/Letter';

describe('PictographTestDataLoader', () => {
	let loader: PictographTestDataLoader;

	beforeEach(() => {
		loader = PictographTestDataLoader.getInstance();
		resetTestData(); // Ensure clean state
	});

	afterEach(() => {
		resetTestData();
	});

	describe('Singleton Pattern', () => {
		it('should return the same instance', () => {
			const loader1 = PictographTestDataLoader.getInstance();
			const loader2 = PictographTestDataLoader.getInstance();
			const loader3 = getPictographTestDataLoader();

			expect(loader1).toBe(loader2);
			expect(loader2).toBe(loader3);
		});
	});

	describe('Data Loading', () => {
		it('should load data from CSV content', async () => {
			expect(loader.isDataLoaded()).toBe(false);
			expect(loader.getCount()).toBe(0);

			await loader.loadFromCsvContent(SAMPLE_DIAMOND_CSV);

			expect(loader.isDataLoaded()).toBe(true);
			expect(loader.getCount()).toBeGreaterThan(0);
		});

		it('should throw error when accessing data before loading', () => {
			expect(() => loader.getAllPictographs()).toThrow('Pictograph test data not loaded');
			expect(() => loader.getByLetter(Letter.A)).toThrow('Pictograph test data not loaded');
		});

		it('should handle empty CSV content', async () => {
			await loader.loadFromCsvContent('');
			expect(loader.isDataLoaded()).toBe(true);
			expect(loader.getCount()).toBe(0);
		});

		it('should handle malformed CSV content gracefully', async () => {
			const malformedCsv = 'invalid,csv,content\nno,proper,headers';
			await loader.loadFromCsvContent(malformedCsv);
			expect(loader.isDataLoaded()).toBe(true);
			// Should not crash, but may have 0 valid pictographs
		});
	});

	describe('Data Retrieval', () => {
		beforeEach(async () => {
			await loader.loadFromCsvContent(SAMPLE_DIAMOND_CSV);
		});

		it('should get all pictographs', () => {
			const allPictographs = loader.getAllPictographs();
			expect(Array.isArray(allPictographs)).toBe(true);
			expect(allPictographs.length).toBeGreaterThan(0);
		});

		it('should get pictographs by letter', () => {
			const letterA = loader.getByLetter(Letter.A);
			expect(Array.isArray(letterA)).toBe(true);
			letterA.forEach((p) => {
				expect(p.letter).toBe(Letter.A);
			});
		});

		it('should get first pictograph by letter', () => {
			const firstA = loader.getFirstByLetter(Letter.A);
			expect(firstA).toBeTruthy();
			expect(firstA?.letter).toBe(Letter.A);

			// Test letter that exists in sample data
			const letterB = loader.getFirstByLetter(Letter.B);
			expect(letterB).toBeTruthy(); // B exists in sample data
			expect(letterB?.letter).toBe(Letter.B);
		});

		it('should get pictographs by start position', () => {
			const alpha3 = loader.getByStartPosition('alpha3');
			expect(Array.isArray(alpha3)).toBe(true);
			alpha3.forEach((p) => {
				expect(p.startPos).toBe('alpha3');
			});
		});

		it('should get pictographs by end position', () => {
			const alpha5 = loader.getByEndPosition('alpha5');
			expect(Array.isArray(alpha5)).toBe(true);
			alpha5.forEach((p) => {
				expect(p.endPos).toBe('alpha5');
			});
		});

		it('should get pictographs by timing', () => {
			const split = loader.getByTiming('split');
			expect(Array.isArray(split)).toBe(true);
			split.forEach((p) => {
				expect(p.timing).toBe('split');
			});
		});

		it('should get pictographs by direction', () => {
			const same = loader.getByDirection('same');
			expect(Array.isArray(same)).toBe(true);
			same.forEach((p) => {
				expect(p.direction).toBe('same');
			});
		});

		it('should get pictographs by motion type', () => {
			const pro = loader.getByMotionType('pro');
			expect(Array.isArray(pro)).toBe(true);
			expect(pro.length).toBeGreaterThan(0);

			const redPro = loader.getByMotionType('pro', 'red');
			expect(Array.isArray(redPro)).toBe(true);
			redPro.forEach((p) => {
				expect(p.redMotionData?.motionType).toBe('pro');
			});

			const bluePro = loader.getByMotionType('pro', 'blue');
			expect(Array.isArray(bluePro)).toBe(true);
			bluePro.forEach((p) => {
				expect(p.blueMotionData?.motionType).toBe('pro');
			});
		});

		it('should get random pictographs', () => {
			const random1 = loader.getRandomPictograph();
			expect(random1).toBeTruthy();

			const random5 = loader.getRandomPictographs(5);
			expect(Array.isArray(random5)).toBe(true);
			expect(random5.length).toBeLessThanOrEqual(5);
			expect(random5.length).toBeGreaterThan(0);
		});

		it('should get pictographs by multiple criteria', () => {
			const criteria = {
				letter: Letter.A,
				timing: 'split' as const,
				direction: 'same' as const
			};

			const matches = loader.getByMultipleCriteria(criteria);
			expect(Array.isArray(matches)).toBe(true);
			matches.forEach((p) => {
				expect(p.letter).toBe(Letter.A);
				expect(p.timing).toBe('split');
				expect(p.direction).toBe('same');
			});
		});

		it('should handle empty results gracefully', () => {
			// Try to find a letter that doesn't exist in sample data
			const nonExistent = loader.getByLetter('Ψ' as Letter);
			expect(Array.isArray(nonExistent)).toBe(true);
			expect(nonExistent.length).toBe(0);
		});
	});

	describe('Data Validation', () => {
		beforeEach(async () => {
			await loader.loadFromCsvContent(SAMPLE_DIAMOND_CSV);
		});

		it('should have valid pictograph structure', () => {
			const allPictographs = loader.getAllPictographs();
			expect(allPictographs.length).toBeGreaterThan(0);

			allPictographs.forEach((p) => {
				// Check required fields
				expect(p).toHaveProperty('letter');
				expect(p).toHaveProperty('startPos');
				expect(p).toHaveProperty('endPos');
				expect(p).toHaveProperty('gridMode');
				expect(p).toHaveProperty('redMotionData');
				expect(p).toHaveProperty('blueMotionData');

				// Check motion data structure
				if (p.redMotionData) {
					expect(p.redMotionData).toHaveProperty('motionType');
					expect(p.redMotionData).toHaveProperty('startLoc');
					expect(p.redMotionData).toHaveProperty('endLoc');
					expect(p.redMotionData).toHaveProperty('color');
					expect(p.redMotionData.color).toBe('red');
				}

				if (p.blueMotionData) {
					expect(p.blueMotionData).toHaveProperty('motionType');
					expect(p.blueMotionData).toHaveProperty('startLoc');
					expect(p.blueMotionData).toHaveProperty('endLoc');
					expect(p.blueMotionData).toHaveProperty('color');
					expect(p.blueMotionData.color).toBe('blue');
				}
			});
		});
	});

	describe('Reset Functionality', () => {
		it('should reset data correctly', async () => {
			await loader.loadFromCsvContent(SAMPLE_DIAMOND_CSV);
			expect(loader.isDataLoaded()).toBe(true);
			expect(loader.getCount()).toBeGreaterThan(0);

			loader.reset();
			expect(loader.isDataLoaded()).toBe(false);
			expect(loader.getCount()).toBe(0);
		});
	});
});

describe('PictographTestHelpers', () => {
	beforeEach(() => {
		resetTestData();
	});

	afterEach(() => {
		resetTestData();
	});

	describe('Initialization', () => {
		it('should initialize test data loader', async () => {
			const loader = getPictographTestDataLoader();
			expect(loader.isDataLoaded()).toBe(false);

			await initializeTestDataLoader();
			expect(loader.isDataLoaded()).toBe(true);
		});

		it('should not reinitialize if already loaded', async () => {
			await initializeTestDataLoader();
			const count1 = getPictographTestDataLoader().getCount();

			await initializeTestDataLoader();
			const count2 = getPictographTestDataLoader().getCount();

			expect(count1).toBe(count2);
		});
	});

	describe('Helper Functions', () => {
		beforeEach(async () => {
			await initializeTestDataLoader();
		});

		it('should get test pictograph by letter', async () => {
			const pictographA = await getTestPictographByLetter(Letter.A);
			expect(pictographA).toBeTruthy();
			expect(pictographA?.letter).toBe(Letter.A);
		});

		it('should create test sequence', async () => {
			const sequence = await createTestSequence([Letter.A, Letter.B, Letter.C]);
			expect(sequence).toHaveProperty('beats');
			expect(sequence).toHaveProperty('startPosition');
			expect(sequence).toHaveProperty('length');
			expect(sequence.length).toBe(3); // Actual sequence length
			expect(sequence.beats.length).toBe(3);
			expect(sequence.startPosition).toBe(null);

			sequence.beats.forEach((beat) => {
				expect(beat).toHaveProperty('id');
				expect(beat).toHaveProperty('beatNumber');
				expect(beat).toHaveProperty('pictographData');
				expect(beat.pictographData).toHaveProperty('letter');
			});
		});

		it('should create test sequence with start position', async () => {
			const sequence = await createTestSequence([Letter.A, Letter.B], true);
			expect(sequence.length).toBe(2); // Actual sequence length (excludes start position)
			expect(sequence.beats.length).toBe(2);
			expect(sequence.startPosition).toBeTruthy();
			expect(sequence.startPosition?.id).toBe('start-position');
			expect(sequence.startPosition?.pictographData.isStartPosition).toBe(true);
		});

		it('should get random test pictographs', async () => {
			const randomPictographs = await getRandomTestPictographs(3);
			expect(Array.isArray(randomPictographs)).toBe(true);
			expect(randomPictographs.length).toBeLessThanOrEqual(3);
			expect(randomPictographs.length).toBeGreaterThan(0);
		});
	});
});
