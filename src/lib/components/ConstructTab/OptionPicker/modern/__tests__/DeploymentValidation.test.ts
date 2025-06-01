/**
 * Deployment Validation Tests
 * Validates the complete modern OptionPicker deployment in production environment
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SequenceService } from '$lib/services/SequenceService.svelte';
import { OptionService } from '../services/OptionService.svelte';
import { StartPositionService } from '../services/StartPositionService.svelte';
import { LayoutService } from '../services/LayoutService.svelte';
import type { PictographData } from '$lib/types/PictographData';
import type { BeatData } from '$lib/components/SequenceWorkbench/BeatFrame/BeatData';

// Mock the external services
vi.mock('../../services/OptionsService', () => ({
	getNextOptions: vi.fn().mockResolvedValue([
		{
			letter: 'B',
			startPos: 'alpha1',
			endPos: 'beta2',
			timing: 'together',
			direction: 'clockwise',
			gridMode: 'diamond',
			gridData: null,
			blueMotionData: { motionType: 'pro' },
			redMotionData: { motionType: 'anti' },
			redPropData: null,
			bluePropData: null,
			redArrowData: null,
			blueArrowData: null,
			grid: 'diamond'
		}
	])
}));

vi.mock('$lib/utils/testing/PictographDataLoader', () => ({
	getRandomPictographData: vi.fn().mockResolvedValue({
		letter: 'A',
		startPos: 'alpha1',
		endPos: 'beta2',
		timing: 'together',
		direction: 'clockwise',
		gridMode: 'diamond',
		gridData: null,
		blueMotionData: { motionType: 'pro' },
		redMotionData: { motionType: 'anti' },
		redPropData: null,
		bluePropData: null,
		redArrowData: null,
		blueArrowData: null,
		grid: 'diamond'
	}),
	getPictographDataByLetter: vi.fn().mockResolvedValue([]),
	getValidPictographSequence: vi.fn().mockResolvedValue([]),
	PictographDataLoader: vi.fn().mockImplementation(() => ({
		getRandomPictographData: vi.fn().mockResolvedValue({
			letter: 'A',
			startPos: 'alpha1',
			endPos: 'beta2',
			timing: 'together',
			direction: 'clockwise',
			gridMode: 'diamond',
			gridData: null,
			blueMotionData: { motionType: 'pro' },
			redMotionData: { motionType: 'anti' },
			redPropData: null,
			bluePropData: null,
			redArrowData: null,
			blueArrowData: null,
			grid: 'diamond'
		})
	}))
}));

describe('Deployment Validation Tests', () => {
	let sequenceService: SequenceService;
	let optionService: OptionService;
	let startPositionService: StartPositionService;
	let layoutService: LayoutService;

	beforeEach(() => {
		// Initialize services in production configuration
		sequenceService = new SequenceService({
			autoSave: true,
			autoSaveDelay: 1000,
			maxBeats: 64,
			enablePlayback: true,
			persistenceKey: 'production_sequence_state'
		});

		optionService = new OptionService(sequenceService);
		startPositionService = new StartPositionService(sequenceService);
		layoutService = new LayoutService();
	});

	afterEach(() => {
		// Clean up any persistent state
		sequenceService.clearSequence();
		vi.clearAllMocks();
	});

	describe('Production Environment Integration', () => {
		it('should initialize all services correctly in production mode', () => {
			expect(sequenceService).toBeDefined();
			expect(sequenceService.state).toBeDefined();
			expect(sequenceService.isEmpty).toBe(true);

			expect(optionService).toBeDefined();
			expect(optionService.state).toBeDefined();
			expect(optionService.hasOptions).toBe(false);

			expect(startPositionService).toBeDefined();
			expect(startPositionService.state).toBeDefined();
			expect(startPositionService.availablePositions).toEqual([]);

			expect(layoutService).toBeDefined();
			expect(layoutService.state).toBeDefined();
		});

		it('should handle complete user workflow: start position → options → beat creation', async () => {
			// Step 1: Load start positions
			await startPositionService.loadPositions();
			expect(startPositionService.state.isLoading).toBe(false);

			// Step 2: Select a start position
			const mockStartPosition: PictographData = {
				letter: 'A',
				startPos: 'alpha1',
				endPos: 'alpha1',
				timing: null,
				direction: null,
				gridMode: 'diamond',
				gridData: null,
				blueMotionData: { motionType: 'static' },
				redMotionData: { motionType: 'static' },
				redPropData: null,
				bluePropData: null,
				redArrowData: null,
				blueArrowData: null,
				grid: 'diamond'
			};

			sequenceService.setStartPosition(mockStartPosition);
			expect(sequenceService.state.startPosition).toEqual(mockStartPosition);

			// Step 3: Load options for the start position
			await optionService.loadOptionsForPosition(mockStartPosition);
			expect(optionService.state.isLoading).toBe(false);

			// Step 4: Select an option and create a beat
			const mockOption: PictographData = {
				letter: 'B',
				startPos: 'alpha1',
				endPos: 'beta2',
				timing: 'together',
				direction: 'clockwise',
				gridMode: 'diamond',
				gridData: null,
				blueMotionData: { motionType: 'pro' },
				redMotionData: { motionType: 'anti' },
				redPropData: null,
				bluePropData: null,
				redArrowData: null,
				blueArrowData: null,
				grid: 'diamond'
			};

			const beatData: BeatData = {
				id: 'beat-1',
				beatNumber: 1,
				filled: true,
				pictographData: mockOption,
				duration: 1,
				metadata: {
					blueReversal: false,
					redReversal: false,
					tags: ['production-test']
				}
			};

			sequenceService.addBeat(beatData);
			expect(sequenceService.state.beats).toHaveLength(1);
			expect(sequenceService.state.beats[0]).toEqual(beatData);
			expect(sequenceService.isEmpty).toBe(false);
		});

		it('should handle responsive layout calculations', () => {
			// Test mobile layout
			layoutService.updateContainerSize(375, 667);
			layoutService.setItemCount(6);
			const mobileLayout = layoutService.calculateOptimalLayout(6);
			expect(mobileLayout.columns).toBeLessThanOrEqual(3);

			// Test tablet layout
			layoutService.updateContainerSize(768, 1024);
			layoutService.setItemCount(8);
			const tabletLayout = layoutService.calculateOptimalLayout(8);
			expect(tabletLayout.columns).toBeGreaterThan(2);
			expect(tabletLayout.columns).toBeLessThanOrEqual(5);

			// Test desktop layout
			layoutService.updateContainerSize(1920, 1080);
			layoutService.setItemCount(12);
			const desktopLayout = layoutService.calculateOptimalLayout(12);
			expect(desktopLayout.columns).toBeGreaterThan(4);
		});
	});

	describe('Performance Validation', () => {
		it('should handle rapid user interactions without lag', async () => {
			const startTime = performance.now();

			// Simulate rapid interactions
			for (let i = 0; i < 10; i++) {
				const mockPosition: PictographData = {
					letter: `${String.fromCharCode(65 + i)}` as any,
					startPos: 'alpha1',
					endPos: 'beta2',
					timing: 'together',
					direction: 'clockwise',
					gridMode: 'diamond',
					gridData: null,
					blueMotionData: { motionType: 'pro' },
					redMotionData: { motionType: 'anti' },
					redPropData: null,
					bluePropData: null,
					redArrowData: null,
					blueArrowData: null,
					grid: 'diamond'
				};

				await optionService.loadOptionsForPosition(mockPosition);
			}

			const endTime = performance.now();
			const totalTime = endTime - startTime;

			// Should complete all operations within reasonable time
			expect(totalTime).toBeLessThan(1000); // 1 second for 10 operations
		});

		it('should maintain memory efficiency during extended usage', () => {
			const initialMemory = process.memoryUsage().heapUsed;

			// Simulate extended usage
			for (let i = 0; i < 100; i++) {
				const beatData: BeatData = {
					id: `beat-${i}`,
					beatNumber: i + 1,
					filled: true,
					pictographData: {
						letter: 'A',
						startPos: 'alpha1',
						endPos: 'beta2',
						timing: 'together',
						direction: 'clockwise',
						gridMode: 'diamond',
						gridData: null,
						blueMotionData: { motionType: 'pro' },
						redMotionData: { motionType: 'anti' },
						redPropData: null,
						bluePropData: null,
						redArrowData: null,
						blueArrowData: null,
						grid: 'diamond'
					},
					duration: 1,
					metadata: {
						blueReversal: false,
						redReversal: false,
						tags: ['memory-test']
					}
				};

				sequenceService.addBeat(beatData);

				// Clear every 10 beats to simulate real usage
				if (i % 10 === 9) {
					sequenceService.clearSequence();
				}
			}

			const finalMemory = process.memoryUsage().heapUsed;
			const memoryIncrease = finalMemory - initialMemory;

			// Memory increase should be reasonable (less than 50MB)
			expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
		});
	});

	describe('Error Recovery', () => {
		it('should recover gracefully from service failures', async () => {
			// Mock a service failure
			const { getNextOptions } = await import('../../services/OptionsService');
			vi.mocked(getNextOptions).mockRejectedValueOnce(new Error('Service unavailable'));

			const mockPosition: PictographData = {
				letter: 'A',
				startPos: 'alpha1',
				endPos: 'beta2',
				timing: 'together',
				direction: 'clockwise',
				gridMode: 'diamond',
				gridData: null,
				blueMotionData: { motionType: 'pro' },
				redMotionData: { motionType: 'anti' },
				redPropData: null,
				bluePropData: null,
				redArrowData: null,
				blueArrowData: null,
				grid: 'diamond'
			};

			// Should handle the error gracefully
			await optionService.loadOptionsForPosition(mockPosition);
			expect(optionService.state.error).toBeTruthy();
			expect(optionService.state.isLoading).toBe(false);

			// Should be able to retry successfully
			vi.mocked(getNextOptions).mockResolvedValueOnce([
				{
					letter: 'C',
					startPos: 'alpha1',
					endPos: 'beta2',
					timing: 'together',
					direction: 'clockwise',
					gridMode: 'diamond',
					gridData: null,
					blueMotionData: { motionType: 'pro' },
					redMotionData: { motionType: 'anti' },
					redPropData: null,
					bluePropData: null,
					redArrowData: null,
					blueArrowData: null,
					grid: 'diamond'
				}
			]);
			await optionService.loadOptionsForPosition(mockPosition);
			expect(optionService.state.error).toBeNull();
		});
	});
});
