/**
 * Simple Start Position Reactivity Test
 * Tests the basic reactivity chain without browser automation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sequenceState } from '$lib/state/sequence/sequenceState.svelte';
import {
	getSelectedStartPosition,
	setSelectedStartPosition
} from '$lib/state/sequence/selectionState.svelte';
import type { PictographData } from '$lib/types/PictographData';
import { Letter } from '$lib/types/Letter';
import type { TKAPosition } from '$lib/types/TKAPosition';

// Mock browser environment
const mockDispatchEvent = vi.fn();
Object.defineProperty(global, 'window', {
	value: {
		localStorage: {
			getItem: vi.fn(),
			setItem: vi.fn(),
			removeItem: vi.fn()
		},
		document: {
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: mockDispatchEvent
		}
	},
	writable: true
});

// Also mock global document
Object.defineProperty(global, 'document', {
	value: {
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: mockDispatchEvent
	},
	writable: true
});

// Mock browser module
vi.mock('$app/environment', () => ({
	browser: true
}));

describe('Start Position Reactivity Chain', () => {
	const mockStartPosition: PictographData = {
		letter: Letter.A,
		startPos: 'alpha1',
		endPos: 'alpha1',
		timing: 'split',
		direction: 'same',
		gridMode: 'diamond',
		gridData: null,
		redPropData: null,
		bluePropData: null,
		redMotionData: {
			id: 'red-test',
			motionType: 'static',
			startOri: 'in',
			endOri: 'in',
			propRotDir: 'no_rot',
			startLoc: 's',
			endLoc: 's',
			turns: 0,
			color: 'red',
			leadState: null,
			prefloatMotionType: null,
			prefloatPropRotDir: null
		},
		blueMotionData: {
			id: 'blue-test',
			motionType: 'static',
			startOri: 'in',
			endOri: 'in',
			propRotDir: 'no_rot',
			startLoc: 's',
			endLoc: 's',
			turns: 0,
			color: 'blue',
			leadState: null,
			prefloatMotionType: null,
			prefloatPropRotDir: null
		},
		redArrowData: null,
		blueArrowData: null,
		grid: 'diamond'
	};

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();
		mockDispatchEvent.mockClear();

		// Clear sequence state
		sequenceState.clearSequence();

		// Clear selection state
		setSelectedStartPosition(null);
	});

	it('should update sequence state when start position is set', async () => {
		// Verify initial state
		expect(sequenceState.startPosition).toBeNull();
		expect(getSelectedStartPosition()).toBeNull();

		// Set start position through sequence state
		await sequenceState.setStartPosition(mockStartPosition);

		// Verify sequence state is updated
		expect(sequenceState.startPosition).toBeTruthy();
		expect(sequenceState.startPosition?.letter).toBe(Letter.A);
		expect(sequenceState.startPosition?.startPos).toBe('alpha1');

		console.log('✅ TEST: Sequence state updated correctly');
	});

	it('should synchronize selection state with sequence state', async () => {
		// Set start position through sequence state
		await sequenceState.setStartPosition(mockStartPosition);

		// Verify selection state is synchronized
		const selectedStartPos = getSelectedStartPosition();
		expect(selectedStartPos).toBeTruthy();
		expect(selectedStartPos?.letter).toBe(Letter.A);
		expect(selectedStartPos?.startPos).toBe('alpha1');

		console.log('✅ TEST: Selection state synchronized correctly');
	});

	it('should dispatch start-position-selected event', async () => {
		// Set start position
		await sequenceState.setStartPosition(mockStartPosition);

		// Verify event was dispatched
		expect(mockDispatchEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'start-position-selected',
				detail: expect.objectContaining({
					startPosition: expect.objectContaining({
						letter: Letter.A,
						startPos: 'alpha1'
					})
				})
			})
		);

		console.log('✅ TEST: Event dispatched correctly');
	});

	it('should handle multiple start position updates', async () => {
		// Set first start position
		await sequenceState.setStartPosition(mockStartPosition);

		// Set second start position
		const secondStartPosition: PictographData = {
			...mockStartPosition,
			letter: Letter.B,
			startPos: 'beta1' as TKAPosition,
			endPos: 'beta1' as TKAPosition
		};
		await sequenceState.setStartPosition(secondStartPosition);

		// Verify final state
		expect(sequenceState.startPosition?.letter).toBe(Letter.B);
		expect(sequenceState.startPosition?.startPos).toBe('beta1');

		// Verify selection state is updated
		const selectedStartPos = getSelectedStartPosition();
		expect(selectedStartPos?.letter).toBe(Letter.B);
		expect(selectedStartPos?.startPos).toBe('beta1');

		// Verify events were dispatched for both updates
		expect(mockDispatchEvent).toHaveBeenCalledTimes(2);

		console.log('✅ TEST: Multiple updates handled correctly');
	});

	it('should verify no infinite reactive loops occur', async () => {
		let effectExecutionCount = 0;
		const maxAllowedExecutions = 3;

		// Mock effect tracking
		const originalConsoleLog = console.log;
		console.log = (...args) => {
			if (args[0]?.includes('setStartPosition reactive updates')) {
				effectExecutionCount++;
				if (effectExecutionCount > maxAllowedExecutions) {
					throw new Error(`Infinite reactive loop detected: ${effectExecutionCount} executions`);
				}
			}
			originalConsoleLog(...args);
		};

		try {
			// Set start position
			await sequenceState.setStartPosition(mockStartPosition);

			// Verify execution count is within limits
			expect(effectExecutionCount).toBeLessThanOrEqual(maxAllowedExecutions);

			console.log(
				`✅ TEST: Reactive effects executed ${effectExecutionCount} times (within limit)`
			);
		} finally {
			// Restore console.log
			console.log = originalConsoleLog;
		}
	});
});
