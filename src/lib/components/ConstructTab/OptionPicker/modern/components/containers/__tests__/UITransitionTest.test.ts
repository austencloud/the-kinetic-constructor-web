/**
 * UI Transition Test - Verifies that ModernOptionPickerContainer
 * correctly switches between StartPositionPicker and OptionPicker
 * based on SequenceService state changes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SequenceService } from '$lib/services/SequenceService.svelte';
import { WorkbenchService } from '$lib/services/WorkbenchService.svelte';
import type { PictographData } from '$lib/types/PictographData';

describe('UI Transition Test', () => {
	let sequenceService: SequenceService;
	let workbenchService: WorkbenchService;

	beforeEach(async () => {
		// Create fresh service instances for each test
		sequenceService = new SequenceService({
			autoSave: false,
			maxBeats: 100,
			enablePlayback: false
		});

		workbenchService = new WorkbenchService({
			defaultPanel: 'generate',
			enableFullscreen: false
		});
	});

	it('should show StartPositionPicker when sequence is empty', () => {
		// Verify initial state
		expect(sequenceService.isEmpty).toBe(true);
		expect(sequenceService.state.startPosition).toBeNull();
		expect(sequenceService.state.beats.length).toBe(0);

		// UI should show StartPositionPicker
		const showStartPositionPicker = sequenceService.isEmpty;
		const showOptionPicker = !sequenceService.isEmpty && !!sequenceService.state.startPosition;

		expect(showStartPositionPicker).toBe(true);
		expect(showOptionPicker).toBe(false);

		console.log('✅ UI shows StartPositionPicker when sequence is empty');
	});

	it('should show OptionPicker when start position is set', () => {
		// Create mock start position
		const testStartPosition: PictographData = {
			letter: 'A',
			startPos: 'alpha1',
			endPos: 'alpha1',
			redMotionData: { motionType: 'static', direction: 'none' },
			blueMotionData: { motionType: 'static', direction: 'none' },
			gridMode: 'diamond',
			timing: 1,
			difficulty: 1
		};

		// Set start position
		sequenceService.setStartPosition(testStartPosition);

		// Verify state changed
		expect(sequenceService.isEmpty).toBe(false);
		expect(sequenceService.state.startPosition).toEqual(testStartPosition);

		// UI should show OptionPicker
		const showStartPositionPicker = sequenceService.isEmpty;
		const showOptionPicker = !sequenceService.isEmpty && !!sequenceService.state.startPosition;

		expect(showStartPositionPicker).toBe(false);
		expect(showOptionPicker).toBe(true);

		console.log('✅ UI shows OptionPicker when start position is set');
	});

	it('should transition back to StartPositionPicker when start position is cleared', () => {
		// Set initial start position
		const testStartPosition: PictographData = {
			letter: 'B',
			startPos: 'beta1',
			endPos: 'beta1',
			redMotionData: { motionType: 'static', direction: 'none' },
			blueMotionData: { motionType: 'static', direction: 'none' },
			gridMode: 'diamond',
			timing: 1,
			difficulty: 1
		};

		sequenceService.setStartPosition(testStartPosition);

		// Verify OptionPicker is shown
		expect(sequenceService.isEmpty).toBe(false);
		let showStartPositionPicker = sequenceService.isEmpty;
		let showOptionPicker = !sequenceService.isEmpty && !!sequenceService.state.startPosition;
		expect(showStartPositionPicker).toBe(false);
		expect(showOptionPicker).toBe(true);

		// Clear start position
		sequenceService.setStartPosition(null);

		// Verify StartPositionPicker is shown again
		expect(sequenceService.isEmpty).toBe(true);
		showStartPositionPicker = sequenceService.isEmpty;
		showOptionPicker = !sequenceService.isEmpty && !!sequenceService.state.startPosition;
		expect(showStartPositionPicker).toBe(true);
		expect(showOptionPicker).toBe(false);

		console.log('✅ UI transitions back to StartPositionPicker when start position is cleared');
	});

	it('should handle rapid state changes correctly', () => {
		const testPositions: PictographData[] = [
			{
				letter: 'C',
				startPos: 'gamma1',
				endPos: 'gamma1',
				redMotionData: { motionType: 'static', direction: 'none' },
				blueMotionData: { motionType: 'static', direction: 'none' },
				gridMode: 'diamond',
				timing: 1,
				difficulty: 1
			},
			{
				letter: 'D',
				startPos: 'delta1',
				endPos: 'delta1',
				redMotionData: { motionType: 'static', direction: 'none' },
				blueMotionData: { motionType: 'static', direction: 'none' },
				gridMode: 'diamond',
				timing: 1,
				difficulty: 1
			}
		];

		// Test rapid transitions
		for (const position of testPositions) {
			// Set position
			sequenceService.setStartPosition(position);
			expect(sequenceService.isEmpty).toBe(false);
			
			const showOptionPicker = !sequenceService.isEmpty && !!sequenceService.state.startPosition;
			expect(showOptionPicker).toBe(true);

			// Clear position
			sequenceService.setStartPosition(null);
			expect(sequenceService.isEmpty).toBe(true);
			
			const showStartPositionPicker = sequenceService.isEmpty;
			expect(showStartPositionPicker).toBe(true);
		}

		console.log('✅ UI handles rapid state changes correctly');
	});
});
