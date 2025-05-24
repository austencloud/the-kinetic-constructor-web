import { describe, it, expect, beforeEach, vi } from 'vitest';
import { optionPickerState } from '../optionPickerState.svelte.ts';
import { sequenceState } from '$lib/state/sequence/sequenceState.svelte.ts';

// Mock the pictograph data
vi.mock('$lib/state/pictograph/pictographDataState.svelte.ts', () => ({
	pictographData: {
		isInitialized: true,
		isEmpty: false,
		isLoading: false,
		data: [
			{
				startPos: 'alpha1',
				endPos: 'alpha2',
				blueMotionData: { startOri: 'N', endOri: 'E' },
				redMotionData: { startOri: 'S', endOri: 'W' }
			},
			{
				startPos: 'alpha1',
				endPos: 'beta1',
				blueMotionData: { startOri: 'N', endOri: 'S' },
				redMotionData: { startOri: 'S', endOri: 'N' }
			}
		],
		waitForInitialization: vi.fn().mockResolvedValue(true)
	}
}));

describe('OptionPickerState', () => {
	beforeEach(() => {
		// Reset state before each test
		optionPickerState.reset();
		vi.clearAllMocks();
	});

	it('should load options when start position is set', async () => {
		// Create a mock start position
		const startPosition = {
			startPos: 'alpha1',
			endPos: 'alpha1',
			isStartPosition: true,
			blueMotionData: { startOri: 'N', endOri: 'N' },
			redMotionData: { startOri: 'S', endOri: 'S' }
		};

		// Load options for the start position
		await optionPickerState.loadOptions([startPosition]);

		// Verify options were loaded
		expect(optionPickerState.options.length).toBeGreaterThan(0);
		expect(optionPickerState.isLoading).toBe(false);
		expect(optionPickerState.error).toBeNull();
	});

	it('should not create infinite loops when loading options', async () => {
		const loadOptionsSpy = vi.spyOn(optionPickerState, 'loadOptions');
		
		// Create a mock start position
		const startPosition = {
			startPos: 'alpha1',
			endPos: 'alpha1',
			isStartPosition: true,
			blueMotionData: { startOri: 'N', endOri: 'N' },
			redMotionData: { startOri: 'S', endOri: 'S' }
		};

		// Load options
		await optionPickerState.loadOptions([startPosition]);

		// Verify loadOptions was called only once (no infinite loop)
		expect(loadOptionsSpy).toHaveBeenCalledTimes(1);
	});

	it('should handle empty sequence correctly', async () => {
		// Load options with empty sequence
		await optionPickerState.loadOptions([]);

		// Verify state is correct
		expect(optionPickerState.options.length).toBe(0);
		expect(optionPickerState.isLoading).toBe(false);
		expect(optionPickerState.error).toBeNull();
	});

	it('should reset state correctly', () => {
		// Set some state
		optionPickerState.reset();

		// Verify state is reset
		expect(optionPickerState.options.length).toBe(0);
		expect(optionPickerState.isLoading).toBe(false);
		expect(optionPickerState.error).toBeNull();
	});
});
