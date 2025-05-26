/**
 * Sequence State Management with Svelte 5 Runes
 *
 * Modern replacement for sequenceAdapter.ts using Svelte 5 runes
 */

export interface BeatData {
	id: string;
	pictographData: any;
	timing: number;
	duration: number;
	metadata: {
		difficulty: number;
		tags: string[];
		notes?: string;
	};
}

export interface SequenceMetadata {
	name: string;
	difficulty: number;
	tags: string[];
	description?: string;
	author?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface SequenceState {
	beats: BeatData[];
	selectedBeatIds: string[];
	currentBeatIndex: number;
	metadata: SequenceMetadata;
	isModified: boolean;
	isPlaying: boolean;
	playbackPosition: number;
}

/**
 * Create reactive sequence state with Svelte 5 runes
 */
export function createSequenceState(initialState?: Partial<SequenceState>) {
	let state = $state<SequenceState>({
		beats: [],
		selectedBeatIds: [],
		currentBeatIndex: 0,
		metadata: {
			name: 'Untitled Sequence',
			difficulty: 1,
			tags: [],
			description: '',
			author: '',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		isModified: false,
		isPlaying: false,
		playbackPosition: 0,
		...initialState
	});

	// Derived states
	const selectedBeats = $derived(
		state.beats.filter(beat => state.selectedBeatIds.includes(beat.id))
	);
	
	const currentBeat = $derived(
		state.beats[state.currentBeatIndex] || null
	);
	
	const beatCount = $derived(state.beats.length);
	
	const sequenceDuration = $derived(
		state.beats.reduce((total, beat) => total + beat.duration, 0)
	);
	
	const hasSelection = $derived(state.selectedBeatIds.length > 0);
	
	const canPlay = $derived(state.beats.length > 0);

	return {
		// State getters
		get state() {
			return state;
		},
		get beats() {
			return state.beats;
		},
		get selectedBeatIds() {
			return state.selectedBeatIds;
		},
		get currentBeatIndex() {
			return state.currentBeatIndex;
		},
		get metadata() {
			return state.metadata;
		},
		get isModified() {
			return state.isModified;
		},
		get isPlaying() {
			return state.isPlaying;
		},
		get playbackPosition() {
			return state.playbackPosition;
		},

		// Derived getters
		get selectedBeats() {
			return selectedBeats;
		},
		get currentBeat() {
			return currentBeat;
		},
		get beatCount() {
			return beatCount;
		},
		get sequenceDuration() {
			return sequenceDuration;
		},
		get hasSelection() {
			return hasSelection;
		},
		get canPlay() {
			return canPlay;
		},

		// Beat operations
		addBeat: (beat: BeatData) => {
			state.beats = [...state.beats, beat];
			state.isModified = true;
			state.metadata.updatedAt = new Date();
		},

		addBeats: (beats: BeatData[]) => {
			state.beats = [...state.beats, ...beats];
			state.isModified = true;
			state.metadata.updatedAt = new Date();
		},

		removeBeat: (beatId: string) => {
			state.beats = state.beats.filter(beat => beat.id !== beatId);
			state.selectedBeatIds = state.selectedBeatIds.filter(id => id !== beatId);
			state.isModified = true;
			state.metadata.updatedAt = new Date();
		},

		updateBeat: (beatId: string, updates: Partial<BeatData>) => {
			const beatIndex = state.beats.findIndex(beat => beat.id === beatId);
			if (beatIndex !== -1) {
				state.beats[beatIndex] = { ...state.beats[beatIndex], ...updates };
				state.isModified = true;
				state.metadata.updatedAt = new Date();
			}
		},

		setSequence: (beats: BeatData[]) => {
			state.beats = [...beats];
			state.selectedBeatIds = [];
			state.currentBeatIndex = 0;
			state.isModified = true;
			state.metadata.updatedAt = new Date();
		},

		// Selection operations
		selectBeat: (beatId: string, multiSelect = false) => {
			if (!multiSelect) {
				state.selectedBeatIds = [beatId];
			} else {
				if (!state.selectedBeatIds.includes(beatId)) {
					state.selectedBeatIds = [...state.selectedBeatIds, beatId];
				}
			}
		},

		deselectBeat: (beatId: string) => {
			state.selectedBeatIds = state.selectedBeatIds.filter(id => id !== beatId);
		},

		clearSelection: () => {
			state.selectedBeatIds = [];
		},

		selectAll: () => {
			state.selectedBeatIds = state.beats.map(beat => beat.id);
		},

		// Navigation operations
		setCurrentBeatIndex: (index: number) => {
			if (index >= 0 && index < state.beats.length) {
				state.currentBeatIndex = index;
			}
		},

		nextBeat: () => {
			if (state.currentBeatIndex < state.beats.length - 1) {
				state.currentBeatIndex++;
			}
		},

		previousBeat: () => {
			if (state.currentBeatIndex > 0) {
				state.currentBeatIndex--;
			}
		},

		// Metadata operations
		updateMetadata: (metadata: Partial<SequenceMetadata>) => {
			state.metadata = { ...state.metadata, ...metadata, updatedAt: new Date() };
			state.isModified = true;
		},

		// Playback operations
		startPlayback: () => {
			state.isPlaying = true;
			state.playbackPosition = 0;
		},

		stopPlayback: () => {
			state.isPlaying = false;
			state.playbackPosition = 0;
		},

		pausePlayback: () => {
			state.isPlaying = false;
		},

		setPlaybackPosition: (position: number) => {
			state.playbackPosition = Math.max(0, Math.min(position, sequenceDuration));
		},

		// State management
		markAsSaved: () => {
			state.isModified = false;
		},

		reset: () => {
			state = {
				beats: [],
				selectedBeatIds: [],
				currentBeatIndex: 0,
				metadata: {
					name: 'Untitled Sequence',
					difficulty: 1,
					tags: [],
					description: '',
					author: '',
					createdAt: new Date(),
					updatedAt: new Date()
				},
				isModified: false,
				isPlaying: false,
				playbackPosition: 0
			};
		}
	};
}

/**
 * Global sequence state instance
 */
export const sequenceState = createSequenceState();

/**
 * Reactive effects for sequence state
 */
export function setupSequenceEffects() {
	// Auto-save when modified
	$effect(() => {
		if (sequenceState.isModified) {
			// Debounced auto-save logic could go here
			console.log('Sequence modified, consider auto-saving');
		}
	});

	// Update current beat index when playing
	$effect(() => {
		if (sequenceState.isPlaying) {
			// Playback logic could go here
			console.log('Sequence is playing at position:', sequenceState.playbackPosition);
		}
	});
}
