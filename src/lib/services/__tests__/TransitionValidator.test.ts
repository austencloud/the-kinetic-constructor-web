/**
 * TransitionValidator Test Suite
 * Tests contextual filtering logic for pictograph transitions
 * Uses mock data for unit testing
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
	TransitionValidator,
	getValidTransitions,
	isValidTransition
} from '../TransitionValidator';
import type { PictographData } from '$lib/types/PictographData';

describe('TransitionValidator', () => {
	let validator: TransitionValidator;
	let testStartPosition: PictographData;

	beforeAll(() => {
		validator = TransitionValidator.getInstance();

		// Create a mock test start position
		testStartPosition = {
			letter: 'A',
			startPos: 'alpha1',
			endPos: 'beta5',
			timing: 'split',
			direction: 'same',
			gridMode: 'diamond',
			blueMotionData: {
				motionType: 'pro',
				startLoc: 'n',
				endLoc: 's',
				startOri: 'in',
				endOri: 'out',
				turns: 1,
				propRotDir: 'cw'
			},
			redMotionData: {
				motionType: 'anti',
				startLoc: 'e',
				endLoc: 'w',
				startOri: 'clock',
				endOri: 'counter',
				turns: 1,
				propRotDir: 'ccw'
			},
			gridData: null,
			redPropData: null,
			bluePropData: null,
			redArrowData: null,
			blueArrowData: null,
			grid: ''
		};
	});

	describe('Singleton Pattern', () => {
		it('should return the same instance', () => {
			const instance1 = TransitionValidator.getInstance();
			const instance2 = TransitionValidator.getInstance();
			expect(instance1).toBe(instance2);
		});
	});

	describe('getValidTransitions', () => {
		it('should return valid transitions for a start position', async () => {
			const result = await validator.getValidTransitions(testStartPosition);

			expect(result).toBeDefined();
			expect(result.validTransitions).toBeInstanceOf(Array);
			expect(result.totalFound).toBeGreaterThanOrEqual(0);
			expect(result.filteredCount).toBeGreaterThanOrEqual(0);
			expect(result.errors).toBeInstanceOf(Array);
			expect(result.warnings).toBeInstanceOf(Array);
		});

		it('should handle start position without end position', async () => {
			const invalidStartPosition = {
				...testStartPosition,
				endPos: null
			};

			const result = await validator.getValidTransitions(invalidStartPosition);

			expect(result.isValid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.validTransitions).toHaveLength(0);
		});
	});

	describe('isValidTransition', () => {
		it('should reject invalid transitions', async () => {
			// Create an invalid transition (wrong start position)
			const invalidTransition = {
				...testStartPosition,
				startPos: 'invalid_position',
				letter: 'X'
			};

			const isValid = await validator.isValidTransition(testStartPosition, invalidTransition);
			expect(isValid).toBe(false);
		});
	});

	describe('Convenience Functions', () => {
		it('should provide working convenience functions', async () => {
			const result = await getValidTransitions(testStartPosition);
			expect(result).toBeDefined();
			expect(result.validTransitions).toBeInstanceOf(Array);
		});
	});
});
