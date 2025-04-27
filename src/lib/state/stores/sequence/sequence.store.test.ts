import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sequenceStore } from '../../stores/sequenceStore';
import { sequenceActions, sequenceActor } from '../../machines/sequenceMachine';
import { waitFor } from '@testing-library/svelte';

// Mock the dynamic imports
vi.mock('../../../components/GenerateTab/circular/createCircularSequence', () => ({
	createCircularSequence: vi.fn().mockResolvedValue([
		{ id: 'test1', number: 1 },
		{ id: 'test2', number: 2 }
	])
}));

vi.mock('../../../components/GenerateTab/Freeform/createFreeformSequence', () => ({
	createFreeformSequence: vi.fn().mockResolvedValue([
		{ id: 'test3', number: 3 },
		{ id: 'test4', number: 4 }
	])
}));

describe('Sequence Store', () => {
	beforeEach(() => {
		// Reset the store and actor to their initial states before each test
		sequenceStore.setSequence([]);
		sequenceActor.stop();
		sequenceActor.start();
	});

	it('should have an empty sequence initially', () => {
		const state = sequenceStore.getSnapshot();
		expect(state.beats).toEqual([]);
	});

	it('should be able to add a beat', () => {
		// Arrange
		const beat = { id: 'test', number: 1 };

		// Act
		sequenceStore.addBeat(beat);

		// Assert
		const state = sequenceStore.getSnapshot();
		expect(state.beats).toHaveLength(1);
		expect(state.beats[0]).toEqual(beat);
	});

	it('should be able to update a beat', () => {
		// Arrange
		const beat = { id: 'test', number: 1 };
		sequenceStore.addBeat(beat);

		// Act
		sequenceStore.updateBeat('test', { number: 2 });

		// Assert
		const state = sequenceStore.getSnapshot();
		expect(state.beats[0].number).toBe(2);
	});

	it('should be able to remove a beat', () => {
		// Arrange
		const beat = { id: 'test', number: 1 };
		sequenceStore.addBeat(beat);

		// Act
		sequenceStore.removeBeat('test');

		// Assert
		const state = sequenceStore.getSnapshot();
		expect(state.beats).toHaveLength(0);
	});

	it('should be able to set the entire sequence', () => {
		// Arrange
		const beats = [
			{ id: 'test1', number: 1 },
			{ id: 'test2', number: 2 }
		];

		// Act
		sequenceStore.setSequence(beats);

		// Assert
		const state = sequenceStore.getSnapshot();
		expect(state.beats).toEqual(beats);
	});

	it('should update the sequence when the sequence machine generates a new sequence', async () => {
		// Reset the store and actor
		sequenceStore.setSequence([]);
		sequenceActor.stop();
		sequenceActor.start();

		// Arrange
		const options = {
			numBeats: 8,
			turnIntensity: 3,
			propContinuity: 'continuous',
			capType: 'mirrored'
		};

		// Directly set the sequence with test data
		const testBeats = [
			{ id: 'test1', number: 1 },
			{ id: 'test2', number: 2 }
		];

		// Act - simulate the sequence machine completing generation
		sequenceActions.generate(options, 'circular');

		// Manually trigger completion with test data
		sequenceActor.send({
			type: 'GENERATION_COMPLETE',
			output: testBeats
		});

		// Wait a bit for the action to be processed
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Assert
		const state = sequenceStore.getSnapshot();
		expect(state.beats).toHaveLength(2);
		expect(state.beats[0].id).toBe('test1');
		expect(state.beats[1].id).toBe('test2');
	});
});
