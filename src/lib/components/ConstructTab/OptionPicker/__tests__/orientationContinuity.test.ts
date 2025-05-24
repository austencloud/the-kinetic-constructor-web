/**
 * Test suite for OptionPicker orientation continuity
 * Verifies that options display with starting orientations that match
 * the ending orientations from the previous beat in the sequence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PictographData } from '$lib/types/PictographData';
import type { MotionData } from '$lib/components/objects/Motion/MotionData';
import { getNextOptions } from '../services/OptionsService';
import { MotionOriCalculator } from '$lib/components/objects/Motion/MotionOriCalculator';

// Mock the pictograph data service
vi.mock('$lib/state/pictograph/pictographDataState.svelte', () => ({
	pictographData: {
		isInitialized: true,
		isEmpty: false,
		data: [
			// Mock pictographs with different starting orientations
			{
				letter: 'A',
				startPos: 'alpha1',
				endPos: 'beta5',
				gridMode: 'diamond',
				timing: null,
				direction: null,
				gridData: null,
				redPropData: null,
				bluePropData: null,
				redArrowData: null,
				blueArrowData: null,
				grid: '',
				blueMotionData: {
					id: 'blue1',
					motionType: 'pro',
					startLoc: 'n',
					endLoc: 's',
					startOri: 'in',
					endOri: 'clock',
					propRotDir: 'cw',
					color: 'blue',
					turns: 1,
					leadState: 'leading',
					prefloatMotionType: null,
					prefloatPropRotDir: null
				} as MotionData,
				redMotionData: {
					id: 'red1',
					motionType: 'anti',
					startLoc: 'n',
					endLoc: 's',
					startOri: 'in',
					endOri: 'counter',
					propRotDir: 'ccw',
					color: 'red',
					turns: 1,
					leadState: 'trailing',
					prefloatMotionType: null,
					prefloatPropRotDir: null
				} as MotionData
			},
			{
				letter: 'B',
				startPos: 'alpha1',
				endPos: 'gamma11',
				gridMode: 'diamond',
				timing: null,
				direction: null,
				gridData: null,
				redPropData: null,
				bluePropData: null,
				redArrowData: null,
				blueArrowData: null,
				grid: '',
				blueMotionData: {
					id: 'blue2',
					motionType: 'static',
					startLoc: 'n',
					endLoc: 'n',
					startOri: 'clock',
					endOri: 'clock',
					propRotDir: 'no_rot',
					color: 'blue',
					turns: 0,
					leadState: 'leading',
					prefloatMotionType: null,
					prefloatPropRotDir: null
				} as MotionData,
				redMotionData: {
					id: 'red2',
					motionType: 'static',
					startLoc: 'n',
					endLoc: 'n',
					startOri: 'counter',
					endOri: 'counter',
					propRotDir: 'no_rot',
					color: 'red',
					turns: 0,
					leadState: 'trailing',
					prefloatMotionType: null,
					prefloatPropRotDir: null
				} as MotionData
			},
			{
				letter: 'C',
				startPos: 'alpha1',
				endPos: 'beta5',
				gridMode: 'diamond',
				timing: null,
				direction: null,
				gridData: null,
				redPropData: null,
				bluePropData: null,
				redArrowData: null,
				blueArrowData: null,
				grid: '',
				blueMotionData: {
					id: 'blue3',
					motionType: 'pro',
					startLoc: 'n',
					endLoc: 's',
					startOri: 'out',
					endOri: 'counter',
					propRotDir: 'cw',
					color: 'blue',
					turns: 1,
					leadState: 'leading',
					prefloatMotionType: null,
					prefloatPropRotDir: null
				} as MotionData,
				redMotionData: {
					id: 'red3',
					motionType: 'anti',
					startLoc: 'n',
					endLoc: 's',
					startOri: 'out',
					endOri: 'clock',
					propRotDir: 'ccw',
					color: 'red',
					turns: 1,
					leadState: 'trailing',
					prefloatMotionType: null,
					prefloatPropRotDir: null
				} as MotionData
			}
		]
	}
}));

describe('OptionPicker Orientation Continuity', () => {
	beforeEach(() => {
		// Clear any console logs
		vi.clearAllMocks();
	});

	it('should return options with starting orientations matching the end orientations of the last beat', () => {
		// Create a sequence with a beat that ends with specific orientations
		const lastBeat: PictographData = {
			letter: 'X',
			startPos: 'alpha1',
			endPos: 'alpha1',
			gridMode: 'diamond',
			timing: null,
			direction: null,
			gridData: null,
			redPropData: null,
			bluePropData: null,
			redArrowData: null,
			blueArrowData: null,
			grid: '',
			blueMotionData: {
				id: 'blue_last',
				motionType: 'pro',
				startLoc: 'n',
				endLoc: 'n',
				startOri: 'in',
				endOri: 'clock', // This should be the starting orientation for next options
				propRotDir: 'cw',
				color: 'blue',
				turns: 1,
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			} as MotionData,
			redMotionData: {
				id: 'red_last',
				motionType: 'anti',
				startLoc: 'n',
				endLoc: 'n',
				startOri: 'in',
				endOri: 'counter', // This should be the starting orientation for next options
				propRotDir: 'ccw',
				color: 'red',
				turns: 1,
				leadState: 'trailing',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			} as MotionData
		};

		// Calculate expected end orientations using MotionOriCalculator
		const blueCalculator = new MotionOriCalculator(lastBeat.blueMotionData);
		const redCalculator = new MotionOriCalculator(lastBeat.redMotionData);

		const expectedBlueEndOri = blueCalculator.calculateEndOri();
		const expectedRedEndOri = redCalculator.calculateEndOri();

		console.log('Test: Expected orientations from MotionOriCalculator:', {
			blue: expectedBlueEndOri,
			red: expectedRedEndOri
		});

		// Get next options using the original beat (let getNextOptions calculate orientations)
		const sequence = [lastBeat];

		console.log('Test: Using last beat:', {
			startPos: lastBeat.startPos,
			endPos: lastBeat.endPos,
			blueStartOri: lastBeat.blueMotionData?.startOri,
			redStartOri: lastBeat.redMotionData?.startOri
		});

		const options = getNextOptions(sequence);

		console.log('Test: Found options:', options.length);
		console.log('Test: First option orientations:', {
			blue: options[0]?.blueMotionData?.startOri,
			red: options[0]?.redMotionData?.startOri
		});

		// Verify that we got some options
		expect(options.length).toBeGreaterThan(0);

		// The options should have starting orientations that match the calculated ending orientations
		// Note: We need to use the actual calculated values, not the stored endOri values
		const actualBlueEndOri = blueCalculator.calculateEndOri();
		const actualRedEndOri = redCalculator.calculateEndOri();

		console.log('Test: Actual calculated orientations:', {
			blue: actualBlueEndOri,
			red: actualRedEndOri
		});

		// Verify that the options have the correct starting orientations
		options.forEach((option, index) => {
			if (option.blueMotionData) {
				expect(option.blueMotionData.startOri).toBe(actualBlueEndOri);
				console.log(
					`Test: Option ${index} blue startOri: ${option.blueMotionData.startOri} (expected: ${actualBlueEndOri})`
				);
			}
			if (option.redMotionData) {
				expect(option.redMotionData.startOri).toBe(actualRedEndOri);
				console.log(
					`Test: Option ${index} red startOri: ${option.redMotionData.startOri} (expected: ${actualRedEndOri})`
				);
			}
		});
	});

	it('should handle start positions correctly (no orientation constraints)', () => {
		// Create a start position (sequence with only one element)
		const startPosition: PictographData = {
			letter: null,
			startPos: 'alpha1',
			endPos: 'alpha1',
			gridMode: 'diamond',
			timing: null,
			direction: null,
			gridData: null,
			redPropData: null,
			bluePropData: null,
			redArrowData: null,
			blueArrowData: null,
			grid: '',
			blueMotionData: null,
			redMotionData: null,
			isStartPosition: true
		};

		const sequence = [startPosition];
		const options = getNextOptions(sequence);

		// For start positions, we should get all options that start from that position
		// without orientation constraints
		expect(options.length).toBeGreaterThan(0);

		// All options should start from the same position
		options.forEach((option) => {
			expect(option.startPos).toBe('alpha1');
		});
	});

	it('should calculate orientations correctly for complex motion types', () => {
		// Test with a beat that has half-turn motions (more complex orientation calculation)
		const complexBeat: PictographData = {
			letter: null,
			startPos: 'alpha1',
			endPos: 'alpha1',
			gridMode: 'diamond',
			timing: null,
			direction: null,
			gridData: null,
			redPropData: null,
			bluePropData: null,
			redArrowData: null,
			blueArrowData: null,
			grid: '',
			blueMotionData: {
				id: 'blue_complex',
				motionType: 'pro',
				startLoc: 'n',
				endLoc: 'n',
				startOri: 'in',
				endOri: 'in', // This will be recalculated
				propRotDir: 'cw',
				color: 'blue',
				turns: 0.5, // Half turn - should change orientation
				leadState: 'leading',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			} as MotionData,
			redMotionData: {
				id: 'red_complex',
				motionType: 'anti',
				startLoc: 'n',
				endLoc: 'n',
				startOri: 'out',
				endOri: 'out', // This will be recalculated
				propRotDir: 'ccw',
				color: 'red',
				turns: 0.5, // Half turn - should change orientation
				leadState: 'trailing',
				prefloatMotionType: null,
				prefloatPropRotDir: null
			} as MotionData
		};

		// Calculate expected orientations
		const blueCalculator = new MotionOriCalculator(complexBeat.blueMotionData);
		const redCalculator = new MotionOriCalculator(complexBeat.redMotionData);

		const expectedBlueEndOri = blueCalculator.calculateEndOri();
		const expectedRedEndOri = redCalculator.calculateEndOri();

		console.log('Test: Complex motion expected orientations:', {
			blue: expectedBlueEndOri,
			red: expectedRedEndOri
		});

		// Get next options using the original beat (let getNextOptions calculate orientations)
		const sequence = [complexBeat];
		const options = getNextOptions(sequence);

		// Verify orientations match the actual calculated values
		const actualBlueEndOri = blueCalculator.calculateEndOri();
		const actualRedEndOri = redCalculator.calculateEndOri();

		console.log('Test: Actual calculated complex orientations:', {
			blue: actualBlueEndOri,
			red: actualRedEndOri
		});

		expect(options.length).toBeGreaterThan(0);

		options.forEach((option) => {
			if (option.blueMotionData) {
				expect(option.blueMotionData.startOri).toBe(actualBlueEndOri);
			}
			if (option.redMotionData) {
				expect(option.redMotionData.startOri).toBe(actualRedEndOri);
			}
		});
	});
});
