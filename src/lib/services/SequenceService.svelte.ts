/**
 * Modern Sequence Service Implementation
 * Uses Svelte 5 runes for reactive state management
 * Eliminates reactive loops through proper $derived usage
 */

import type {
	ISequenceService,
	SequenceState,
	SequenceMetadata,
	SequenceServiceConfig,
	SequenceServiceEvents
} from './core/ISequenceService';
import { defaultSequenceMetadata, defaultSequenceServiceConfig } from './core/ISequenceService';
import type { BeatData } from '$lib/components/SequenceWorkbench/BeatFrame/BeatData';
import type { PictographData } from '$lib/types/PictographData';
import { browser } from '$app/environment';

/**
 * Modern Sequence Service using Svelte 5 runes
 * Provides reactive state management without manual subscriptions
 */
export class SequenceService implements ISequenceService {
	private config: SequenceServiceConfig;
	private eventListeners = new Map<keyof SequenceServiceEvents, Set<Function>>();

	// Core reactive state using $state
	private _state = $state<SequenceState>({
		beats: [],
		selectedBeatIds: [],
		currentBeatIndex: 0,
		startPosition: null,
		metadata: { ...defaultSequenceMetadata },
		isModified: false,
		isPlaying: false,
		playbackPosition: 0
	});

	constructor(config: Partial<SequenceServiceConfig> = {}) {
		console.log('🔧 SequenceService constructor called with config:', config);

		this.config = { ...defaultSequenceServiceConfig, ...config };

		// Set up auto-save effect
		if (this.config.autoSave) {
			this.setupAutoSave();
		}

		console.log('✅ SequenceService initialized successfully');
	}

	// Public readonly access to state
	get state(): SequenceState {
		return this._state;
	}

	// Derived computations using $derived (NO manual subscriptions)
	readonly selectedBeats = $derived(
		this._state.beats.filter((beat) => this._state.selectedBeatIds.includes(beat.id))
	);

	readonly isEmpty = $derived(this._state.beats.length === 0 && this._state.startPosition === null);

	readonly currentBeat = $derived(this._state.beats[this._state.currentBeatIndex] || null);

	readonly beatCount = $derived(this._state.beats.length);

	readonly hasSelection = $derived(this._state.selectedBeatIds.length > 0);

	// Beat management actions (pure functions)
	addBeat(beat: BeatData): void {
		if (this._state.beats.length >= this.config.maxBeats) {
			console.warn(`Maximum beats limit (${this.config.maxBeats}) reached`);
			return;
		}

		this._state.beats = [...this._state.beats, beat];
		this._state.metadata.updatedAt = new Date();
		this.markAsModified();
		this.emit('beat:added', { beat });
	}

	addBeats(beats: BeatData[]): void {
		const availableSlots = this.config.maxBeats - this._state.beats.length;
		const beatsToAdd = beats.slice(0, availableSlots);

		if (beatsToAdd.length < beats.length) {
			console.warn(`Only ${beatsToAdd.length} of ${beats.length} beats added due to limit`);
		}

		this._state.beats = [...this._state.beats, ...beatsToAdd];
		this._state.metadata.updatedAt = new Date();
		this.markAsModified();

		beatsToAdd.forEach((beat) => this.emit('beat:added', { beat }));
	}

	removeBeat(beatId: string): void {
		const beatIndex = this._state.beats.findIndex((beat) => beat.id === beatId);
		if (beatIndex === -1) return;

		this._state.beats = this._state.beats.filter((beat) => beat.id !== beatId);
		this._state.selectedBeatIds = this._state.selectedBeatIds.filter((id) => id !== beatId);

		// Adjust current beat index if necessary
		if (this._state.currentBeatIndex >= this._state.beats.length) {
			this._state.currentBeatIndex = Math.max(0, this._state.beats.length - 1);
		}

		this._state.metadata.updatedAt = new Date();
		this.markAsModified();
		this.emit('beat:removed', { beatId });
	}

	updateBeat(beatId: string, updates: Partial<BeatData>): void {
		const beatIndex = this._state.beats.findIndex((beat) => beat.id === beatId);
		if (beatIndex === -1) return;

		const updatedBeat = { ...this._state.beats[beatIndex], ...updates };
		this._state.beats = this._state.beats.map((beat, index) =>
			index === beatIndex ? updatedBeat : beat
		);

		this._state.metadata.updatedAt = new Date();
		this.markAsModified();
		this.emit('beat:updated', { beatId, beat: updatedBeat });
	}

	clearSequence(): void {
		this._state.beats = [];
		this._state.selectedBeatIds = [];
		this._state.currentBeatIndex = 0;
		this._state.startPosition = null;
		this._state.playbackPosition = 0;
		this._state.isPlaying = false;
		this._state.metadata.updatedAt = new Date();
		this.markAsModified();
		this.emit('sequence:cleared', {});
	}

	// Start position management
	setStartPosition(startPosition: PictographData | null): void {
		this._state.startPosition = startPosition;
		this._state.metadata.updatedAt = new Date();
		this.markAsModified();

		// Emit the start position change event
		this.emit('startPosition:changed', { startPosition });

		// Also emit a sequence change event since the sequence is no longer empty
		if (startPosition) {
			this.emit('sequence:changed', {
				beats: this._state.beats,
				startPosition: this._state.startPosition
			});
		}
	}

