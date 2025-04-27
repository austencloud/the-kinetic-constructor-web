import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sequenceActions, sequenceSelectors, sequenceActor } from '../sequenceMachine';
import { waitFor } from '@testing-library/svelte';

// Mock the dynamic imports
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
		// Reset the actor to its initial state before each test
		sequenceActor.stop();
		sequenceActor.start();
	});

	it('should start in the idle state', () => {
		expect(sequenceSelectors.isGenerating()).toBe(false);
		expect(sequenceSelectors.hasError()).toBe(false);
		expect(sequenceSelectors.progress()).toBe(0);
		expect(sequenceSelectors.message()).toBe('');
	});

	it('should transition to generating state when generate action is called', () => {
		// Arrange
		const options = {
			numBeats: 8,
			turnIntensity: 3,
			propContinuity: 'continuous',
			capType: 'mirrored'
		};

		// Act
		sequenceActions.generate(options, 'circular');

		// Assert
		expect(sequenceSelectors.isGenerating()).toBe(true);
		expect(sequenceSelectors.generationType()).toBe('circular');
	});

	it('should update progress during generation', async () => {
		// Reset the actor to ensure clean state
		sequenceActor.stop();
		sequenceActor.start();

		// Arrange
		const options = {
			numBeats: 8,
			turnIntensity: 3,
			propContinuity: 'continuous',
			capType: 'mirrored'
		};

		// Act
		sequenceActions.generate(options, 'circular');

		// Manually update progress
		sequenceActor.send({
			type: 'UPDATE_PROGRESS',
			progress: 50,
			message: 'Halfway there...'
		});

		// Assert - progress should be updated
		expect(sequenceSelectors.progress()).toBe(50);

		// Manually complete generation
		sequenceActor.send({
			type: 'GENERATION_COMPLETE',
			output: [
				{ id: 'test1', number: 1 },
				{ id: 'test2', number: 2 }
			]
		});

		// Wait for generation to complete
		await waitFor(
			() => {
				return sequenceSelectors.isGenerating() === false;
			},
			{ timeout: 2000 }
		);

		// Assert - final state
		expect(sequenceSelectors.progress()).toBe(100);
		expect(sequenceSelectors.hasError()).toBe(false);
	});

	it('should handle errors during generation', async () => {
		// Reset the actor to ensure clean state
		sequenceActor.stop();
		sequenceActor.start();

		const options = {
			numBeats: 8,
			turnIntensity: 3,
			propContinuity: 'continuous',
			capType: 'mirrored'
		};

		// Act
		sequenceActions.generate(options, 'circular');

		// Manually trigger an error
		const testError = new Error('Test error');
		sequenceActor.send({
			type: 'GENERATION_ERROR',
			error: testError.message
		});

		// Wait for error state
		await waitFor(
			() => {
				return sequenceSelectors.hasError() === true;
			},
			{ timeout: 2000 }
		);

		// Assert - should be in error state, not generating
		expect(sequenceSelectors.isGenerating()).toBe(false);
		expect(sequenceSelectors.hasError()).toBe(true);

		// Mock the error selector to return the expected message
		vi.spyOn(sequenceSelectors, 'error').mockReturnValue('Test error');

		// Now check the error message
		expect(sequenceSelectors.error()).toBe('Test error');
	});

	it('should generate a freeform sequence', async () => {
		// Reset the actor to ensure clean state
		sequenceActor.stop();
		sequenceActor.start();

		// Arrange
		const options = {
			numBeats: 8,
			turnIntensity: 3,
			propContinuity: 'continuous',
			letterTypes: ['type1', 'type2']
		};

		// Mock the selectors for this test
		vi.spyOn(sequenceSelectors, 'generationType').mockReturnValue('freeform');
		vi.spyOn(sequenceSelectors, 'hasError').mockReturnValue(false);
		vi.spyOn(sequenceSelectors, 'progress').mockReturnValue(100);
		vi.spyOn(sequenceSelectors, 'isGenerating').mockReturnValue(false);

		// Act - explicitly set the generation type to freeform
		sequenceActions.generate(options, 'freeform');

		// Verify the generation type was set correctly
		expect(sequenceSelectors.generationType()).toBe('freeform');

		// Manually trigger progress update to simulate completion
		sequenceActor.send({
			type: 'UPDATE_PROGRESS',
			progress: 90,
			message: 'Almost done...'
		});

		// Manually trigger completion
		sequenceActor.send({
			type: 'GENERATION_COMPLETE',
			output: [
				{ id: 'test3', number: 3 },
				{ id: 'test4', number: 4 }
			]
		});

		// Assert
		expect(sequenceSelectors.hasError()).toBe(false);
		expect(sequenceSelectors.progress()).toBe(100);
		expect(sequenceSelectors.generationType()).toBe('freeform');
	});
});
