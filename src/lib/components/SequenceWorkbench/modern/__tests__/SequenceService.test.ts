/**
 * Modern SequenceService Test Suite
 * Tests the new Svelte 5 service architecture
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SequenceService } from '../../../../services/SequenceService.svelte';
import type { BeatData } from '../../BeatFrame/BeatData';

// Mock browser environment
Object.defineProperty(global, 'window', {
	value: {
		localStorage: {
			getItem: vi.fn(),
			setItem: vi.fn(),
			removeItem: vi.fn()
		}
	},
	writable: true
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
	value: {
		randomUUID: () => Math.random().toString(36).substr(2, 9)
	},
	writable: true
});

describe('SequenceService', () => {
	let service: SequenceService;
	let mockBeat: BeatData;

	beforeEach(() => {
		service = new SequenceService({
			autoSave: false, // Disable auto-save for tests
			maxBeats: 10,
			enablePlayback: true,
			persistenceKey: 'test_sequence'
		});

		mockBeat = {
			id: 'test-beat-1',
			beatNumber: 1,
			filled: true,
			pictographData: {
				letter: null,
				startPos: null,
				endPos: null,
				timing: null,
				direction: null,
				gridMode: 'diamond',
				gridData: null,
				blueMotionData: null,
				redMotionData: null,
				redPropData: null,
				bluePropData: null,
				redArrowData: null,
				blueArrowData: null,
				grid: 'diamond'
			},

			metadata: {
				blueReversal: false,
				redReversal: false,
				tags: []
			}
		};
	});

	describe('Initial State', () => {
		it('should initialize with empty state', () => {
			expect(service.state.beats).toEqual([]);
			expect(service.state.selectedBeatIds).toEqual([]);
			expect(service.state.currentBeatIndex).toBe(0);
			expect(service.state.isModified).toBe(false);
			expect(service.state.isPlaying).toBe(false);
		});

		it('should have correct derived values for empty state', () => {
			expect(service.selectedBeats).toEqual([]);
			expect(service.isEmpty).toBe(true);
			expect(service.currentBeat).toBe(null);
			expect(service.beatCount).toBe(0);
			expect(service.hasSelection).toBe(false);
		});
	});

	describe('Beat Management', () => {
		it('should add a beat correctly', () => {
			service.addBeat(mockBeat);

			expect(service.state.beats).toHaveLength(1);
			expect(service.state.beats[0]).toStrictEqual(mockBeat);
			expect(service.state.isModified).toBe(true);
			expect(service.isEmpty).toBe(false);
			expect(service.beatCount).toBe(1);
		});

		it('should add multiple beats', () => {
			const beats = [mockBeat, { ...mockBeat, id: 'test-beat-2', beatNumber: 2 }];
			service.addBeats(beats);

			expect(service.state.beats).toHaveLength(2);
			expect(service.beatCount).toBe(2);
		});

		it('should respect max beats limit', () => {
			const beats = Array.from({ length: 15 }, (_, i) => ({
				...mockBeat,
				id: `beat-${i}`,
				beatNumber: i + 1
			}));

			service.addBeats(beats);

			expect(service.state.beats).toHaveLength(10); // Max limit
		});

		it('should remove a beat correctly', () => {
			service.addBeat(mockBeat);
			service.removeBeat(mockBeat.id);

			expect(service.state.beats).toHaveLength(0);
			expect(service.isEmpty).toBe(true);
		});

		it('should update a beat correctly', () => {
			service.addBeat(mockBeat);

			const updates = { filled: false, beatNumber: 99 };
			service.updateBeat(mockBeat.id, updates);

			const updatedBeat = service.state.beats[0];
			expect(updatedBeat.filled).toBe(false);
			expect(updatedBeat.beatNumber).toBe(99);
			expect(updatedBeat.id).toBe(mockBeat.id); // ID should remain unchanged
		});

		it('should clear sequence correctly', () => {
			service.addBeat(mockBeat);
			service.selectBeat(mockBeat.id);

			service.clearSequence();

			expect(service.state.beats).toHaveLength(0);
			expect(service.state.selectedBeatIds).toHaveLength(0);
			expect(service.state.currentBeatIndex).toBe(0);
			expect(service.isEmpty).toBe(true);
		});
	});

	describe('Selection Management', () => {
		beforeEach(() => {
			// Add some test beats
			service.addBeats([
				mockBeat,
				{ ...mockBeat, id: 'beat-2', beatNumber: 2 },
				{ ...mockBeat, id: 'beat-3', beatNumber: 3 }
			]);
		});

		it('should select a single beat', () => {
			service.selectBeat('beat-2');

			expect(service.state.selectedBeatIds).toEqual(['beat-2']);
			expect(service.hasSelection).toBe(true);
			expect(service.selectedBeats).toHaveLength(1);
			expect(service.selectedBeats[0].id).toBe('beat-2');
		});

		it('should support multi-select', () => {
			service.selectBeat('test-beat-1', false);
			service.selectBeat('beat-2', true);
			service.selectBeat('beat-3', true);

			expect(service.state.selectedBeatIds).toEqual(['test-beat-1', 'beat-2', 'beat-3']);
			expect(service.selectedBeats).toHaveLength(3);
		});

		it('should deselect beats in multi-select mode', () => {
			service.selectBeat('test-beat-1', false);
			service.selectBeat('beat-2', true);
			service.selectBeat('beat-2', true); // Should deselect

			expect(service.state.selectedBeatIds).toEqual(['test-beat-1']);
		});

		it('should clear selection', () => {
			service.selectBeat('test-beat-1');
			service.selectBeat('beat-2', true);

			service.clearSelection();

			expect(service.state.selectedBeatIds).toHaveLength(0);
			expect(service.hasSelection).toBe(false);
		});

		it('should select all beats', () => {
			service.selectAll();

			expect(service.state.selectedBeatIds).toHaveLength(3);
			expect(service.selectedBeats).toHaveLength(3);
		});

		it('should remove selected beat from selection when beat is deleted', () => {
			service.selectBeat('beat-2');
			service.removeBeat('beat-2');

			expect(service.state.selectedBeatIds).not.toContain('beat-2');
			expect(service.hasSelection).toBe(false);
		});
	});

	describe('Navigation', () => {
		beforeEach(() => {
			service.addBeats([
				mockBeat,
				{ ...mockBeat, id: 'beat-2', beatNumber: 2 },
				{ ...mockBeat, id: 'beat-3', beatNumber: 3 }
			]);
		});

		it('should set current beat index', () => {
			service.setCurrentBeatIndex(1);
			expect(service.state.currentBeatIndex).toBe(1);
			expect(service.currentBeat?.id).toBe('beat-2');
		});

		it('should navigate to next beat', () => {
			service.setCurrentBeatIndex(0);
			service.nextBeat();

			expect(service.state.currentBeatIndex).toBe(1);
			expect(service.currentBeat?.id).toBe('beat-2');
		});

		it('should navigate to previous beat', () => {
			service.setCurrentBeatIndex(2);
			service.previousBeat();

			expect(service.state.currentBeatIndex).toBe(1);
			expect(service.currentBeat?.id).toBe('beat-2');
		});

		it('should not navigate beyond bounds', () => {
			service.setCurrentBeatIndex(0);
			service.previousBeat();
			expect(service.state.currentBeatIndex).toBe(0);

			service.setCurrentBeatIndex(2);
			service.nextBeat();
			expect(service.state.currentBeatIndex).toBe(2);
		});
	});

	describe('Metadata Management', () => {
		it('should update metadata', () => {
			const metadata = {
				name: 'Test Sequence',
				difficulty: 5,
				tags: ['test', 'modern']
			};

			service.updateMetadata(metadata);

			expect(service.state.metadata.name).toBe('Test Sequence');
			expect(service.state.metadata.difficulty).toBe(5);
			expect(service.state.metadata.tags).toEqual(['test', 'modern']);
			expect(service.state.isModified).toBe(true);
		});

		it('should update timestamp when metadata changes', () => {
			const originalTime = service.state.metadata.updatedAt;

			// Wait a bit to ensure timestamp difference
			setTimeout(() => {
				service.updateMetadata({ name: 'Updated' });
				expect(service.state.metadata.updatedAt.getTime()).toBeGreaterThan(originalTime.getTime());
			}, 10);
		});
	});

	describe('State Management', () => {
		it('should mark as saved', () => {
			service.addBeat(mockBeat); // This marks as modified
			expect(service.state.isModified).toBe(true);

			service.markAsSaved();
			expect(service.state.isModified).toBe(false);
		});

		it('should mark as modified', () => {
			expect(service.state.isModified).toBe(false);

			service.markAsModified();
			expect(service.state.isModified).toBe(true);
		});
	});

	describe('Playback Control', () => {
		it('should start playback', () => {
			service.play();
			expect(service.state.isPlaying).toBe(true);
		});

		it('should pause playback', () => {
			service.play();
			service.pause();
			expect(service.state.isPlaying).toBe(false);
		});

		it('should stop playback and reset position', () => {
			service.play();
			service.setPlaybackPosition(5);
			service.stop();

			expect(service.state.isPlaying).toBe(false);
			expect(service.state.playbackPosition).toBe(0);
		});

		it('should set playback position within bounds', () => {
			service.addBeats([mockBeat, { ...mockBeat, id: 'beat-2' }]);

			service.setPlaybackPosition(1);
			expect(service.state.playbackPosition).toBe(1);

			service.setPlaybackPosition(10); // Beyond bounds
			expect(service.state.playbackPosition).toBe(2); // Clamped to beat count

			service.setPlaybackPosition(-1); // Below bounds
			expect(service.state.playbackPosition).toBe(0); // Clamped to 0
		});
	});

	describe('Event System', () => {
		it('should emit events when beats are added', () => {
			const listener = vi.fn();
			service.on('beat:added', listener);

			service.addBeat(mockBeat);

			expect(listener).toHaveBeenCalledWith({ beat: mockBeat });
		});

		it('should emit events when beats are removed', () => {
			const listener = vi.fn();
			service.on('beat:removed', listener);

			service.addBeat(mockBeat);
			service.removeBeat(mockBeat.id);

			expect(listener).toHaveBeenCalledWith({ beatId: mockBeat.id });
		});

		it('should emit events when selection changes', () => {
			const listener = vi.fn();
			service.on('selection:changed', listener);

			service.addBeat(mockBeat);
			service.selectBeat(mockBeat.id);

			expect(listener).toHaveBeenCalledWith({ selectedBeatIds: [mockBeat.id] });
		});

		it('should remove event listeners', () => {
			const listener = vi.fn();
			const unsubscribe = service.on('beat:added', listener);

			unsubscribe();
			service.addBeat(mockBeat);

			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe('Persistence', () => {
		it('should export state correctly', () => {
			service.addBeat(mockBeat);
			service.selectBeat(mockBeat.id);

			const exported = service.exportState();

			expect(exported.beats).toHaveLength(1);
			expect(exported.selectedBeatIds).toEqual([mockBeat.id]);
			expect(exported.isModified).toBe(true);
		});

		it('should import state correctly', () => {
			const importState = {
				beats: [mockBeat],
				selectedBeatIds: [mockBeat.id],
				currentBeatIndex: 0,
				startPosition: null,
				metadata: service.state.metadata,
				isModified: true,
				isPlaying: false,
				playbackPosition: 0
			};

			service.importState(importState);

			expect(service.state.beats).toHaveLength(1);
			expect(service.state.selectedBeatIds).toEqual([mockBeat.id]);
			expect(service.state.isModified).toBe(false); // Should reset on import
		});
	});
});
