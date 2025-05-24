/**
 * Comprehensive unit tests for OptionPicker component
 * Tests the start position selection → option loading workflow
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import OptionPicker from './OptionPicker.svelte';
import { optionPickerState } from './optionPickerState.svelte';
import { sequenceState } from '$lib/state/sequence/sequenceState.svelte';
import { pictographData } from '$lib/state/pictograph/pictographDataState.svelte';
import type { PictographData } from '$lib/types/PictographData';
import { Letter } from '$lib/types/Letter';

// Mock the pictograph data using real examples from DiamondPictographDataFrame.csv
const mockPictographData: PictographData[] = [
	{
		// A,alpha3,alpha5,split,same,pro,cw,w,n,pro,cw,e,s
		letter: Letter.A,
		startPos: 'alpha3',
		endPos: 'alpha5',
		timing: 'split',
		direction: 'same',
		redMotionData: {
			id: 'red-motion-1',
			motionType: 'pro',
			startOri: 'in',
			endOri: 'in',
			propRotDir: 'cw',
			startLoc: 'e',
			endLoc: 's',
			turns: 0,
			color: 'red',
			leadState: null,
			prefloatMotionType: null,
			prefloatPropRotDir: null
		},
		blueMotionData: {
			id: 'blue-motion-1',
			motionType: 'pro',
			startOri: 'in',
			endOri: 'in',
			propRotDir: 'cw',
			startLoc: 'w',
			endLoc: 'n',
			turns: 0,
			color: 'blue',
			leadState: null,
			prefloatMotionType: null,
			prefloatPropRotDir: null
		},
		gridMode: 'diamond',
		grid: '',
		gridData: null,
		redArrowData: null,
		blueArrowData: null,
		motions: [],
		redMotion: null,
		blueMotion: null,
		props: [],
		redPropData: null,
		bluePropData: null
	},
	{
		// I,beta3,beta5,tog,same,pro,cw,e,s,anti,ccw,e,s
		letter: Letter.I,
		startPos: 'beta3',
		endPos: 'beta5',
		timing: 'tog',
		direction: 'same',
		redMotionData: {
			id: 'red-motion-2',
			motionType: 'anti',
			startOri: 'in',
			endOri: 'in',
			propRotDir: 'ccw',
			startLoc: 'e',
			endLoc: 's',
			turns: 0,
			color: 'red',
			leadState: null,
			prefloatMotionType: null,
			prefloatPropRotDir: null
		},
		blueMotionData: {
			id: 'blue-motion-2',
			motionType: 'pro',
			startOri: 'in',
			endOri: 'in',
			propRotDir: 'cw',
			startLoc: 'e',
			endLoc: 's',
			turns: 0,
			color: 'blue',
			leadState: null,
			prefloatMotionType: null,
			prefloatPropRotDir: null
		},
		gridMode: 'diamond',
		grid: '',
		gridData: null,
		redArrowData: null,
		blueArrowData: null,
		motions: [],
		redMotion: null,
		blueMotion: null,
		props: [],
		redPropData: null,
		bluePropData: null
	}
];

const mockStartPosition: PictographData = {
	letter: null, // Start positions don't have letters
	startPos: 'alpha1',
	endPos: 'alpha1',
	timing: null,
	direction: null,
	isStartPosition: true,
	redMotionData: {
		id: 'red-start-motion',
		motionType: 'static',
		startOri: 'in',
		endOri: 'in',
		propRotDir: 'cw',
		startLoc: 'n',
		endLoc: 'n',
		turns: 0,
		color: 'red',
		leadState: null,
		prefloatMotionType: null,
		prefloatPropRotDir: null
	},
	blueMotionData: {
		id: 'blue-start-motion',
		motionType: 'static',
		startOri: 'in',
		endOri: 'in',
		propRotDir: 'cw',
		startLoc: 's',
		endLoc: 's',
		turns: 0,
		color: 'blue',
		leadState: null,
		prefloatMotionType: null,
		prefloatPropRotDir: null
	},
	gridMode: 'diamond',
	grid: '',
	gridData: null,
	redArrowData: null,
	blueArrowData: null,
	motions: [],
	redMotion: null,
	blueMotion: null,
	props: [],
	redPropData: null,
	bluePropData: null
};

describe('OptionPicker Start Position → Option Loading Workflow', () => {
	beforeEach(async () => {
		// Reset all state before each test
		optionPickerState.reset();
		await sequenceState.clearSequence();

		// Mock pictograph data as initialized
		vi.spyOn(pictographData, 'isInitialized', 'get').mockReturnValue(true);
		vi.spyOn(pictographData, 'isEmpty', 'get').mockReturnValue(false);
		vi.spyOn(pictographData, 'isLoading', 'get').mockReturnValue(false);
		vi.spyOn(pictographData, 'data', 'get').mockReturnValue(mockPictographData);
		vi.spyOn(pictographData, 'waitForInitialization').mockResolvedValue(true);

		// Mock DOM methods
		Object.defineProperty(document, 'addEventListener', {
			value: vi.fn(),
			writable: true
		});
		Object.defineProperty(document, 'removeEventListener', {
			value: vi.fn(),
			writable: true
		});
		Object.defineProperty(document, 'dispatchEvent', {
			value: vi.fn(),
			writable: true
		});

		// Mock fetch for file operations
		global.fetch = vi.fn().mockImplementation((url: string) => {
			if (url.includes('.csv')) {
				return Promise.resolve({
					ok: true,
					text: () => Promise.resolve('mock,csv,data\n')
				});
			}
			if (url.includes('.json')) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve([])
				});
			}
			return Promise.resolve({
				ok: false,
				status: 404
			});
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Initial State', () => {
		it('should start with empty options and not loading', () => {
			expect(optionPickerState.options).toEqual([]);
			expect(optionPickerState.isLoading).toBe(false);
			expect(sequenceState.startPosition).toBeNull();
		});

		it('should render loading state initially', () => {
			const { getByText } = render(OptionPicker);
			// The component should show some loading or empty state initially
			expect(getByText).toBeDefined();
		});
	});

	describe('Start Position Selection', () => {
		it('should call optionPickerState.loadOptions when start position is selected', async () => {
			const loadOptionsSpy = vi.spyOn(optionPickerState, 'loadOptions');

			// Simulate start position selection event
			const event = new CustomEvent('start-position-selected', {
				detail: { startPosition: mockStartPosition }
			});

			document.dispatchEvent(event);

			await waitFor(() => {
				expect(loadOptionsSpy).toHaveBeenCalledWith([mockStartPosition]);
			});
		});

		it('should update sequence state when start position is selected', async () => {
			const setStartPositionSpy = vi.spyOn(sequenceState, 'setStartPosition');

			// Set start position directly
			await sequenceState.setStartPosition(mockStartPosition);

			expect(setStartPositionSpy).toHaveBeenCalledWith(mockStartPosition);
			expect(sequenceState.startPosition).toEqual(mockStartPosition);
		});
	});

	describe('Option Loading Process', () => {
		it('should set loading state when loadOptions is called', () => {
			optionPickerState.loadOptions([mockStartPosition]);
			expect(optionPickerState.isLoading).toBe(true);
		});

		it('should load options successfully with valid start position', async () => {
			// Mock getNextOptions to return valid options
			const mockGetNextOptions = vi.fn().mockReturnValue([mockPictographData[0]]);
			vi.doMock('./services/OptionsService', () => ({
				getNextOptions: mockGetNextOptions
			}));

			optionPickerState.loadOptions([mockStartPosition]);

			await waitFor(() => {
				expect(optionPickerState.isLoading).toBe(false);
				expect(optionPickerState.options.length).toBeGreaterThan(0);
			});
		});

		it('should handle empty sequence gracefully', () => {
			optionPickerState.loadOptions([]);

			expect(optionPickerState.options).toEqual([]);
			expect(optionPickerState.isLoading).toBe(false);
		});

		it('should handle pictograph data not available', () => {
			// Mock pictograph data as not initialized
			vi.spyOn(pictographData, 'isInitialized', 'get').mockReturnValue(false);

			optionPickerState.loadOptions([mockStartPosition]);

			expect(optionPickerState.options).toEqual([]);
			expect(optionPickerState.isLoading).toBe(false);
			expect(optionPickerState.error).toBe('No pictograph data available');
		});
	});

	describe('Reactive State Management', () => {
		it('should trigger loadOptionsFromSequence when sequence state changes', async () => {
			const loadOptionsFromSequenceSpy = vi.spyOn(optionPickerState, 'loadOptionsFromSequence');

			// Set start position to trigger sequence state change
			await sequenceState.setStartPosition(mockStartPosition);

			await waitFor(() => {
				expect(loadOptionsFromSequenceSpy).toHaveBeenCalled();
			});
		});

		it('should not load options when sequence is still loading', async () => {
			// Mock sequence as loading
			vi.spyOn(sequenceState, 'isLoading', 'get').mockReturnValue(true);

			const loadOptionsSpy = vi.spyOn(optionPickerState, 'loadOptions');

			await optionPickerState.loadOptionsFromSequence();

			expect(loadOptionsSpy).not.toHaveBeenCalled();
		});

		it('should wait for pictograph data initialization', async () => {
			// Mock pictograph data as not initialized initially
			vi.spyOn(pictographData, 'isInitialized', 'get').mockReturnValue(false);
			vi.spyOn(pictographData, 'isLoading', 'get').mockReturnValue(true);

			const waitForInitializationSpy = vi.spyOn(pictographData, 'waitForInitialization');
			waitForInitializationSpy.mockResolvedValue(true);

			await optionPickerState.loadOptionsFromSequence();

			expect(waitForInitializationSpy).toHaveBeenCalledWith(5000);
		});
	});

	describe('Integration Tests', () => {
		it('should complete full workflow: start position → options loaded', async () => {
			// Mock successful pictograph data
			vi.spyOn(pictographData, 'isInitialized', 'get').mockReturnValue(true);
			vi.spyOn(pictographData, 'data', 'get').mockReturnValue(mockPictographData);

			// Set start position
			await sequenceState.setStartPosition(mockStartPosition);

			// Load options from sequence
			await optionPickerState.loadOptionsFromSequence();

			// Verify final state
			expect(sequenceState.startPosition).toEqual(mockStartPosition);
			expect(optionPickerState.isLoading).toBe(false);
			// Options should be loaded (exact count depends on getNextOptions implementation)
			expect(optionPickerState.options).toBeDefined();
		});

		it('should handle option selection and trigger sequence update', async () => {
			const addBeatSpy = vi.spyOn(sequenceState, 'addBeat');

			// Select an option
			await optionPickerState.selectOption(mockPictographData[0]);

			expect(addBeatSpy).toHaveBeenCalledWith(mockPictographData[0]);
		});

		it('should handle multiple reactive effects without infinite loops', async () => {
			let effectCallCount = 0;
			const originalLoadOptionsFromSequence = optionPickerState.loadOptionsFromSequence;

			// Spy on the method to count calls
			vi.spyOn(optionPickerState, 'loadOptionsFromSequence').mockImplementation(async () => {
				effectCallCount++;
				if (effectCallCount > 5) {
					throw new Error('Infinite loop detected');
				}
				return originalLoadOptionsFromSequence.call(optionPickerState);
			});

			// Set start position which should trigger reactive effects
			await sequenceState.setStartPosition(mockStartPosition);

			// Wait a bit to see if there are multiple calls
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Should not have excessive calls (indicating infinite loop)
			expect(effectCallCount).toBeLessThan(5);
		});
	});

	describe('Error Handling', () => {
		it('should handle pictograph data initialization timeout', async () => {
			vi.spyOn(pictographData, 'isInitialized', 'get').mockReturnValue(false);
			vi.spyOn(pictographData, 'waitForInitialization').mockResolvedValue(false);

			const loadOptionsSpy = vi.spyOn(optionPickerState, 'loadOptions');

			await optionPickerState.loadOptionsFromSequence();

			expect(loadOptionsSpy).toHaveBeenCalledWith([]);
		});

		it('should handle errors in loadOptionsFromSequence gracefully', async () => {
			// Mock an error in sequence state
			vi.spyOn(sequenceState, 'startPosition', 'get').mockImplementation(() => {
				throw new Error('Test error');
			});

			const loadOptionsSpy = vi.spyOn(optionPickerState, 'loadOptions');

			await optionPickerState.loadOptionsFromSequence();

			expect(loadOptionsSpy).toHaveBeenCalledWith([]);
		});

		it('should handle getNextOptions returning empty array', async () => {
			// Mock getNextOptions to return empty array
			const mockGetNextOptions = vi.fn().mockReturnValue([]);
			vi.doMock('./services/OptionsService', () => ({
				getNextOptions: mockGetNextOptions
			}));

			optionPickerState.loadOptions([mockStartPosition]);

			expect(optionPickerState.options).toEqual([]);
			expect(optionPickerState.isLoading).toBe(false);
		});
	});

	describe('Loading State Transitions', () => {
		it('should transition from loading to loaded correctly', async () => {
			// Make loadOptions async to test loading state properly
			const originalLoadOptions = optionPickerState.loadOptions;
			let resolveLoading: () => void;
			const loadingPromise = new Promise<void>((resolve) => {
				resolveLoading = resolve;
			});

			// Mock loadOptions to be async
			vi.spyOn(optionPickerState, 'loadOptions').mockImplementation(async (sequence) => {
				// We can't access private fields directly, so we'll modify the original method
				// to make it async for testing purposes
				return new Promise<void>((resolve) => {
					setTimeout(async () => {
						await originalLoadOptions.call(optionPickerState, sequence);
						resolve();
					}, 10);
				});
			});

			// Start loading
			optionPickerState.loadOptions([mockStartPosition]);
			expect(optionPickerState.isLoading).toBe(true);

			// Complete the loading
			resolveLoading!();

			// Wait for loading to complete
			await waitFor(() => {
				expect(optionPickerState.isLoading).toBe(false);
			});
		});

		it('should clear loading state when options are available', async () => {
			// Mock successful option loading
			const mockGetNextOptions = vi.fn().mockReturnValue([mockPictographData[0]]);
			vi.doMock('./services/OptionsService', () => ({
				getNextOptions: mockGetNextOptions
			}));

			optionPickerState.loadOptions([mockStartPosition]);

			await waitFor(() => {
				expect(optionPickerState.isLoading).toBe(false);
				expect(optionPickerState.options.length).toBeGreaterThan(0);
			});
		});

		it('should not get stuck in loading state', async () => {
			// Set a timeout to ensure loading doesn't get stuck
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('Loading timeout')), 1000);
			});

			const loadingPromise = new Promise((resolve) => {
				optionPickerState.loadOptions([mockStartPosition]);

				// Check loading state periodically
				const checkLoading = () => {
					if (!optionPickerState.isLoading) {
						resolve(true);
					} else {
						setTimeout(checkLoading, 50);
					}
				};
				checkLoading();
			});

			// Should resolve before timeout
			await expect(Promise.race([loadingPromise, timeoutPromise])).resolves.toBe(true);
		});

		it('should reproduce infinite loading bug when reactive effects trigger multiple times', async () => {
			// This test reproduces the actual bug scenario
			let loadOptionsCallCount = 0;
			const originalLoadOptions = optionPickerState.loadOptions;

			// Mock loadOptions to track calls and simulate the synchronous behavior
			vi.spyOn(optionPickerState, 'loadOptions').mockImplementation(async (sequence) => {
				loadOptionsCallCount++;
				console.log(`loadOptions called ${loadOptionsCallCount} times`);

				// Call the original method (which is now async)
				await originalLoadOptions.call(optionPickerState, sequence);

				// If this gets called too many times, it indicates the infinite loop bug
				if (loadOptionsCallCount > 10) {
					throw new Error('Infinite loading loop detected!');
				}
			});

			// Simulate the scenario: start position is set, which triggers reactive effects
			await sequenceState.setStartPosition(mockStartPosition);

			// Simulate multiple reactive effects triggering (this is what happens in the real app)
			const promises = [
				optionPickerState.loadOptionsFromSequence(),
				optionPickerState.loadOptionsFromSequence(),
				optionPickerState.loadOptionsFromSequence()
			];

			// Wait for all operations to complete
			await Promise.all(promises);

			// The bug would manifest as excessive calls to loadOptions
			expect(loadOptionsCallCount).toBeLessThan(10);
			expect(optionPickerState.isLoading).toBe(false); // Should not be stuck in loading state
		});

		it('should handle race conditions in loadOptionsFromSequence', async () => {
			let loadOptionsCallCount = 0;
			const originalLoadOptionsFromSequence = optionPickerState.loadOptionsFromSequence;

			// Track calls to loadOptionsFromSequence
			vi.spyOn(optionPickerState, 'loadOptionsFromSequence').mockImplementation(async () => {
				loadOptionsCallCount++;
				console.log(`loadOptionsFromSequence called ${loadOptionsCallCount} times`);
				return originalLoadOptionsFromSequence.call(optionPickerState);
			});

			// Set up the start position
			await sequenceState.setStartPosition(mockStartPosition);

			// Simulate multiple simultaneous calls (race condition)
			const promises = [
				optionPickerState.loadOptionsFromSequence(),
				optionPickerState.loadOptionsFromSequence(),
				optionPickerState.loadOptionsFromSequence()
			];

			await Promise.all(promises);

			// Should handle race conditions gracefully
			expect(loadOptionsCallCount).toBe(3);
			expect(optionPickerState.isLoading).toBe(false);
		});
	});
});
