/**
 * Core Service Interface for Sequence Management
 * Modern Svelte 5 architecture with proper separation of concerns
 */

import type { BeatData } from '$lib/components/SequenceWorkbench/BeatFrame/BeatData';
import type { PictographData } from '$lib/types/PictographData';

export interface SequenceMetadata {
	name: string;
	difficulty: number;
	tags: string[];
	description: string;
	author: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface SequenceState {
	beats: BeatData[];
	selectedBeatIds: string[];
	currentBeatIndex: number;
	startPosition: PictographData | null;
	metadata: SequenceMetadata;
	isModified: boolean;
	isPlaying: boolean;
	playbackPosition: number;
}

/**
 * Core interface for sequence management service
 * Provides reactive state management with Svelte 5 runes
 */
export interface ISequenceService {
	// Reactive state (read-only)
	readonly state: SequenceState;

	// Derived computations
	readonly selectedBeats: BeatData[];
	readonly isEmpty: boolean;
	readonly currentBeat: BeatData | null;
	readonly beatCount: number;
	readonly hasSelection: boolean;

	// Beat management actions
	addBeat(beat: BeatData): void;
	addBeats(beats: BeatData[]): void;
	removeBeat(beatId: string): void;
	updateBeat(beatId: string, updates: Partial<BeatData>): void;
	clearSequence(): void;

	// Start position management
	setStartPosition(startPosition: PictographData | null): void;

	// Selection management
	selectBeat(beatId: string, multiSelect?: boolean): void;
	deselectBeat(beatId: string): void;
	clearSelection(): void;
	selectAll(): void;

	// Navigation
	setCurrentBeatIndex(index: number): void;
	nextBeat(): void;
	previousBeat(): void;

	// Metadata management
	updateMetadata(metadata: Partial<SequenceMetadata>): void;

	// State management
	markAsSaved(): void;
	markAsModified(): void;

	// Playback control
	play(): void;
	pause(): void;
	stop(): void;
	setPlaybackPosition(position: number): void;

	// Persistence
	saveToLocalStorage(): void;
	loadFromLocalStorage(): boolean;
	exportState(): SequenceState;
	importState(state: SequenceState): void;

	// Event system
	on<K extends keyof SequenceServiceEvents>(
		event: K,
		listener: (data: SequenceServiceEvents[K]) => void
	): () => void;
}

/**
 * Events that the sequence service can emit
 */
export interface SequenceServiceEvents {
	'beat:added': { beat: BeatData };
	'beat:removed': { beatId: string };
	'beat:updated': { beatId: string; beat: BeatData };
	'selection:changed': { selectedBeatIds: string[] };
	'sequence:cleared': {};
	'sequence:changed': { beats: BeatData[]; startPosition: PictographData | null };
	'startPosition:changed': { startPosition: PictographData | null };
	'metadata:updated': { metadata: SequenceMetadata };
	'playback:started': {};
	'playback:paused': {};
	'playback:stopped': {};
	'state:saved': {};
	'state:loaded': {};
}

/**
 * Configuration options for sequence service
 */
export interface SequenceServiceConfig {
	autoSave: boolean;
	autoSaveDelay: number;
	maxBeats: number;
	enablePlayback: boolean;
	persistenceKey: string;
}

export const defaultSequenceServiceConfig: SequenceServiceConfig = {
	autoSave: true,
	autoSaveDelay: 1000,
	maxBeats: 100,
	enablePlayback: true,
	persistenceKey: 'sequence_state'
};

export const defaultSequenceMetadata: SequenceMetadata = {
	name: 'Untitled Sequence',
	difficulty: 1,
	tags: [],
	description: '',
	author: '',
	createdAt: new Date(),
	updatedAt: new Date()
};
