// src/lib/components/SequenceWorkbench/BeatFrame/tests/BeatFrame.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import BeatFrameComposable from '../BeatFrameComposable.svelte';
import { convertContainerBeatsToLegacyFormat, convertLegacyBeatToContainerFormat } from '../utils/beatFrameUtils';

// Mock dependencies
vi.mock('$lib/state/stores/sequence/SequenceContainer', () => ({
	sequenceContainer: {
		state: { beats: [], selectedBeatIds: [] },
		subscribe: vi.fn(() => vi.fn()),
		selectBeat: vi.fn(),
		addBeat: vi.fn(),
		setSequence: vi.fn(),
		saveToLocalStorage: vi.fn()
	}
}));

vi.mock('$lib/stores/sequence/selectionStore', () => ({
	selectedStartPos: {
		subscribe: vi.fn(() => vi.fn()),
		set: vi.fn()
	}
}));

vi.mock('$lib/state/machines/sequenceMachine/persistence', () => ({
	isSequenceEmpty: {
		subscribe: vi.fn(() => vi.fn())
	}
}));

describe('BeatFrame Utilities', () => {
	describe('convertContainerBeatsToLegacyFormat', () => {
		it('should convert container beats to legacy format', () => {
			const containerBeats = [
				{
					id: 'beat-1',
					number: 1,
					redPropData: { prop: 'red' },
					bluePropData: { prop: 'blue' },
					metadata: {
						letter: 'A',
						startPos: 'start',
						endPos: 'end',
						gridMode: 'diamond'
					}
				}
			];

			const result = convertContainerBeatsToLegacyFormat(containerBeats);

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				id: 'beat-1',
				beatNumber: 1,
				filled: true,
				duration: 1,
				pictographData: {
					letter: 'A',
					startPos: 'start',
					endPos: 'end',
					gridMode: 'diamond',
					redPropData: { prop: 'red' },
					bluePropData: { prop: 'blue' }
				}
			});
		});

		it('should handle empty beats array', () => {
			const result = convertContainerBeatsToLegacyFormat([]);
			expect(result).toEqual([]);
		});

		it('should provide default values for missing metadata', () => {
			const containerBeats = [
				{
					id: 'beat-1',
					number: 1
				}
			];

			const result = convertContainerBeatsToLegacyFormat(containerBeats);

			expect(result[0].pictographData).toMatchObject({
				letter: null,
				startPos: null,
				endPos: null,
				gridMode: 'diamond',
				redPropData: null,
				bluePropData: null
			});
		});
	});

	describe('convertLegacyBeatToContainerFormat', () => {
		it('should convert legacy beat to container format', () => {
			const legacyBeat = {
				id: 'beat-1',
				beatNumber: 1,
				filled: true,
				duration: 1,
				pictographData: {
					letter: 'A',
					startPos: 'start',
					endPos: 'end',
					gridMode: 'diamond',
					redPropData: { prop: 'red' },
					bluePropData: { prop: 'blue' }
				},
				metadata: {
					tags: ['test']
				}
			};

			const result = convertLegacyBeatToContainerFormat(legacyBeat);

			expect(result).toMatchObject({
				id: 'beat-1',
				number: 1,
				redPropData: { prop: 'red' },
				bluePropData: { prop: 'blue' },
				metadata: {
					tags: ['test'],
					letter: 'A',
					startPos: 'start',
					endPos: 'end',
					gridMode: 'diamond'
				}
			});
		});

		it('should generate ID if not provided', () => {
			const legacyBeat = {
				beatNumber: 1,
				filled: true,
				pictographData: {
					letter: 'A'
				}
			};

			const result = convertLegacyBeatToContainerFormat(legacyBeat);

			expect(result.id).toBeDefined();
			expect(typeof result.id).toBe('string');
			expect(result.id.length).toBeGreaterThan(0);
		});
	});
});

describe('BeatFrameComposable', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render without errors', () => {
		const { container } = render(BeatFrameComposable);
		expect(container.querySelector('.beat-frame-container')).toBeTruthy();
	});

	it('should apply scrollable class when isScrollable is true', () => {
		const { container } = render(BeatFrameComposable, {
			props: { isScrollable: true }
		});
		
		const containerElement = container.querySelector('.beat-frame-container');
		expect(containerElement?.classList.contains('scrollable-active')).toBe(true);
	});

	it('should apply fullscreen class when fullScreenMode is true', () => {
		const { container } = render(BeatFrameComposable, {
			props: { fullScreenMode: true }
		});
		
		const containerElement = container.querySelector('.beat-frame-container');
		expect(containerElement?.classList.contains('fullscreen-mode')).toBe(true);
	});

	it('should call elementReceiver when provided', () => {
		const elementReceiver = vi.fn();
		
		render(BeatFrameComposable, {
			props: { elementReceiver }
		});

		// elementReceiver should be called when the component mounts
		// Note: This might need adjustment based on the actual timing
		expect(elementReceiver).toHaveBeenCalled();
	});

	it('should expose public API methods', () => {
		const { component } = render(BeatFrameComposable);

		expect(typeof component.addBeat).toBe('function');
		expect(typeof component.clearBeats).toBe('function');
		expect(typeof component.testPersistence).toBe('function');
	});
});

describe('BeatFrame Integration', () => {
	it('should handle beat addition', () => {
		const { component } = render(BeatFrameComposable);

		const beatData = {
			beatNumber: 1,
			filled: true,
			pictographData: {
				letter: 'A',
				startPos: 'start',
				endPos: 'end'
			}
		};

		// This should not throw an error
		expect(() => component.addBeat(beatData)).not.toThrow();
	});

	it('should handle sequence clearing', () => {
		const { component } = render(BeatFrameComposable);

		// This should not throw an error
		expect(() => component.clearBeats()).not.toThrow();
	});

	it('should handle persistence testing', () => {
		const { component } = render(BeatFrameComposable);

		const result = component.testPersistence();
		
		expect(result).toHaveProperty('success');
		expect(result).toHaveProperty('message');
		expect(typeof result.success).toBe('boolean');
		expect(typeof result.message).toBe('string');
	});
});

// Mock browser environment for tests that need it
Object.defineProperty(window, 'localStorage', {
	value: {
		getItem: vi.fn(),
		setItem: vi.fn(),
		removeItem: vi.fn(),
		clear: vi.fn(),
	},
	writable: true,
});

// Mock crypto for ID generation
Object.defineProperty(global, 'crypto', {
	value: {
		randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
	}
});
