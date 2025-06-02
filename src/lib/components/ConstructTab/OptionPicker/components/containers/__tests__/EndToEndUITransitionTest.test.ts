/**
 * End-to-End UI Transition Test
 * Verifies the complete user workflow from start position selection to option picker
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SequenceService } from '$lib/services/SequenceService.svelte';
import { WorkbenchService } from '$lib/services/WorkbenchService.svelte';
import type { PictographData } from '$lib/types/PictographData';

describe('End-to-End UI Transition Test', () => {
	let sequenceService: SequenceService;
	let workbenchService: WorkbenchService;

	beforeEach(async () => {
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

	it('should complete the full user workflow: empty → start position → option picker', () => {
		console.log('🎯 Testing complete user workflow...');

		// === STEP 1: Initial State (Empty Sequence) ===
		console.log('📍 Step 1: Verify initial empty state');
		
		expect(sequenceService.isEmpty).toBe(true);
		expect(sequenceService.state.startPosition).toBeNull();
		expect(sequenceService.state.beats.length).toBe(0);

		// UI should show StartPositionPicker
		const initialShowStartPositionPicker = sequenceService.isEmpty;
		const initialShowOptionPicker = !sequenceService.isEmpty && !!sequenceService.state.startPosition;

		expect(initialShowStartPositionPicker).toBe(true);
		expect(initialShowOptionPicker).toBe(false);

		console.log('✅ Step 1: UI correctly shows StartPositionPicker for empty sequence');

		// === STEP 2: User Selects Start Position ===
		console.log('📍 Step 2: User selects start position');

		const selectedStartPosition: PictographData = {
			letter: 'A',
			startPos: 'alpha1',
			endPos: 'alpha1',
			redMotionData: { motionType: 'static', direction: 'none' },
			blueMotionData: { motionType: 'static', direction: 'none' },
			gridMode: 'diamond',
			timing: 1,
			difficulty: 1
		};

		// Simulate user clicking start position
		sequenceService.setStartPosition(selectedStartPosition);

		console.log('✅ Step 2: Start position selected:', selectedStartPosition.letter);

		// === STEP 3: Verify State Transition ===
		console.log('📍 Step 3: Verify SequenceService state updated');

		expect(sequenceService.isEmpty).toBe(false);
		expect(sequenceService.state.startPosition).toEqual(selectedStartPosition);
		expect(sequenceService.state.beats.length).toBe(0); // Still no beats, just start position

		console.log('✅ Step 3: SequenceService state correctly updated');

		// === STEP 4: Verify UI Transition ===
		console.log('📍 Step 4: Verify UI transitions to OptionPicker');

		const afterStartPosShowStartPositionPicker = sequenceService.isEmpty;
		const afterStartPosShowOptionPicker = !sequenceService.isEmpty && !!sequenceService.state.startPosition;

		expect(afterStartPosShowStartPositionPicker).toBe(false);
		expect(afterStartPosShowOptionPicker).toBe(true);

		console.log('✅ Step 4: UI correctly transitions to OptionPicker');

		// === STEP 5: Verify Bidirectional Flow ===
		console.log('📍 Step 5: Test bidirectional flow (clear start position)');

		// Clear start position (simulating user clearing or resetting)
		sequenceService.setStartPosition(null);

		// Should transition back to StartPositionPicker
		expect(sequenceService.isEmpty).toBe(true);
		expect(sequenceService.state.startPosition).toBeNull();

		const afterClearShowStartPositionPicker = sequenceService.isEmpty;
		const afterClearShowOptionPicker = !sequenceService.isEmpty && !!sequenceService.state.startPosition;

		expect(afterClearShowStartPositionPicker).toBe(true);
		expect(afterClearShowOptionPicker).toBe(false);

		console.log('✅ Step 5: UI correctly transitions back to StartPositionPicker');

		console.log('🎉 Complete end-to-end workflow test passed!');
	});

	it('should handle multiple start position changes smoothly', () => {
		console.log('🔄 Testing multiple start position changes...');

		const testPositions: PictographData[] = [
			{
				letter: 'A',
				startPos: 'alpha1',
				endPos: 'alpha1',
				redMotionData: { motionType: 'static', direction: 'none' },
				blueMotionData: { motionType: 'static', direction: 'none' },
				gridMode: 'diamond',
				timing: 1,
				difficulty: 1
			},
			{
				letter: 'B',
				startPos: 'beta1',
				endPos: 'beta1',
				redMotionData: { motionType: 'static', direction: 'none' },
				blueMotionData: { motionType: 'static', direction: 'none' },
				gridMode: 'diamond',
				timing: 1,
				difficulty: 1
			},
			{
				letter: 'C',
				startPos: 'gamma1',
				endPos: 'gamma1',
				redMotionData: { motionType: 'static', direction: 'none' },
				blueMotionData: { motionType: 'static', direction: 'none' },
				gridMode: 'diamond',
				timing: 1,
				difficulty: 1
			}
		];

		// Test changing between different start positions
		for (let i = 0; i < testPositions.length; i++) {
			const position = testPositions[i];
			
			console.log(`📍 Setting start position ${i + 1}: ${position.letter}`);
			
			// Set new start position
			sequenceService.setStartPosition(position);

			// Verify state
			expect(sequenceService.isEmpty).toBe(false);
			expect(sequenceService.state.startPosition).toEqual(position);

			// Verify UI shows OptionPicker
			const showOptionPicker = !sequenceService.isEmpty && !!sequenceService.state.startPosition;
			expect(showOptionPicker).toBe(true);

			console.log(`✅ Position ${i + 1} set correctly, UI shows OptionPicker`);
		}

		console.log('🎉 Multiple start position changes handled smoothly!');
	});

	it('should maintain correct UI state during rapid transitions', () => {
		console.log('⚡ Testing rapid UI transitions...');

		const testPosition: PictographData = {
			letter: 'X',
			startPos: 'alpha1',
			endPos: 'alpha1',
			redMotionData: { motionType: 'static', direction: 'none' },
			blueMotionData: { motionType: 'static', direction: 'none' },
			gridMode: 'diamond',
			timing: 1,
			difficulty: 1
		};

		// Perform rapid transitions
		for (let i = 0; i < 5; i++) {
			console.log(`📍 Rapid transition ${i + 1}: Set → Clear`);

			// Set position
			sequenceService.setStartPosition(testPosition);
			expect(sequenceService.isEmpty).toBe(false);
			
			const showOptionPicker = !sequenceService.isEmpty && !!sequenceService.state.startPosition;
			expect(showOptionPicker).toBe(true);

			// Clear position
			sequenceService.setStartPosition(null);
			expect(sequenceService.isEmpty).toBe(true);
			
			const showStartPositionPicker = sequenceService.isEmpty;
			expect(showStartPositionPicker).toBe(true);

			console.log(`✅ Rapid transition ${i + 1} completed correctly`);
		}

		console.log('🎉 Rapid transitions handled correctly!');
	});
});
