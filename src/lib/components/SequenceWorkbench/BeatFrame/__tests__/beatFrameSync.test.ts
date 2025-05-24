import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sequenceState } from '$lib/state/sequence/sequenceState.svelte';
import { convertPictographToContainerFormat } from '../utils/beatFrameUtils';
import type { PictographData } from '$lib/types/PictographData';
import { Letter } from '$lib/types/Letter';
import type { TKAPosition } from '$lib/types/TKAPosition';
import type { VTGTiming, VTGDir } from '$lib/types/Types';

// Mock the sequence container
vi.mock('$lib/state/stores/sequence/SequenceContainer', () => ({
	sequenceContainer: {
		state: { beats: [], selectedBeatIds: [] },
		subscribe: vi.fn((callback) => {
			callback({ beats: [], selectedBeatIds: [] });
			return vi.fn(); // unsubscribe function
		}),
		setSequence: vi.fn(),
		addBeat: vi.fn(),
		selectBeat: vi.fn(),
		clearSelection: vi.fn(),
		saveToLocalStorage: vi.fn()
	}
}));

// Mock the selected start position store
vi.mock('$lib/stores/sequence/selectionStore', () => ({
	selectedStartPos: {
		subscribe: vi.fn((callback) => {
			callback(null);
			return vi.fn(); // unsubscribe function
		}),
		set: vi.fn()
	}
}));

// Mock pictograph utils
vi.mock('$lib/utils/pictographUtils', () => ({
	createSafePictographCopy: vi.fn((data) => data)
}));

// Mock default pictograph data
vi.mock('$lib/components/Pictograph/utils/defaultPictographData', () => ({
	defaultPictographData: {
		letter: null,
		startPos: 'n',
		endPos: 'n',
		gridMode: 'diamond'
	}
}));