	// Selection management (pure functions)
	selectBeat(beatId: string, multiSelect = false): void {
		if (multiSelect) {
			if (this._state.selectedBeatIds.includes(beatId)) {
				this._state.selectedBeatIds = this._state.selectedBeatIds.filter((id) => id !== beatId);
			} else {
				this._state.selectedBeatIds = [...this._state.selectedBeatIds, beatId];
			}
		} else {
			this._state.selectedBeatIds = [beatId];
		}

		this.emit('selection:changed', { selectedBeatIds: this._state.selectedBeatIds });
	}

	deselectBeat(beatId: string): void {
		this._state.selectedBeatIds = this._state.selectedBeatIds.filter((id) => id !== beatId);
		this.emit('selection:changed', { selectedBeatIds: this._state.selectedBeatIds });
	}

	clearSelection(): void {
		this._state.selectedBeatIds = [];
		this.emit('selection:changed', { selectedBeatIds: [] });
	}

	selectAll(): void {
		this._state.selectedBeatIds = this._state.beats.map((beat) => beat.id);
		this.emit('selection:changed', { selectedBeatIds: this._state.selectedBeatIds });
	}

	// Navigation
	setCurrentBeatIndex(index: number): void {
		if (index >= 0 && index < this._state.beats.length) {
			this._state.currentBeatIndex = index;
		}
	}

	nextBeat(): void {
		if (this._state.currentBeatIndex < this._state.beats.length - 1) {
			this._state.currentBeatIndex++;
		}
	}

	previousBeat(): void {
		if (this._state.currentBeatIndex > 0) {
			this._state.currentBeatIndex--;
		}
	}

	// Metadata management
	updateMetadata(metadata: Partial<SequenceMetadata>): void {
		this._state.metadata = {
			...this._state.metadata,
			...metadata,
			updatedAt: new Date()
		};
		this.markAsModified();
		this.emit('metadata:updated', { metadata: this._state.metadata });
	}

	// State management
	markAsSaved(): void {
		this._state.isModified = false;
		this.emit('state:saved', {});
	}

	markAsModified(): void {
		this._state.isModified = true;
	}

	// Playback control
	play(): void {
		if (this.config.enablePlayback) {
			this._state.isPlaying = true;
			this.emit('playback:started', {});
		}
	}

	pause(): void {
		this._state.isPlaying = false;
		this.emit('playback:paused', {});
	}

	stop(): void {
		this._state.isPlaying = false;
		this._state.playbackPosition = 0;
		this.emit('playback:stopped', {});
	}

	setPlaybackPosition(position: number): void {
		this._state.playbackPosition = Math.max(0, Math.min(position, this._state.beats.length));
	}

	// Persistence
	saveToLocalStorage(): void {
		if (!browser) return;

		try {
			const stateToSave = {
				...this._state,
				metadata: {
					...this._state.metadata,
					updatedAt: new Date()
				}
			};

			localStorage.setItem(this.config.persistenceKey, JSON.stringify(stateToSave));
			this.markAsSaved();
		} catch (error) {
			console.error('Failed to save sequence to localStorage:', error);
		}
	}

	loadFromLocalStorage(): boolean {
		if (!browser) return false;

		try {
			const saved = localStorage.getItem(this.config.persistenceKey);
			if (saved) {
				const state = JSON.parse(saved);
				this.importState(state);
				this.emit('state:loaded', {});
				return true;
			}
		} catch (error) {
			console.error('Failed to load sequence from localStorage:', error);
		}

		return false;
	}

	exportState(): SequenceState {
		// Manual deep copy to avoid issues with Svelte 5 rune state
		return {
			beats: [...this._state.beats],
			selectedBeatIds: [...this._state.selectedBeatIds],
			currentBeatIndex: this._state.currentBeatIndex,
			startPosition: this._state.startPosition,
			metadata: { ...this._state.metadata },
			isModified: this._state.isModified,
			isPlaying: this._state.isPlaying,
			playbackPosition: this._state.playbackPosition
		};
	}

	importState(state: SequenceState): void {
		// Validate and sanitize imported state
		this._state = {
			beats: Array.isArray(state.beats) ? state.beats : [],
			selectedBeatIds: Array.isArray(state.selectedBeatIds) ? state.selectedBeatIds : [],
			currentBeatIndex: typeof state.currentBeatIndex === 'number' ? state.currentBeatIndex : 0,
			startPosition: state.startPosition || null,
			metadata: state.metadata || { ...defaultSequenceMetadata },
			isModified: false, // Reset modification flag on import
			isPlaying: false, // Reset playback state
			playbackPosition: 0
		};
	}

	// Event system
	on<K extends keyof SequenceServiceEvents>(
		event: K,
		listener: (data: SequenceServiceEvents[K]) => void
	): () => void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set());
		}

		this.eventListeners.get(event)!.add(listener);

		return () => this.eventListeners.get(event)?.delete(listener);
	}

	private emit<K extends keyof SequenceServiceEvents>(
		event: K,
		data: SequenceServiceEvents[K]
	): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.forEach((listener) => listener(data));
		}
	}

	// FIXED: Auto-save setup without reactive loops
	private setupAutoSave(): void {
		// Disable auto-save for now to prevent reactive loops
		// Will be re-implemented with proper debouncing later
		console.log('Auto-save disabled to prevent reactive loops');
	}
}
