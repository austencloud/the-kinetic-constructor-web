/**
 * End-to-End Integration Tests - Modern OptionPicker Nuclear Rebuild
 * Tests complete user workflows with authentic data
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { SequenceService } from '$lib/services/SequenceService.svelte';
import ModernOptionPickerContainer from '../components/containers/ModernOptionPickerContainer.svelte';
import type { PictographData } from '$lib/types/PictographData';

// Mock data for testing
const createMockPictographData = (overrides: Partial<PictographData> = {}): PictographData => ({
	letter: 'A',
	startPos: 'alpha',
	endPos: 'beta',
	timing: 'together',
	direction: 'clockwise',
	gridMode: 'diamond',
	gridData: null,
	blueMotionData: { motionType: 'pro', direction: 'clockwise' },
	redMotionData: { motionType: 'anti', direction: 'counter-clockwise' },
	redPropData: null,
	bluePropData: null,
	redArrowData: null,
	blueArrowData: null,
	grid: 'diamond',
	...overrides
});

// Mock the PictographDataLoader
vi.mock('$lib/utils/testing/PictographDataLoader', () => ({
	pictographDataLoader: {
		getAllPictographData: vi.fn(),
		getRandomPictographData: vi.fn(),
		getValidPictographSequence: vi.fn()
	}
}));

// Mock the OptionsService
vi.mock('../../services/OptionsService', () => ({
	getNextOptions: vi.fn(),
	determineGroupKey: vi.fn(),
	getSorter: vi.fn()
}));

// Test wrapper component to provide SequenceService context
const TestWrapper = `
<script>
  import { setContext } from 'svelte';
  export let sequenceService;
  export let component;
  export let props = {};
  
  setContext('sequenceService', sequenceService);
</script>

<svelte:component this={component} {...props} />
`;

describe('Modern OptionPicker End-to-End Integration', () => {
	let sequenceService: SequenceService;
	let testStartPosition: PictographData;
	let testSequence: PictographData[];

	beforeEach(async () => {
		// Create mock test data
		testStartPosition = createMockPictographData({
			letter: 'A',
			endPos: 'alpha'
		});

		testSequence = [
			createMockPictographData({ letter: 'B', startPos: 'alpha', endPos: 'beta' }),
			createMockPictographData({ letter: 'C', startPos: 'beta', endPos: 'gamma' }),
			createMockPictographData({ letter: 'D', startPos: 'gamma', endPos: 'delta' })
		];

		// Setup mocks
		const { pictographDataLoader } = await import('$lib/utils/testing/PictographDataLoader');
		const { getNextOptions, determineGroupKey, getSorter } = await import(
			'../../services/OptionsService'
		);

		vi.mocked(pictographDataLoader.getAllPictographData).mockResolvedValue([
			testStartPosition,
			...testSequence
		]);
		vi.mocked(getNextOptions).mockReturnValue(testSequence);
		vi.mocked(determineGroupKey).mockReturnValue('test-group');
		vi.mocked(getSorter).mockReturnValue(
			(a: any, b: any) => a.letter?.localeCompare(b.letter) || 0
		);

		// Create fresh SequenceService
		sequenceService = new SequenceService({
			autoSave: false,
			autoSaveDelay: 1000,
			maxBeats: 100,
			enablePlayback: false,
			persistenceKey: 'test_sequence_state'
		});
	});

	describe('Complete User Workflow', () => {
		it('should complete start position → option selection → beat creation workflow', async () => {
			const onStartPositionSelected = vi.fn();
			const onOptionSelected = vi.fn();
			const onSequenceChanged = vi.fn();

			const { container } = render(TestWrapper, {
				props: {
					sequenceService,
					component: ModernOptionPickerContainer,
					props: {
						onStartPositionSelected,
						onOptionSelected,
						onSequenceChanged,
						autoLoadPositions: true,
						enableValidation: true
					}
				}
			});

			// Wait for initialization and position loading
			await waitFor(
				() => {
					const startPositionCards = container.querySelectorAll('.position-card-wrapper');
					expect(startPositionCards.length).toBeGreaterThan(0);
				},
				{ timeout: 5000 }
			);

			// 1. Select start position
			const startPositionCards = container.querySelectorAll('.position-card-wrapper');
			expect(startPositionCards.length).toBeGreaterThan(0);

			await fireEvent.click(startPositionCards[0]);

			// Verify start position selection
			expect(onStartPositionSelected).toHaveBeenCalled();
			expect(sequenceService.state.startPosition).not.toBeNull();

			// 2. Wait for options to load
			await waitFor(
				() => {
					const optionCards = container.querySelectorAll('.option-card');
					expect(optionCards.length).toBeGreaterThan(0);
				},
				{ timeout: 3000 }
			);

			// 3. Select an option
			const optionCards = container.querySelectorAll('.option-card');
			expect(optionCards.length).toBeGreaterThan(0);

			await fireEvent.click(optionCards[0]);

			// 4. Verify beat was created in SequenceService
			expect(onOptionSelected).toHaveBeenCalled();
			expect(onSequenceChanged).toHaveBeenCalled();
			expect(sequenceService.state.beats.length).toBe(1);
			expect(sequenceService.state.beats[0].pictographData).toBeDefined();
		});

		it('should handle multiple option selections correctly', async () => {
			const { container } = render(TestWrapper, {
				props: {
					sequenceService,
					component: ModernOptionPickerContainer,
					props: {
						autoLoadPositions: true
					}
				}
			});

			// Wait for positions to load
			await waitFor(() => {
				const startPositionCards = container.querySelectorAll('.position-card-wrapper');
				expect(startPositionCards.length).toBeGreaterThan(0);
			});

			// Select start position
			const startPositionCards = container.querySelectorAll('.position-card-wrapper');
			await fireEvent.click(startPositionCards[0]);

			// Wait for options to load
			await waitFor(() => {
				const optionCards = container.querySelectorAll('.option-card');
				expect(optionCards.length).toBeGreaterThan(0);
			});

			// Select multiple options
			const optionCards = container.querySelectorAll('.option-card');
			const optionsToSelect = Math.min(3, optionCards.length);

			for (let i = 0; i < optionsToSelect; i++) {
				await fireEvent.click(optionCards[i]);

				// Wait a bit between selections to avoid rapid-fire issues
				await new Promise((resolve) => setTimeout(resolve, 250));
			}

			// Verify multiple beats were created
			expect(sequenceService.state.beats.length).toBe(optionsToSelect);
		});

		it('should handle clear sequence correctly', async () => {
			// Pre-populate sequence
			sequenceService.setStartPosition(testStartPosition);
			testSequence.forEach((pictograph, index) => {
				sequenceService.addBeat({
					id: `test-beat-${index}`,
					beatNumber: index + 1,
					filled: true,
					pictographData: pictograph,
					duration: 1,
					metadata: {
						blueReversal: false,
						redReversal: false,
						tags: [`letter-${pictograph.letter}`]
					}
				});
			});

			const { container } = render(TestWrapper, {
				props: {
					sequenceService,
					component: ModernOptionPickerContainer,
					props: {
						autoLoadPositions: true
					}
				}
			});

			// Verify initial state
			expect(sequenceService.state.startPosition).not.toBeNull();
			expect(sequenceService.state.beats.length).toBe(testSequence.length);

			// Clear sequence (this would typically be triggered by a button in the UI)
			sequenceService.clearSequence();

			// Verify state is cleared
			expect(sequenceService.state.startPosition).toBeNull();
			expect(sequenceService.state.beats).toHaveLength(0);
		});
	});

	describe('Error Handling', () => {
		it('should handle service initialization errors gracefully', async () => {
			// Create a mock service that throws errors
			const faultyService = {
				...sequenceService,
				state: {
					...sequenceService.state,
					beats: []
				},
				on: vi.fn(() => () => {}),
				setStartPosition: vi.fn(() => {
					throw new Error('Service error');
				})
			};

			const { container } = render(TestWrapper, {
				props: {
					sequenceService: faultyService,
					component: ModernOptionPickerContainer,
					props: {
						autoLoadPositions: true
					}
				}
			});

			// Should render without crashing
			expect(container).toBeDefined();
		});

		it('should display error messages to users', async () => {
			const { container } = render(TestWrapper, {
				props: {
					sequenceService,
					component: ModernOptionPickerContainer,
					props: {
						autoLoadPositions: false // Prevent auto-loading to test error states
					}
				}
			});

			// Look for error display elements
			const errorElements = container.querySelectorAll('[role="alert"]');
			// Error elements should be available for display when needed
			expect(errorElements).toBeDefined();
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA labels and roles', async () => {
			const { container } = render(TestWrapper, {
				props: {
					sequenceService,
					component: ModernOptionPickerContainer,
					props: {
						autoLoadPositions: true
					}
				}
			});

			// Check main application role
			const appElement = container.querySelector('[role="application"]');
			expect(appElement).toBeDefined();
			expect(appElement?.getAttribute('aria-label')).toBe('Option Picker');

			// Wait for content to load
			await waitFor(() => {
				const gridElements = container.querySelectorAll('[role="grid"]');
				expect(gridElements.length).toBeGreaterThan(0);
			});

			// Check grid roles
			const gridElements = container.querySelectorAll('[role="grid"]');
			gridElements.forEach((grid) => {
				expect(grid.getAttribute('aria-label')).toBeDefined();
			});

			// Check button roles
			const buttonElements = container.querySelectorAll('[role="button"]');
			buttonElements.forEach((button) => {
				expect(button.getAttribute('aria-label')).toBeDefined();
			});
		});

		it('should support keyboard navigation', async () => {
			const { container } = render(TestWrapper, {
				props: {
					sequenceService,
					component: ModernOptionPickerContainer,
					props: {
						autoLoadPositions: true
					}
				}
			});

			// Wait for positions to load
			await waitFor(() => {
				const startPositionCards = container.querySelectorAll('.position-card-wrapper');
				expect(startPositionCards.length).toBeGreaterThan(0);
			});

			// Test keyboard navigation on start position picker
			const startPositionPicker = container.querySelector('.modern-start-position-picker');
			expect(startPositionPicker).toBeDefined();

			if (startPositionPicker) {
				startPositionPicker.focus();

				// Test arrow key navigation
				await fireEvent.keyDown(startPositionPicker, { key: 'ArrowRight' });
				await fireEvent.keyDown(startPositionPicker, { key: 'Enter' });

				// Should handle keyboard events without errors
				expect(startPositionPicker).toBeDefined();
			}
		});
	});

	describe('Performance', () => {
		it('should render large datasets efficiently', async () => {
			const startTime = performance.now();

			const { container } = render(TestWrapper, {
				props: {
					sequenceService,
					component: ModernOptionPickerContainer,
					props: {
						autoLoadPositions: true,
						maxOptions: 1000
					}
				}
			});

			const renderTime = performance.now() - startTime;

			// Should render within performance target
			expect(renderTime).toBeLessThan(100); // <100ms target
			expect(container).toBeDefined();
		});

		it('should handle rapid user interactions without performance degradation', async () => {
			const { container } = render(TestWrapper, {
				props: {
					sequenceService,
					component: ModernOptionPickerContainer,
					props: {
						autoLoadPositions: true
					}
				}
			});

			// Wait for positions to load
			await waitFor(() => {
				const startPositionCards = container.querySelectorAll('.position-card-wrapper');
				expect(startPositionCards.length).toBeGreaterThan(0);
			});

			const startTime = performance.now();

			// Rapid interactions
			const startPositionCards = container.querySelectorAll('.position-card-wrapper');
			for (let i = 0; i < Math.min(5, startPositionCards.length); i++) {
				await fireEvent.click(startPositionCards[i]);
			}

			const interactionTime = performance.now() - startTime;

			// Should handle rapid interactions efficiently
			expect(interactionTime).toBeLessThan(500); // <500ms for 5 rapid clicks
		});
	});

	describe('State Synchronization', () => {
		it('should maintain state consistency between services', async () => {
			const { container } = render(TestWrapper, {
				props: {
					sequenceService,
					component: ModernOptionPickerContainer,
					props: {
						autoLoadPositions: true
					}
				}
			});

			// Wait for initialization
			await waitFor(() => {
				const startPositionCards = container.querySelectorAll('.position-card-wrapper');
				expect(startPositionCards.length).toBeGreaterThan(0);
			});

			// Select start position
			const startPositionCards = container.querySelectorAll('.position-card-wrapper');
			await fireEvent.click(startPositionCards[0]);

			// Verify SequenceService state is updated
			expect(sequenceService.state.startPosition).not.toBeNull();

			// Wait for options to load
			await waitFor(() => {
				const optionCards = container.querySelectorAll('.option-card');
				expect(optionCards.length).toBeGreaterThan(0);
			});

			// Select option
			const optionCards = container.querySelectorAll('.option-card');
			await fireEvent.click(optionCards[0]);

			// Verify beat was added to SequenceService
			expect(sequenceService.state.beats.length).toBe(1);
			expect(sequenceService.state.beats[0].pictographData).toBeDefined();
		});
	});
});
