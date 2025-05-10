/**
 * Tests for the modern sequence container
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sequenceContainer } from './SequenceContainer';
import type { BeatData } from './SequenceContainer';
import { getState } from '$lib/state/core/modernTesting';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value.toString();
		}),
		clear: vi.fn(() => {
			store = {};
		})
	};
})();

// Mock browser environment
vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('browser', true);

describe('Modern Sequence Container', () => {
	// Reset the container before each test
	beforeEach(() => {
		sequenceContainer.reset();
		localStorageMock.clear();
	});

	it('should have the correct initial state', () => {
		const state = getState(sequenceContainer);
		expect(state.beats).toEqual([]);
		expect(state.selectedBeatIds).toEqual([]);
		expect(state.currentBeatIndex).toBe(0);
		expect(state.isModified).toBe(false);
		expect(state.metadata.name).toBe('');
		expect(state.metadata.difficulty).toBe(0);
		expect(state.metadata.tags).toEqual([]);
		expect(state.metadata.createdAt).toBeInstanceOf(Date);
		expect(state.metadata.lastModified).toBeInstanceOf(Date);
	});

	it('should add a beat', () => {
		const beat: BeatData = {
			id: '1',
			number: 1,
			letter: 'A'
		};

		sequenceContainer.addBeat(beat);

		const state = getState(sequenceContainer);
		expect(state.beats).toHaveLength(1);
		expect(state.beats[0]).toEqual(beat);
		expect(state.isModified).toBe(true);
	});

	it('should add multiple beats', () => {
		const beats: BeatData[] = [
			{ id: '1', number: 1, letter: 'A' },
			{ id: '2', number: 2, letter: 'B' }
		];

		sequenceContainer.addBeats(beats);

		const state = getState(sequenceContainer);
		expect(state.beats).toHaveLength(2);
		expect(state.beats).toEqual(beats);
		expect(state.isModified).toBe(true);
	});

	it('should set the entire sequence', () => {
		const beats: BeatData[] = [
			{ id: '1', number: 1, letter: 'A' },
			{ id: '2', number: 2, letter: 'B' }
		];

		// First add a beat to ensure it gets replaced
		sequenceContainer.addBeat({ id: '3', number: 3, letter: 'C' });

		// Then set the sequence
		sequenceContainer.setSequence(beats);

		const state = getState(sequenceContainer);
		expect(state.beats).toHaveLength(2);
		expect(state.beats).toEqual(beats);
		expect(state.isModified).toBe(true);
		expect(state.currentBeatIndex).toBe(0);
		expect(state.selectedBeatIds).toEqual([]);
	});

	it('should remove a beat', () => {
		const beats: BeatData[] = [
			{ id: '1', number: 1, letter: 'A' },
			{ id: '2', number: 2, letter: 'B' }
		];

		sequenceContainer.setSequence(beats);
		sequenceContainer.removeBeat('1');

		const state = getState(sequenceContainer);
		expect(state.beats).toHaveLength(1);
		expect(state.beats[0].id).toBe('2');
		expect(state.isModified).toBe(true);
	});

	it('should update a beat', () => {
		const beats: BeatData[] = [
			{ id: '1', number: 1, letter: 'A' },
			{ id: '2', number: 2, letter: 'B' }
		];

		sequenceContainer.setSequence(beats);
		sequenceContainer.updateBeat('1', { letter: 'X' });

		const state = getState(sequenceContainer);
		expect(state.beats[0].letter).toBe('X');
		expect(state.beats[0].number).toBe(1); // Other properties should remain
		expect(state.isModified).toBe(true);
	});

	it('should select a beat', () => {
		const beats: BeatData[] = [
			{ id: '1', number: 1, letter: 'A' },
			{ id: '2', number: 2, letter: 'B' }
		];

		sequenceContainer.setSequence(beats);
		sequenceContainer.selectBeat('1');

		const state = getState(sequenceContainer);
		expect(state.selectedBeatIds).toEqual(['1']);
	});

	it('should support multi-select', () => {
		const beats: BeatData[] = [
			{ id: '1', number: 1, letter: 'A' },
			{ id: '2', number: 2, letter: 'B' },
			{ id: '3', number: 3, letter: 'C' }
		];

		sequenceContainer.setSequence(beats);
		sequenceContainer.selectBeat('1');
		sequenceContainer.selectBeat('2', true); // Multi-select

		const state = getState(sequenceContainer);
		expect(state.selectedBeatIds).toEqual(['1', '2']);
	});

	it('should deselect a beat', () => {
		const beats: BeatData[] = [
			{ id: '1', number: 1, letter: 'A' },
			{ id: '2', number: 2, letter: 'B' }
		];

		sequenceContainer.setSequence(beats);
		sequenceContainer.selectBeat('1');
		sequenceContainer.selectBeat('2', true);
		sequenceContainer.deselectBeat('1');

		const state = getState(sequenceContainer);
		expect(state.selectedBeatIds).toEqual(['2']);
	});

	it('should clear selection', () => {
		const beats: BeatData[] = [
			{ id: '1', number: 1, letter: 'A' },
			{ id: '2', number: 2, letter: 'B' }
		];

		sequenceContainer.setSequence(beats);
		sequenceContainer.selectBeat('1');
		sequenceContainer.selectBeat('2', true);
		sequenceContainer.clearSelection();

		const state = getState(sequenceContainer);
		expect(state.selectedBeatIds).toEqual([]);
	});

	it('should set current beat index', () => {
		const beats: BeatData[] = [
			{ id: '1', number: 1, letter: 'A' },
			{ id: '2', number: 2, letter: 'B' }
		];

		sequenceContainer.setSequence(beats);
		sequenceContainer.setCurrentBeatIndex(1);

		const state = getState(sequenceContainer);
		expect(state.currentBeatIndex).toBe(1);
	});

	it('should update metadata', () => {
		sequenceContainer.updateMetadata({
			name: 'Test Sequence',
			difficulty: 3,
			tags: ['test', 'sequence']
		});

		const state = getState(sequenceContainer);
		expect(state.metadata.name).toBe('Test Sequence');
		expect(state.metadata.difficulty).toBe(3);
		expect(state.metadata.tags).toEqual(['test', 'sequence']);
		expect(state.isModified).toBe(true);
	});

	it('should mark as saved', () => {
		sequenceContainer.addBeat({ id: '1', number: 1 });
		expect(getState(sequenceContainer).isModified).toBe(true);

		sequenceContainer.markAsSaved();
		expect(getState(sequenceContainer).isModified).toBe(false);
	});

	it('should save to localStorage', () => {
		const beats: BeatData[] = [
			{ id: '1', number: 1, letter: 'A' },
			{ id: '2', number: 2, letter: 'B' }
		];

		sequenceContainer.setSequence(beats);
		sequenceContainer.saveToLocalStorage();

		expect(localStorageMock.setItem).toHaveBeenCalledWith('sequence', expect.any(String));
		const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
		expect(savedData.beats).toHaveLength(2);
		expect(savedData.beats[0].id).toBe('1');
		expect(savedData.beats[1].id).toBe('2');
	});

	it('should load from localStorage', () => {
		const beats: BeatData[] = [
			{ id: '1', number: 1, letter: 'A' },
			{ id: '2', number: 2, letter: 'B' }
		];

		const mockData = {
			beats,
			selectedBeatIds: ['1'],
			currentBeatIndex: 1,
			isModified: false,
			metadata: {
				name: 'Saved Sequence',
				difficulty: 2,
				tags: ['saved'],
				createdAt: new Date().toISOString(),
				lastModified: new Date().toISOString()
			}
		};

		localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockData));

		const result = sequenceContainer.loadFromLocalStorage();

		expect(result).toBe(true);
		expect(localStorageMock.getItem).toHaveBeenCalledWith('sequence');

		const state = getState(sequenceContainer);
		expect(state.beats).toHaveLength(2);
		expect(state.selectedBeatIds).toEqual(['1']);
		expect(state.currentBeatIndex).toBe(1);
		expect(state.metadata.name).toBe('Saved Sequence');
	});
});
