/**
 * Sequence Machine Tests
 *
 * Tests for the sequence state machine functionality.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { sequenceActor } from '../machines/sequenceMachine';
import { get } from 'svelte/store';
import { sequenceStore } from '../stores/sequenceStore';
import type { SequenceGenerationOptions } from '../machines/sequenceMachine.types';

// Mock the sequence generators
vi.mock('../../components/GenerateTab/circular/createCircularSequence', () => ({
	createCircularSequence: vi.fn().mockResolvedValue([
		{ id: 'test1', number: 1 },
		{ id: 'test2', number: 2 }
	])
}));

vi.mock('../../components/GenerateTab/Freeform/createFreeformSequence', () => ({
	createFreeformSequence: vi.fn().mockResolvedValue([
		{ id: 'test3', number: 3 },
		{ id: 'test4', number: 4 }
	])
}));

describe('Sequence Machine', () => {
	beforeEach(() => {
		// Reset the actor and store before each test
		sequenceActor.stop();
		sequenceActor.start();
		sequenceStore.setSequence([]);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should start in the idle state', () => {
		const snapshot = sequenceActor.getSnapshot();
		expect(snapshot.value).toBe('idle');
		expect(snapshot.context.isGenerating).toBe(false);
		expect(snapshot.context.error).toBeNull();
	});

	it('should transition to generating state when GENERATE event is sent', () => {
		// Arrange
		const options = {
			numBeats: 8,
			turnIntensity: 3,
			propContinuity: 'continuous' as 'continuous',
			capType: 'mirrored'
		};

		// Act
		sequenceActor.send({
			type: 'GENERATE',
			options,
			generationType: 'circular'
		});

		// Assert
		const snapshot = sequenceActor.getSnapshot();
		expect(snapshot.value).toBe('generating');
		expect(snapshot.context.isGenerating).toBe(true);
		expect(snapshot.context.generationType).toBe('circular');
		expect(snapshot.context.generationOptions).toEqual(options);
	});

	it('should update progress during generation', () => {
		// Arrange
		const options = {
			numBeats: 8,
			turnIntensity: 3,
			propContinuity: 'continuous' as 'continuous',
			capType: 'mirrored'
		};

		// Act - start generation
		sequenceActor.send({
			type: 'GENERATE',
			options,
			generationType: 'circular'
		});

		// Send progress update
		sequenceActor.send({
			type: 'UPDATE_PROGRESS',
			progress: 50,
			message: 'Halfway there'
		});

		// Assert
		const snapshot = sequenceActor.getSnapshot();
		expect(snapshot.context.generationProgress).toBe(50);
		expect(snapshot.context.generationMessage).toBe('Halfway there');
	});

	it('should update the sequence store when generation completes', async () => {
		// Arrange
		const options = {
			numBeats: 8,
			turnIntensity: 3,
			propContinuity: 'continuous' as 'continuous',
			capType: 'mirrored'
		};

		// Act - start generation
		sequenceActor.send({
			type: 'GENERATE',
			options,
			generationType: 'circular'
		});

		// Send completion event
		sequenceActor.send({
			type: 'GENERATION_COMPLETE',
			output: [
				{ id: 'test1', number: 1 },
				{ id: 'test2', number: 2 }
			]
		});

		// Assert
		const snapshot = sequenceActor.getSnapshot();
		expect(snapshot.value).toBe('idle');
		expect(snapshot.context.isGenerating).toBe(false);
		expect(snapshot.context.generationProgress).toBe(100);

		// Check that the sequence store was updated
		const storeState = get(sequenceStore);
		expect(storeState.beats.length).toBe(2);
		expect(storeState.beats[0].id).toBe('test1');
		expect(storeState.beats[1].id).toBe('test2');
	});

	it('should transition to error state when generation fails', () => {
		// Arrange
		const options = {
			numBeats: 8,
			turnIntensity: 3,
			propContinuity: 'continuous' as 'continuous',
			capType: 'mirrored'
		};

		// Act - start generation
		sequenceActor.send({
			type: 'GENERATE',
			options,
			generationType: 'circular'
		});

		// Send error event
		sequenceActor.send({
			type: 'GENERATION_ERROR',
			error: 'Test error message'
		});

		// Assert
		const snapshot = sequenceActor.getSnapshot();
		expect(snapshot.value).toBe('error');
		expect(snapshot.context.isGenerating).toBe(false);
		expect(snapshot.context.error).toBe('Test error message');
	});

	it('should be able to retry after an error', () => {
		// Arrange - put the machine in error state
		sequenceActor.send({
			type: 'GENERATE',
			options: {
				numBeats: 8,
				turnIntensity: 3,
				propContinuity: 'continuous' as 'continuous',
				capType: 'mirrored'
			},
			generationType: 'circular'
		});

		sequenceActor.send({
			type: 'GENERATION_ERROR',
			error: 'Test error message'
		});

		// Act - retry
		sequenceActor.send({ type: 'RETRY' });

		// Assert
		const snapshot = sequenceActor.getSnapshot();
		expect(snapshot.value).toBe('generating');
		expect(snapshot.context.isGenerating).toBe(true);
		expect(snapshot.context.error).toBeNull();
	});

	it('should be able to cancel generation', () => {
		// Arrange - start generation
		sequenceActor.send({
			type: 'GENERATE',
			options: {
				numBeats: 8,
				turnIntensity: 3,
				propContinuity: 'continuous' as 'continuous',
				capType: 'mirrored'
			},
			generationType: 'circular'
		});

		// Act - cancel
		sequenceActor.send({ type: 'CANCEL' });

		// Assert
		const snapshot = sequenceActor.getSnapshot();
		expect(snapshot.value).toBe('idle');
		expect(snapshot.context.isGenerating).toBe(false);
	});

	it('should be able to add a beat to the sequence', () => {
		// Act
		sequenceActor.send({
			type: 'ADD_BEAT',
			beat: {
				id: 'new-beat',
				number: 1,
				letter: 'A',
				position: 'start',
				orientation: 'in',
				turnsTuple: '0,0',
				redPropData: null,
				bluePropData: null,
				redArrowData: null,
				blueArrowData: null,
				metadata: {}
			}
		});

		// Assert
		const storeState = get(sequenceStore);
		expect(storeState.beats.length).toBe(1);
		expect(storeState.beats[0].id).toBe('new-beat');
		expect(storeState.beats[0].letter).toBe('A');
	});

	it('should be able to update a beat in the sequence', () => {
		// Arrange - add a beat first
		sequenceActor.send({
			type: 'ADD_BEAT',
			beat: {
				id: 'beat-to-update',
				number: 1,
				letter: 'A'
			}
		});

		// Act - update the beat
		sequenceActor.send({
			type: 'UPDATE_BEAT',
			beatId: 'beat-to-update',
			updates: {
				letter: 'B',
				position: 'updated'
			}
		});

		// Assert
		const storeState = get(sequenceStore);
		expect(storeState.beats.length).toBe(1);
		expect(storeState.beats[0].id).toBe('beat-to-update');
		expect(storeState.beats[0].letter).toBe('B');
		expect(storeState.beats[0].position).toBe('updated');
	});

	it('should be able to remove a beat from the sequence', () => {
		// Arrange - add two beats
		sequenceActor.send({
			type: 'ADD_BEAT',
			beat: { id: 'beat1', number: 1 }
		});

		sequenceActor.send({
			type: 'ADD_BEAT',
			beat: { id: 'beat2', number: 2 }
		});

		// Act - remove one beat
		sequenceActor.send({
			type: 'REMOVE_BEAT',
			beatId: 'beat1'
		});

		// Assert
		const storeState = get(sequenceStore);
		expect(storeState.beats.length).toBe(1);
		expect(storeState.beats[0].id).toBe('beat2');
	});

	it('should be able to clear the entire sequence', () => {
		// Arrange - add some beats
		sequenceActor.send({
			type: 'ADD_BEAT',
			beat: { id: 'beat1', number: 1 }
		});

		sequenceActor.send({
			type: 'ADD_BEAT',
			beat: { id: 'beat2', number: 2 }
		});

		// Act - clear the sequence
		sequenceActor.send({ type: 'CLEAR_SEQUENCE' });

		// Assert
		const storeState = get(sequenceStore);
		expect(storeState.beats.length).toBe(0);
	});
});
