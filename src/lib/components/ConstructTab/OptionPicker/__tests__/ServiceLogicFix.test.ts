/**
 * Test for the service logic fixes - start position and clear sequence
 * Focus on SequenceService logic without component rendering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SequenceService } from '$lib/services/SequenceService.svelte';
import type { PictographData } from '$lib/types/PictographData';

describe('SequenceService Logic Fixes', () => {
	let sequenceService: SequenceService;
	let mockStartPosition: PictographData;

	beforeEach(() => {
		// Create a fresh sequence service for each test
		sequenceService = new SequenceService();

		// Create a mock start position
		mockStartPosition = {
			letter: 'α1',
			startPos: 'n',
			endPos: 'n',
			grid: 'diamond',
			redPropData: {
				prop: 'staff',
				hand: 'right',
				location: 'n'
			},
			bluePropData: {
				prop: 'staff',
				hand: 'left',
				location: 'n'
			},
			redMotionData: {
				motionType: 'static',
				startOri: 'in',
				endOri: 'in',
				location: 'n'
			},
			blueMotionData: {
				motionType: 'static',
				startOri: 'in',
				endOri: 'in',
				location: 'n'
			}
		} as PictographData;

		// Clear any previous state
		sequenceService.clearSequence();
	});

	describe('Start Position Single-Click Fix', () => {
		it('should set start position immediately without intermediate states', () => {
			// Verify initial state
			expect(sequenceService.state.startPosition).toBeNull();
			expect(sequenceService.isEmpty).toBe(true);
			expect(sequenceService.state.beats).toHaveLength(0);

			// Act: Set start position directly (simulating what StartPositionPicker does)
			sequenceService.setStartPosition(mockStartPosition);

			// Assert: Start position should be set immediately
			expect(sequenceService.state.startPosition).not.toBeNull();
			expect(sequenceService.state.startPosition?.letter).toBe('α1');
			expect(sequenceService.isEmpty).toBe(true); // Still empty because isEmpty only checks beats
			expect(sequenceService.state.beats).toHaveLength(0); // Still no beats
		});

		it('should not create empty beats when setting start position', () => {
			// Verify initial state - no beats
			expect(sequenceService.state.beats).toHaveLength(0);

			// Act: Set start position
			sequenceService.setStartPosition(mockStartPosition);

			// Assert: Should still have no beats (start position is separate from beats)
			expect(sequenceService.state.beats).toHaveLength(0);
			expect(sequenceService.isEmpty).toBe(true); // Still empty because isEmpty only checks beats
		});

		it('should emit startPosition:changed event when setting start position', () => {
			// Arrange: Set up event listener
			const eventSpy = vi.fn();
			sequenceService.on('startPosition:changed', eventSpy);

			// Act: Set start position
			sequenceService.setStartPosition(mockStartPosition);

			// Assert: Event should be emitted with correct data
			expect(eventSpy).toHaveBeenCalledWith({ startPosition: mockStartPosition });
		});

		it('should allow changing start position multiple times', () => {
			// Set initial start position
			sequenceService.setStartPosition(mockStartPosition);
			expect(sequenceService.state.startPosition?.letter).toBe('α1');

			// Create a different start position
			const newStartPosition = { ...mockStartPosition, letter: 'β2' };

			// Change start position
			sequenceService.setStartPosition(newStartPosition);

			// Assert: Should update to new start position
			expect(sequenceService.state.startPosition?.letter).toBe('β2');
			expect(sequenceService.state.beats).toHaveLength(0); // Still no beats
		});
	});

	describe('Clear Sequence Fix', () => {
		it('should clear sequence using modern SequenceService', () => {
			// Arrange: Set up some state to clear
			sequenceService.setStartPosition(mockStartPosition);
			sequenceService.addBeats([
				{
					id: 'beat-1',
					beatNumber: 1,
					filled: true,
					pictographData: mockStartPosition,
					duration: 1,
					metadata: { blueReversal: false, redReversal: false, tags: [] }
				}
			]);

			// Verify we have state to clear
			expect(sequenceService.state.startPosition).not.toBeNull();
			expect(sequenceService.state.beats).toHaveLength(1);
			expect(sequenceService.isEmpty).toBe(false);

			// Act: Clear sequence
			sequenceService.clearSequence();

			// Assert: Sequence should be cleared
			expect(sequenceService.state.startPosition).toBeNull();
			expect(sequenceService.state.beats).toHaveLength(0);
			expect(sequenceService.isEmpty).toBe(true);
		});

		it('should emit sequence:cleared event when clearing', () => {
			// Arrange: Set up state and event listener
			sequenceService.setStartPosition(mockStartPosition);

			const eventSpy = vi.fn();
			sequenceService.on('sequence:cleared', eventSpy);

			// Act: Clear sequence
			sequenceService.clearSequence();

			// Assert: Event should be emitted
			expect(eventSpy).toHaveBeenCalledWith({});
		});

		it('should reset all sequence state when clearing', () => {
			// Arrange: Set up complex state
			sequenceService.setStartPosition(mockStartPosition);
			sequenceService.addBeats([
				{
					id: 'beat-1',
					beatNumber: 1,
					filled: true,
					pictographData: mockStartPosition,
					duration: 1,
					metadata: { blueReversal: false, redReversal: false, tags: [] }
				}
			]);
			sequenceService.selectBeat('beat-1');

			// Verify complex state
			expect(sequenceService.state.startPosition).not.toBeNull();
			expect(sequenceService.state.beats).toHaveLength(1);
			expect(sequenceService.state.selectedBeatIds).toContain('beat-1');
			expect(sequenceService.state.currentBeatIndex).toBe(0);

			// Act: Clear sequence
			sequenceService.clearSequence();

			// Assert: All state should be reset
			expect(sequenceService.state.startPosition).toBeNull();
			expect(sequenceService.state.beats).toHaveLength(0);
			expect(sequenceService.state.selectedBeatIds).toHaveLength(0);
			expect(sequenceService.state.currentBeatIndex).toBe(0);
			expect(sequenceService.state.playbackPosition).toBe(0);
			expect(sequenceService.state.isPlaying).toBe(false);
			expect(sequenceService.isEmpty).toBe(true);
		});
	});

	describe('Integration: Start Position + Clear Sequence', () => {
		it('should work together - set start position then clear it', () => {
			// Act 1: Set start position
			sequenceService.setStartPosition(mockStartPosition);

			// Verify start position is set
			expect(sequenceService.state.startPosition).not.toBeNull();
			expect(sequenceService.isEmpty).toBe(true); // Still empty because isEmpty only checks beats

			// Act 2: Clear sequence
			sequenceService.clearSequence();

			// Assert: Everything should be cleared
			expect(sequenceService.state.startPosition).toBeNull();
			expect(sequenceService.state.beats).toHaveLength(0);
			expect(sequenceService.isEmpty).toBe(true);
		});

		it('should maintain state consistency throughout operations', () => {
			// Track state changes
			const stateChanges: any[] = [];

			// Monitor isEmpty property
			const checkState = () => {
				stateChanges.push({
					startPosition: sequenceService.state.startPosition?.letter || null,
					beats: sequenceService.state.beats.length,
					isEmpty: sequenceService.isEmpty
				});
			};

			// Initial state
			checkState();

			// Set start position
			sequenceService.setStartPosition(mockStartPosition);
			checkState();

			// Add beats
			sequenceService.addBeats([
				{
					id: 'beat-1',
					beatNumber: 1,
					filled: true,
					pictographData: mockStartPosition,
					duration: 1,
					metadata: { blueReversal: false, redReversal: false, tags: [] }
				}
			]);
			checkState();

			// Clear sequence
			sequenceService.clearSequence();
			checkState();

			// Verify state progression
			expect(stateChanges).toEqual([
				{ startPosition: null, beats: 0, isEmpty: true }, // Initial
				{ startPosition: 'α1', beats: 0, isEmpty: true }, // Start position set (still empty - no beats)
				{ startPosition: 'α1', beats: 1, isEmpty: false }, // Beat added
				{ startPosition: null, beats: 0, isEmpty: true } // Cleared
			]);
		});
	});
});
