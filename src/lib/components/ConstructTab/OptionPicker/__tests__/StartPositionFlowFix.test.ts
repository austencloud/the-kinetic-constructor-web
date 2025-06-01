/**
 * Test for Start Position Selection Flow Fix
 * Verifies that the nuclear rebuild fixes work correctly
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SequenceService } from '$lib/services/SequenceService.svelte';
import type { PictographData } from '$lib/types/PictographData';

describe('Start Position Selection Flow Fix', () => {
	let sequenceService: SequenceService;

	beforeEach(() => {
		sequenceService = new SequenceService();
	});

	const createMockStartPosition = (): PictographData => ({
		letter: 'α1' as any,
		startPos: 'alpha1' as any,
		endPos: 'alpha1' as any,
		timing: null,
		direction: null,
		gridMode: 'diamond',
		gridData: null,
		isStartPosition: true,
		redMotionData: {
			id: 'red-motion-1',
			color: 'red',
			motionType: 'static',
			startLoc: 'alpha1' as any,
			endLoc: 'alpha1' as any,
			startOri: 'in',
			endOri: 'in',
			turns: 0,
			propRotDir: 'cw',
			handRotDir: 'cw_shift',
			leadState: 'leading'
		},
		blueMotionData: {
			id: 'blue-motion-1',
			color: 'blue',
			motionType: 'static',
			startLoc: 'alpha1' as any,
			endLoc: 'alpha1' as any,
			startOri: 'in',
			endOri: 'in',
			turns: 0,
			propRotDir: 'cw',
			handRotDir: 'cw_shift',
			leadState: 'leading'
		},
		redPropData: null,
		bluePropData: null,
		redArrowData: null,
		blueArrowData: null
	});

	describe('Problem 1: Start Position Display Not Updating', () => {
		it('should update isEmpty state when start position is set', () => {
			// Initially empty
			expect(sequenceService.isEmpty).toBe(true);
			expect(sequenceService.state.startPosition).toBeNull();

			// Set start position
			const startPosition = createMockStartPosition();
			sequenceService.setStartPosition(startPosition);

			// Should no longer be empty
			expect(sequenceService.isEmpty).toBe(false);
			expect(sequenceService.state.startPosition).toEqual(startPosition);
		});

		it('should emit startPosition:changed event when start position is set', () => {
			const startPositionChangedSpy = vi.fn();
			sequenceService.on('startPosition:changed', startPositionChangedSpy);

			const startPosition = createMockStartPosition();
			sequenceService.setStartPosition(startPosition);

			expect(startPositionChangedSpy).toHaveBeenCalledWith({
				startPosition
			});
		});

		it('should emit sequence:changed event when start position is set', () => {
			const sequenceChangedSpy = vi.fn();
			sequenceService.on('sequence:changed', sequenceChangedSpy);

			const startPosition = createMockStartPosition();
			sequenceService.setStartPosition(startPosition);

			expect(sequenceChangedSpy).toHaveBeenCalledWith({
				beats: [],
				startPosition
			});
		});
	});

	describe('Problem 2: UI Flow Not Transitioning', () => {
		it('should transition from empty to non-empty when start position is added', () => {
			// Track isEmpty state changes
			const isEmptyStates: boolean[] = [];

			// Initial state
			isEmptyStates.push(sequenceService.isEmpty);

			// Set start position
			const startPosition = createMockStartPosition();
			sequenceService.setStartPosition(startPosition);
			isEmptyStates.push(sequenceService.isEmpty);

			// Should transition from true to false
			expect(isEmptyStates).toEqual([true, false]);
		});

		it('should transition back to empty when start position is cleared', () => {
			// Set start position first
			const startPosition = createMockStartPosition();
			sequenceService.setStartPosition(startPosition);
			expect(sequenceService.isEmpty).toBe(false);

			// Clear start position
			sequenceService.setStartPosition(null);
			expect(sequenceService.isEmpty).toBe(true);
		});

		it('should remain non-empty when beats are added even without start position', () => {
			// Add a beat without start position
			const mockBeat = {
				id: 'beat-1',
				beatNumber: 1,
				filled: true,
				pictographData: createMockStartPosition(),
				blueMotionData: null,
				redMotionData: null,
				metadata: {
					blueReversal: false,
					redReversal: false,
					tags: []
				}
			};

			sequenceService.addBeat(mockBeat);
			expect(sequenceService.isEmpty).toBe(false);
		});
	});

	describe('Integration: Complete Start Position Flow', () => {
		it('should handle complete start position selection workflow', () => {
			const events: string[] = [];

			// Listen to all relevant events
			sequenceService.on('startPosition:changed', () => events.push('startPosition:changed'));
			sequenceService.on('sequence:changed', () => events.push('sequence:changed'));

			// Initial state
			expect(sequenceService.isEmpty).toBe(true);
			expect(sequenceService.state.startPosition).toBeNull();

			// User selects start position (simulating StartPositionPicker)
			const startPosition = createMockStartPosition();
			sequenceService.setStartPosition(startPosition);

			// Verify state changes
			expect(sequenceService.isEmpty).toBe(false);
			expect(sequenceService.state.startPosition).toEqual(startPosition);

			// Verify events were emitted
			expect(events).toContain('startPosition:changed');
			expect(events).toContain('sequence:changed');

			// This should trigger UI transition from StartPosPicker to OptionPicker
			console.log('✅ Start position flow completed successfully');
		});

		it('should verify UI transition logic works correctly', () => {
			// Test the exact logic used by TransitionWrapper

			// Initially empty - should show StartPosPicker
			expect(sequenceService.isEmpty).toBe(true);

			// Set start position
			const startPosition = createMockStartPosition();
			sequenceService.setStartPosition(startPosition);

			// Should no longer be empty - should show OptionPicker
			expect(sequenceService.isEmpty).toBe(false);

			// Clear start position
			sequenceService.setStartPosition(null);

			// Should be empty again - should show StartPosPicker
			expect(sequenceService.isEmpty).toBe(true);

			console.log('✅ UI transition logic verified');
		});
	});
});