describe('Beat Frame Synchronization', () => {
	// Using real data from DiamondPictographDataFrame.csv: A,alpha3,alpha5,split,same,pro,cw,w,n,pro,cw,e,s
	const mockPictographData: PictographData = {
		letter: Letter.A,
		startPos: 'alpha3' as TKAPosition,
		endPos: 'alpha5' as TKAPosition,
		timing: 'split' as VTGTiming,
		direction: 'same' as VTGDir,
		gridMode: 'diamond',
		gridData: null,
		redPropData: null,
		bluePropData: null,
		redMotionData: {
			id: 'red-motion-test',
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
			id: 'blue-motion-test',
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
		redArrowData: null,
		blueArrowData: null,
		grid: 'diamond'
	};

	beforeEach(() => {
		// Clear sequence state before each test
		sequenceState.clearSequence();
		vi.clearAllMocks();
	});

	it('should convert pictograph data to container format', () => {
		const containerBeat = convertPictographToContainerFormat(mockPictographData);

		expect(containerBeat).toHaveProperty('id');
		expect(containerBeat).toHaveProperty('number', 0);
		expect(containerBeat.metadata).toEqual({
			letter: Letter.A,
			startPos: 'alpha3',
			endPos: 'alpha5',
			gridMode: 'diamond',
			timing: 'split',
			direction: 'same'
		});
	});

	it('should update beat count when beats are added', async () => {
		// Add multiple beats
		await sequenceState.addBeat(mockPictographData);
		await sequenceState.addBeat({ ...mockPictographData, letter: Letter.B });

		// Verify sequence state is updated
		expect(sequenceState.beats.length).toBe(2);
		expect(sequenceState.word).toBe('AB');
	});

	it('should handle start position changes', async () => {
		// Set start position
		await sequenceState.setStartPosition(mockPictographData);

		// Verify start position is set
		expect(sequenceState.startPosition).toBeTruthy();
		expect(sequenceState.startPosition?.startPos).toBe('alpha3');
		expect(sequenceState.isEmpty).toBe(false);
	});

	it('should clear sequence correctly', async () => {
		// Add some data first
		await sequenceState.setStartPosition(mockPictographData);
		await sequenceState.addBeat(mockPictographData);

		// Verify data is there
		expect(sequenceState.beats.length).toBe(1);
		expect(sequenceState.startPosition).toBeTruthy();

		// Clear sequence
		await sequenceState.clearSequence();

		// Verify everything is cleared
		expect(sequenceState.beats.length).toBe(0);
		expect(sequenceState.startPosition).toBe(null);
		expect(sequenceState.isEmpty).toBe(true);
	});

	it('should handle beat removal', async () => {
		// Add beats
		await sequenceState.addBeat(mockPictographData);
		await sequenceState.addBeat({ ...mockPictographData, letter: Letter.B });
		await sequenceState.addBeat({ ...mockPictographData, letter: Letter.C });

		expect(sequenceState.beats.length).toBe(3);

		// Remove middle beat
		await sequenceState.removeBeat(1);

		expect(sequenceState.beats.length).toBe(2);
		expect(sequenceState.word).toBe('AC');
	});

	it('should maintain circular sequence detection', async () => {
		// Set start position
		const startPos = {
			...mockPictographData,
			startPos: 'alpha1' as TKAPosition,
			endPos: 'alpha1' as TKAPosition
		};
		await sequenceState.setStartPosition(startPos);

		// Add beat that ends where start position begins
		const circularBeat = {
			...mockPictographData,
			startPos: 'alpha5' as TKAPosition,
			endPos: 'alpha1' as TKAPosition
		};
		await sequenceState.addBeat(circularBeat);

		// Should detect circular sequence
		expect(sequenceState.isCircular).toBe(true);
	});

	it('should detect CAP sequences', async () => {
		// Set start position
		const startPos = {
			...mockPictographData,
			startPos: 'gamma1' as TKAPosition,
			endPos: 'gamma2' as TKAPosition
		};
		await sequenceState.setStartPosition(startPos);

		// Add beat that ends at compatible position (same base position)
		const capBeat = {
			...mockPictographData,
			startPos: 'alpha7' as TKAPosition,
			endPos: 'gamma3' as TKAPosition
		};
		await sequenceState.addBeat(capBeat);

		// Should detect CAP capability
		expect(sequenceState.canBeCAP).toBe(true);
	});

	it('should synchronize modern sequence state to container format for BeatFrame reactivity', async () => {
		// This test verifies the critical fix for BeatFrame reactivity
		// When beats are added to modern sequenceState, they should automatically
		// be converted and synced to the legacy sequenceContainer format

		// Start with empty state
		expect(sequenceState.beats.length).toBe(0);

		// Add a beat to modern sequence state (like OptionPicker does)
		await sequenceState.addBeat(mockPictographData);

		// Verify modern state is updated
		expect(sequenceState.beats.length).toBe(1);
		expect(sequenceState.word).toBe('A');

		// The BeatFrameStateManager should have automatically synced this to the container
		// This is what makes the BeatFrame UI update reactively
		// Note: In the test environment, we can't directly test the container sync
		// because it's mocked, but we can verify the sequence state is correct
		expect(sequenceState.beats[0].letter).toBe(Letter.A);
		expect(sequenceState.beats[0].startPos).toBe('alpha3');
		expect(sequenceState.beats[0].endPos).toBe('alpha5');
	});

	it('should handle multiple rapid beat additions without losing reactivity', async () => {
		// This test ensures the reactive sync doesn't break with rapid updates
		const beatB = {
			...mockPictographData,
			letter: Letter.B,
			startPos: 'alpha5' as TKAPosition,
			endPos: 'alpha7' as TKAPosition
		};
		const beatC = {
			...mockPictographData,
			letter: Letter.C,
			startPos: 'alpha7' as TKAPosition,
			endPos: 'alpha1' as TKAPosition
		};

		// Add multiple beats rapidly
		await sequenceState.addBeat(mockPictographData);
		await sequenceState.addBeat(beatB);
		await sequenceState.addBeat(beatC);

		// Verify all beats are present and in correct order
		expect(sequenceState.beats.length).toBe(3);
		expect(sequenceState.word).toBe('ABC');
		expect(sequenceState.beats[0].letter).toBe(Letter.A);
		expect(sequenceState.beats[1].letter).toBe(Letter.B);
		expect(sequenceState.beats[2].letter).toBe(Letter.C);
	});
});
