/**
 * End-to-End Integration Test
 * Verifies the complete flow: StartPositionPicker → SequenceService → ModernBeatGrid
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SequenceService } from '$lib/services/SequenceService.svelte';
import { createBeat } from '$lib/components/SequenceWorkbench/BeatFrame/BeatData';
import type { PictographData } from '$lib/types/PictographData';

// Mock PictographData for testing
const mockStartPosition: PictographData = {
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
};

const mockOptionA: PictographData = {
	letter: 'A',
	startPos: 'n',
	endPos: 'e',
	grid: 'diamond',
	redPropData: {
		prop: 'staff',
		hand: 'right',
		location: 'e'
	},
	bluePropData: {
		prop: 'staff',
		hand: 'left',
		location: 'e'
	},
	redMotionData: {
		motionType: 'pro',
		startOri: 'in',
		endOri: 'out',
		location: 'e'
	},
	blueMotionData: {
		motionType: 'anti',
		startOri: 'in',
		endOri: 'out',
		location: 'e'
	}
};

describe('End-to-End Integration: StartPositionPicker → SequenceService → ModernBeatGrid', () => {
	let sequenceService: SequenceService;

	beforeEach(() => {
		// Create a fresh SequenceService instance for each test
		sequenceService = new SequenceService({
			autoSave: false,
			autoSaveDelay: 1000,
			maxBeats: 100,
			enablePlayback: false,
			persistenceKey: 'test_e2e_sequence_state'
		});
	});

	it('should handle complete user workflow: start position → option selection → beat grid display', () => {
		// ===== PHASE 1: User selects start position =====
		console.log('🎯 Phase 1: Setting start position');
		
		// Verify initial empty state
		expect(sequenceService.state.startPosition).toBeNull();
		expect(sequenceService.state.beats).toHaveLength(0);
		expect(sequenceService.isEmpty).toBe(true);

		// User clicks on start position (simulating StartPositionPicker)
		sequenceService.setStartPosition(mockStartPosition);

		// Verify start position is set
		expect(sequenceService.state.startPosition).toEqual(mockStartPosition);
		expect(sequenceService.state.startPosition?.letter).toBe('α1');
		expect(sequenceService.state.isModified).toBe(true);

		// ===== PHASE 2: User selects option =====
		console.log('🎯 Phase 2: Adding beat from option selection');

		// User clicks on option A (simulating OptionPickerMain)
		const beatData = createBeat(1, mockOptionA, {
			filled: true,
			duration: 1,
			tags: [`letter-${mockOptionA.letter}`]
		});

		sequenceService.addBeats([beatData]);

		// Verify beat was added
		expect(sequenceService.state.beats).toHaveLength(1);
		expect(sequenceService.state.beats[0].pictographData.letter).toBe('A');
		expect(sequenceService.state.beats[0].beatNumber).toBe(1);
		expect(sequenceService.state.beats[0].filled).toBe(true);
		expect(sequenceService.isEmpty).toBe(false);

		// ===== PHASE 3: ModernBeatGrid should display both start position and beat =====
		console.log('🎯 Phase 3: Verifying ModernBeatGrid data');

		// ModernBeatGrid reads from sequenceService.state
		const gridState = sequenceService.state;
		
		// Should have start position for display
		expect(gridState.startPosition).toEqual(mockStartPosition);
		expect(gridState.startPosition?.letter).toBe('α1');

		// Should have beats for display
		expect(gridState.beats).toHaveLength(1);
		expect(gridState.beats[0].pictographData.letter).toBe('A');

		// Should show as non-empty
		expect(sequenceService.isEmpty).toBe(false);
	});

	it('should handle multiple beat additions correctly', () => {
		// Set start position
		sequenceService.setStartPosition(mockStartPosition);

		// Add multiple beats
		const beat1 = createBeat(1, { ...mockOptionA, letter: 'A' }, { filled: true });
		const beat2 = createBeat(2, { ...mockOptionA, letter: 'B' }, { filled: true });
		const beat3 = createBeat(3, { ...mockOptionA, letter: 'C' }, { filled: true });

		sequenceService.addBeats([beat1, beat2, beat3]);

		// Verify all beats are present
		expect(sequenceService.state.beats).toHaveLength(3);
		expect(sequenceService.state.beats.map(b => b.pictographData.letter)).toEqual(['A', 'B', 'C']);
		expect(sequenceService.state.beats.map(b => b.beatNumber)).toEqual([1, 2, 3]);

		// Start position should still be preserved
		expect(sequenceService.state.startPosition?.letter).toBe('α1');
	});

	it('should handle sequence clearing correctly', () => {
		// Set up a complete sequence
		sequenceService.setStartPosition(mockStartPosition);
		const beat1 = createBeat(1, mockOptionA, { filled: true });
		sequenceService.addBeats([beat1]);

		// Verify setup
		expect(sequenceService.state.startPosition).toEqual(mockStartPosition);
		expect(sequenceService.state.beats).toHaveLength(1);
		expect(sequenceService.isEmpty).toBe(false);

		// Clear the sequence
		sequenceService.clearSequence();

		// Verify everything is cleared
		expect(sequenceService.state.startPosition).toBeNull();
		expect(sequenceService.state.beats).toHaveLength(0);
		expect(sequenceService.state.selectedBeatIds).toHaveLength(0);
		expect(sequenceService.isEmpty).toBe(true);
	});

	it('should emit correct events during the workflow', () => {
		const startPositionSpy = vi.fn();
		const beatAddedSpy = vi.fn();
		const sequenceClearedSpy = vi.fn();

		// Set up event listeners
		const unsubscribe1 = sequenceService.on('startPosition:changed', startPositionSpy);
		const unsubscribe2 = sequenceService.on('beat:added', beatAddedSpy);
		const unsubscribe3 = sequenceService.on('sequence:cleared', sequenceClearedSpy);

		// Execute workflow
		sequenceService.setStartPosition(mockStartPosition);
		const beatData = createBeat(1, mockOptionA, { filled: true });
		sequenceService.addBeats([beatData]);
		sequenceService.clearSequence();

		// Verify events were emitted
		expect(startPositionSpy).toHaveBeenCalledWith({ startPosition: mockStartPosition });
		expect(beatAddedSpy).toHaveBeenCalledWith({ beat: beatData });
		expect(sequenceClearedSpy).toHaveBeenCalledWith({});

		// Clean up
		unsubscribe1();
		unsubscribe2();
		unsubscribe3();
	});

	it('should maintain reactive state consistency throughout workflow', () => {
		// Track state changes
		const stateSnapshots: any[] = [];
		
		// Take initial snapshot
		stateSnapshots.push({
			phase: 'initial',
			startPosition: sequenceService.state.startPosition,
			beatCount: sequenceService.state.beats.length,
			isEmpty: sequenceService.isEmpty,
			isModified: sequenceService.state.isModified
		});

		// Set start position
		sequenceService.setStartPosition(mockStartPosition);
		stateSnapshots.push({
			phase: 'start-position-set',
			startPosition: sequenceService.state.startPosition?.letter,
			beatCount: sequenceService.state.beats.length,
			isEmpty: sequenceService.isEmpty,
			isModified: sequenceService.state.isModified
		});

		// Add beat
		const beatData = createBeat(1, mockOptionA, { filled: true });
		sequenceService.addBeats([beatData]);
		stateSnapshots.push({
			phase: 'beat-added',
			startPosition: sequenceService.state.startPosition?.letter,
			beatCount: sequenceService.state.beats.length,
			isEmpty: sequenceService.isEmpty,
			isModified: sequenceService.state.isModified
		});

		// Verify state progression
		expect(stateSnapshots[0]).toEqual({
			phase: 'initial',
			startPosition: null,
			beatCount: 0,
			isEmpty: true,
			isModified: false
		});

		expect(stateSnapshots[1]).toEqual({
			phase: 'start-position-set',
			startPosition: 'α1',
			beatCount: 0,
			isEmpty: true, // Still empty because no beats yet
			isModified: true
		});

		expect(stateSnapshots[2]).toEqual({
			phase: 'beat-added',
			startPosition: 'α1',
			beatCount: 1,
			isEmpty: false, // Now has content
			isModified: true
		});
	});
});
