/**
 * Integration Test for Start Position Selection Flow
 * Tests the complete flow from StartPositionPicker to OptionPicker
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SequenceService } from '$lib/services/SequenceService.svelte';
import type { PictographData } from '$lib/types/PictographData';

describe('Start Position Integration Test', () => {
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
			leadState: 'leading',
			prefloatMotionType: 'static',
			prefloatPropRotDir: 'cw'
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
			leadState: 'leading',
			prefloatMotionType: 'static',
			prefloatPropRotDir: 'cw'
		},
		redPropData: null,
		bluePropData: null,
		redArrowData: null,
		blueArrowData: null
	});

	describe('Complete Integration Flow', () => {
		it('should handle the complete start position selection workflow', () => {
			// Step 1: Initial state - sequence is empty
			expect(sequenceService.isEmpty).toBe(true);
			expect(sequenceService.state.startPosition).toBeNull();
			console.log('✅ Step 1: Initial state verified - sequence is empty');

			// Step 2: User selects a start position (simulating StartPositionPicker click)
			const startPosition = createMockStartPosition();
			sequenceService.setStartPosition(startPosition);
			console.log('✅ Step 2: Start position set in SequenceService');

			// Step 3: Verify state changes
			expect(sequenceService.isEmpty).toBe(false);
			expect(sequenceService.state.startPosition).toEqual(startPosition);
			console.log('✅ Step 3: SequenceService state updated correctly');

			// Step 4: Verify this would trigger UI transition
			// In the real app, this isEmpty change would cause TransitionWrapper to switch views
			const shouldShowStartPosPicker = sequenceService.isEmpty;
			const shouldShowOptionPicker = !sequenceService.isEmpty;
			
			expect(shouldShowStartPosPicker).toBe(false);
			expect(shouldShowOptionPicker).toBe(true);
			console.log('✅ Step 4: UI transition logic verified');

			// Step 5: Verify StartPosBeat would receive the correct data
			// This simulates what the BeatFrame/StartPosBeat component should receive
			const startPosBeatData = {
				id: 'start-position',
				beatNumber: 0,
				filled: !!sequenceService.state.startPosition,
				pictographData: sequenceService.state.startPosition
			};

			expect(startPosBeatData.filled).toBe(true);
			expect(startPosBeatData.pictographData).toEqual(startPosition);
			console.log('✅ Step 5: StartPosBeat data flow verified');

			console.log('🎉 Complete integration test passed!');
		});

		it('should handle clearing start position', () => {
			// Set a start position first
			const startPosition = createMockStartPosition();
			sequenceService.setStartPosition(startPosition);
			expect(sequenceService.isEmpty).toBe(false);

			// Clear the start position
			sequenceService.setStartPosition(null);
			
			// Should return to empty state
			expect(sequenceService.isEmpty).toBe(true);
			expect(sequenceService.state.startPosition).toBeNull();
			
			// UI should transition back to StartPositionPicker
			const shouldShowStartPosPicker = sequenceService.isEmpty;
			expect(shouldShowStartPosPicker).toBe(true);
			
			console.log('✅ Start position clearing workflow verified');
		});

		it('should handle start position with beats', () => {
			// Set start position
			const startPosition = createMockStartPosition();
			sequenceService.setStartPosition(startPosition);
			expect(sequenceService.isEmpty).toBe(false);

			// Add a beat
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
			
			// Should still not be empty (has both start position and beats)
			expect(sequenceService.isEmpty).toBe(false);
			expect(sequenceService.state.beats.length).toBe(1);
			expect(sequenceService.state.startPosition).toEqual(startPosition);

			// Clear start position but keep beat
			sequenceService.setStartPosition(null);
			
			// Should still not be empty (has beats)
			expect(sequenceService.isEmpty).toBe(false);
			expect(sequenceService.state.startPosition).toBeNull();
			
			console.log('✅ Start position with beats workflow verified');
		});
	});

	describe('Event System Integration', () => {
		it('should emit all required events during start position selection', () => {
			const events: string[] = [];

			// Listen to all events
			sequenceService.on('startPosition:changed', () => events.push('startPosition:changed'));
			sequenceService.on('sequence:changed', () => events.push('sequence:changed'));

			// Set start position
			const startPosition = createMockStartPosition();
			sequenceService.setStartPosition(startPosition);

			// Verify events were emitted
			expect(events).toContain('startPosition:changed');
			expect(events).toContain('sequence:changed');
			
			console.log('✅ Event system integration verified');
		});
	});

	describe('UI Component Integration Simulation', () => {
		it('should simulate the complete UI component interaction flow', () => {
			// Simulate RightPanel checking if sequence is empty
			const isSequenceEmpty = () => sequenceService.isEmpty;
			
			// Initially empty - should show StartPositionPicker
			expect(isSequenceEmpty()).toBe(true);
			console.log('✅ RightPanel would show StartPositionPicker');

			// Simulate StartPositionPicker selection
			const startPosition = createMockStartPosition();
			sequenceService.setStartPosition(startPosition);

			// Now not empty - should show OptionPicker
			expect(isSequenceEmpty()).toBe(false);
			console.log('✅ RightPanel would show OptionPicker');

			// Simulate StartPosBeat getting data
			const startPosBeatData = {
				pictographData: sequenceService.state.startPosition,
				filled: !!sequenceService.state.startPosition
			};

			expect(startPosBeatData.filled).toBe(true);
			expect(startPosBeatData.pictographData?.letter).toBe('α1');
			console.log('✅ StartPosBeat would render pictograph correctly');

			console.log('🎉 Complete UI component simulation passed!');
		});
	});
});
