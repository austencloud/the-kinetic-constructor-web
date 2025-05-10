/**
 * Tests for the modern sequence machine
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	modernSequenceMachine,
	modernSequenceContainer,
	sequenceSelectors,
	sequenceActions
} from './SequenceMachine';
import { sequenceContainer } from '../../stores/sequence/SequenceContainer';
import { waitFor } from '@testing-library/svelte';

// Mock the generateSequenceActor
vi.mock('./actors', () => ({
	generateSequenceActor: vi.fn(({ input }) => {
		return new Promise((resolve, reject) => {
			if (input.type === 'error') {
				reject(new Error('Test error'));
			} else {
				// Simulate a successful generation
				setTimeout(() => {
					resolve([
						{ id: 'beat-1', number: 1, letter: 'A' },
						{ id: 'beat-2', number: 2, letter: 'B' }
					]);
				}, 100);
			}
		});
	})
}));

// Mock the updateDevTools function
vi.mock('$lib/utils/devToolsUpdater', () => ({
	updateDevTools: vi.fn()
}));

describe('Modern Sequence Machine', () => {
	// Reset the containers before each test
	beforeEach(() => {
		sequenceContainer.reset();
		// Reset the machine state
		modernSequenceContainer.send({ type: 'RESET' });
	});

	// Clean up after each test
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should have the correct initial state', () => {
		expect(modernSequenceContainer.state.value).toBe('idle');
		expect(modernSequenceContainer.state.context.generationType).toBeNull();
		expect(modernSequenceContainer.state.context.generationProgress).toBe(0);
		expect(modernSequenceContainer.state.context.error).toBeNull();
	});

	it('should transition to generating state when generate action is called', () => {
		sequenceActions.generate('circular', { count: 4 });

		expect(modernSequenceContainer.state.value).toBe('generating');
		expect(modernSequenceContainer.state.context.generationType).toBe('circular');
		expect(modernSequenceContainer.state.context.generationOptions).toEqual({ count: 4 });
		expect(sequenceSelectors.isGenerating()).toBe(true);
	});

	it('should update progress during generation', () => {
		sequenceActions.generate('circular', { count: 4 });

		// Manually send a progress update
		modernSequenceContainer.send({
			type: 'GENERATION_PROGRESS',
			progress: 50,
			message: 'Halfway there'
		});

		expect(modernSequenceContainer.state.context.generationProgress).toBe(50);
		expect(modernSequenceContainer.state.context.generationMessage).toBe('Halfway there');
		expect(sequenceSelectors.progress()).toBe(50);
		expect(sequenceSelectors.message()).toBe('Halfway there');
	});

	it('should update the sequence when generation completes', async () => {
		sequenceActions.generate('circular', { count: 4 });

		// Wait for the generation to complete
		await waitFor(() => expect(modernSequenceContainer.state.value).toBe('idle'));

		// Check that the sequence was updated
		expect(sequenceContainer.state.beats.length).toBe(2);
		expect(sequenceContainer.state.beats[0].id).toBe('beat-1');
		expect(sequenceContainer.state.beats[1].id).toBe('beat-2');
	});

	it('should transition to error state when generation fails', async () => {
		sequenceActions.generate('error', {});

		// Wait for the error state
		await waitFor(() => expect(modernSequenceContainer.state.value).toBe('error'));

		expect(modernSequenceContainer.state.context.error).toBe('Test error');
		expect(sequenceSelectors.hasError()).toBe(true);
		expect(sequenceSelectors.error()).toBe('Test error');
	});

	it('should retry generation when retry action is called', async () => {
		// First generate with an error
		sequenceActions.generate('error', {});

		// Wait for the error state
		await waitFor(() => expect(modernSequenceContainer.state.value).toBe('error'));

		// Mock the actor to succeed on retry
		vi.mocked(require('./actors').generateSequenceActor).mockImplementationOnce(() => {
			return Promise.resolve([
				{ id: 'retry-1', number: 1, letter: 'X' },
				{ id: 'retry-2', number: 2, letter: 'Y' }
			]);
		});

		// Retry the generation
		sequenceActions.retry();

		// Wait for the generation to complete
		await waitFor(() => expect(modernSequenceContainer.state.value).toBe('idle'));

		// Check that the sequence was updated
		expect(sequenceContainer.state.beats.length).toBe(2);
		expect(sequenceContainer.state.beats[0].id).toBe('retry-1');
		expect(sequenceContainer.state.beats[1].id).toBe('retry-2');
	});

	it('should reset the error state when reset action is called', async () => {
		// First generate with an error
		sequenceActions.generate('error', {});

		// Wait for the error state
		await waitFor(() => expect(modernSequenceContainer.state.value).toBe('error'));

		// Reset the machine
		sequenceActions.reset();

		// Check that we're back to idle with no error
		expect(modernSequenceContainer.state.value).toBe('idle');
		expect(modernSequenceContainer.state.context.error).toBeNull();
		expect(sequenceSelectors.hasError()).toBe(false);
	});

	it('should manipulate beats through machine actions', () => {
		// Add a beat
		sequenceActions.addBeat({ id: 'test-1', number: 1, letter: 'A' });

		// Check that the beat was added
		expect(sequenceContainer.state.beats.length).toBe(1);
		expect(sequenceContainer.state.beats[0].id).toBe('test-1');

		// Select the beat
		sequenceActions.selectBeat('test-1');

		// Check that the beat is selected
		expect(sequenceContainer.state.selectedBeatIds).toEqual(['test-1']);

		// Update the beat
		sequenceActions.updateBeat('test-1', { letter: 'Z' });

		// Check that the beat was updated
		expect(sequenceContainer.state.beats[0].letter).toBe('Z');

		// Deselect the beat
		sequenceActions.deselectBeat('test-1');

		// Check that the beat is deselected
		expect(sequenceContainer.state.selectedBeatIds).toEqual([]);

		// Remove the beat
		sequenceActions.removeBeat('test-1');

		// Check that the beat was removed
		expect(sequenceContainer.state.beats.length).toBe(0);
	});

	it('should clear the sequence', () => {
		// Add some beats
		sequenceActions.addBeat({ id: 'test-1', number: 1, letter: 'A' });
		sequenceActions.addBeat({ id: 'test-2', number: 2, letter: 'B' });

		// Check that the beats were added
		expect(sequenceContainer.state.beats.length).toBe(2);

		// Clear the sequence
		sequenceActions.clearSequence();

		// Check that the sequence is empty
		expect(sequenceContainer.state.beats.length).toBe(0);
	});

	it('should remove a beat and all following beats', () => {
		// Add some beats
		sequenceActions.addBeat({ id: 'test-1', number: 1, letter: 'A' });
		sequenceActions.addBeat({ id: 'test-2', number: 2, letter: 'B' });
		sequenceActions.addBeat({ id: 'test-3', number: 3, letter: 'C' });

		// Check that the beats were added
		expect(sequenceContainer.state.beats.length).toBe(3);

		// Remove the second beat and all following beats
		sequenceActions.removeBeatAndFollowing('test-2');

		// Check that only the first beat remains
		expect(sequenceContainer.state.beats.length).toBe(1);
		expect(sequenceContainer.state.beats[0].id).toBe('test-1');
	});
});
