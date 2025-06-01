/**
 * Integration test to verify OptionPicker → SequenceService → ModernBeatGrid connection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { SequenceService } from '$lib/services/SequenceService.svelte';
import { createBeat } from '$lib/components/SequenceWorkbench/BeatFrame/BeatData';
import type { PictographData } from '$lib/types/PictographData';

// Mock PictographData for testing
const mockPictographData: PictographData = {
	letter: 'A',
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

describe('OptionPicker → SequenceService Integration', () => {
	let sequenceService: SequenceService;

	beforeEach(() => {
		// Create a fresh SequenceService instance for each test
		sequenceService = new SequenceService({
			autoSave: false,
			autoSaveDelay: 1000,
			maxBeats: 100,
			enablePlayback: false,
			persistenceKey: 'test_sequence_state'
		});
	});

	it('should add beats to SequenceService when option is selected', () => {
		// Verify initial state
		expect(sequenceService.state.beats).toHaveLength(0);
		expect(sequenceService.isEmpty).toBe(true);

		// Create a beat using the same logic as OptionPickerMain
		const beatData = createBeat(1, mockPictographData, {
			filled: true,
			duration: 1,
			tags: [`letter-${mockPictographData.letter}`]
		});

		// Add the beat to the sequence service
		sequenceService.addBeats([beatData]);

		// Verify the beat was added
		expect(sequenceService.state.beats).toHaveLength(1);
		expect(sequenceService.isEmpty).toBe(false);
		expect(sequenceService.state.beats[0].pictographData.letter).toBe('A');
		expect(sequenceService.state.beats[0].beatNumber).toBe(1);
		expect(sequenceService.state.beats[0].filled).toBe(true);
	});

	it('should maintain reactive state when multiple beats are added', () => {
		// Add first beat
		const beat1 = createBeat(1, { ...mockPictographData, letter: 'A' }, { filled: true });
		sequenceService.addBeats([beat1]);

		expect(sequenceService.state.beats).toHaveLength(1);
		expect(sequenceService.state.beats[0].pictographData.letter).toBe('A');

		// Add second beat
		const beat2 = createBeat(2, { ...mockPictographData, letter: 'B' }, { filled: true });
		sequenceService.addBeats([beat2]);

		expect(sequenceService.state.beats).toHaveLength(2);
		expect(sequenceService.state.beats[1].pictographData.letter).toBe('B');
		expect(sequenceService.state.beats[1].beatNumber).toBe(2);
	});

	it('should handle beat selection correctly', () => {
		// Add a beat
		const beatData = createBeat(1, mockPictographData, { filled: true });
		sequenceService.addBeats([beatData]);

		// Select the beat
		const beatId = sequenceService.state.beats[0].id;
		sequenceService.selectBeat(beatId);

		// Verify selection
		expect(sequenceService.state.selectedBeatIds).toContain(beatId);
		expect(sequenceService.state.selectedBeatIds).toHaveLength(1);
	});

	it('should clear sequence correctly', () => {
		// Add some beats
		const beat1 = createBeat(1, mockPictographData, { filled: true });
		const beat2 = createBeat(2, mockPictographData, { filled: true });
		sequenceService.addBeats([beat1, beat2]);

		expect(sequenceService.state.beats).toHaveLength(2);

		// Clear the sequence
		sequenceService.clearSequence();

		// Verify cleared state
		expect(sequenceService.state.beats).toHaveLength(0);
		expect(sequenceService.state.selectedBeatIds).toHaveLength(0);
		expect(sequenceService.isEmpty).toBe(true);
	});

	it('should emit events when beats are added', () => {
		const eventSpy = vi.fn();

		// Listen for beat:added events
		const unsubscribe = sequenceService.on('beat:added', eventSpy);

		// Add a beat
		const beatData = createBeat(1, mockPictographData, { filled: true });
		sequenceService.addBeats([beatData]);

		// Verify event was emitted
		expect(eventSpy).toHaveBeenCalledWith({ beat: beatData });

		unsubscribe();
	});

	it('should handle start position correctly', () => {
		// Verify initial state
		expect(sequenceService.state.startPosition).toBeNull();

		// Set a start position
		sequenceService.setStartPosition(mockPictographData);

		// Verify the start position was set
		expect(sequenceService.state.startPosition).toEqual(mockPictographData);
		expect(sequenceService.state.isModified).toBe(true);

		// Clear the start position
		sequenceService.setStartPosition(null);

		// Verify the start position was cleared
		expect(sequenceService.state.startPosition).toBeNull();
	});

	it('should emit events when start position changes', () => {
		const eventSpy = vi.fn();

		// Listen for startPosition:changed events
		const unsubscribe = sequenceService.on('startPosition:changed', eventSpy);

		// Set a start position
		sequenceService.setStartPosition(mockPictographData);

		// Verify event was emitted
		expect(eventSpy).toHaveBeenCalledWith({ startPosition: mockPictographData });

		// Clear the start position
		sequenceService.setStartPosition(null);

		// Verify event was emitted again
		expect(eventSpy).toHaveBeenCalledWith({ startPosition: null });

		unsubscribe();
	});

	it('should clear start position when sequence is cleared', () => {
		// Set up initial state
		sequenceService.setStartPosition(mockPictographData);
		const beatData = createBeat(1, mockPictographData, { filled: true });
		sequenceService.addBeats([beatData]);

		// Verify initial state
		expect(sequenceService.state.startPosition).toEqual(mockPictographData);
		expect(sequenceService.state.beats).toHaveLength(1);

		// Clear the sequence
		sequenceService.clearSequence();

		// Verify everything was cleared
		expect(sequenceService.state.startPosition).toBeNull();
		expect(sequenceService.state.beats).toHaveLength(0);
		expect(sequenceService.isEmpty).toBe(true);
	});
});
