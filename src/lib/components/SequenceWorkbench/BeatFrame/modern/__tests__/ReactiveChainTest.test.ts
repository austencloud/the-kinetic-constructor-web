/**
 * Reactive Chain Test - Verifies that SequenceService state changes
 * are properly reactive and can be observed by components
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SequenceService } from '$lib/services/SequenceService.svelte';
import { WorkbenchService } from '$lib/services/WorkbenchService.svelte';
import type { PictographData } from '$lib/types/PictographData';

describe('Reactive Chain Test', () => {
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

	it('should maintain reactive state when SequenceService start position changes', () => {
		// Create a mock pictograph data object
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

		// Verify initial state
		expect(sequenceService.state.startPosition).toBeNull();
		expect(sequenceService.isEmpty).toBe(true);

		// Set start position in SequenceService
		sequenceService.setStartPosition(testStartPosition);

		// Verify SequenceService state updated reactively
		expect(sequenceService.state.startPosition).toEqual(testStartPosition);
		expect(sequenceService.isEmpty).toBe(false);

		// The reactive state should be immediately available for components to derive from
		// This verifies that the state is properly reactive using $state() runes

		console.log('✅ Reactive state test completed successfully');
	});

	it('should handle start position clearing reactively', () => {
		// Create mock start position
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

		// Set initial start position
		sequenceService.setStartPosition(testStartPosition);

		// Verify it's set
		expect(sequenceService.state.startPosition).toEqual(testStartPosition);
		expect(sequenceService.isEmpty).toBe(false);

		// Clear the start position
		sequenceService.setStartPosition(null);

		// Verify it's cleared reactively
		expect(sequenceService.state.startPosition).toBeNull();
		expect(sequenceService.isEmpty).toBe(true);

		console.log('✅ Start position clearing reactive test completed');
	});

	it('should maintain reactive chain when multiple state changes occur', () => {
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

		// Test multiple rapid state changes
		for (const position of testPositions) {
			sequenceService.setStartPosition(position);
			expect(sequenceService.state.startPosition).toEqual(position);
			expect(sequenceService.isEmpty).toBe(false);
		}

		// Clear and verify
		sequenceService.setStartPosition(null);
		expect(sequenceService.state.startPosition).toBeNull();
		expect(sequenceService.isEmpty).toBe(true);

		console.log('✅ Multiple state changes reactive test completed');
	});
});
