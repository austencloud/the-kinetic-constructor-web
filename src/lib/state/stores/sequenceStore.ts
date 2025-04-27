import { createStore, createSelector } from '../core/store';
import { derived } from 'svelte/store';

/**
 * Interface for a single beat in a sequence
 */
export interface BeatData {
	id: string;
	number: number;
	letter?: string;
	position?: string;
	orientation?: string;
	turnsTuple?: string;
	redPropData?: any;
	bluePropData?: any;
	redArrowData?: any;
	blueArrowData?: any;
	metadata?: Record<string, unknown>;
}

/**
 * Interface for sequence state
 */
export interface SequenceState {
	beats: BeatData[];
	selectedBeatIds: string[];
	currentBeatIndex: number;
	isModified: boolean;
	metadata: {
		name: string;
		difficulty: number;
		tags: string[];
		createdAt: Date;
		lastModified: Date;
	};
}

/**
 * Initial sequence state
 */
const initialState: SequenceState = {
	beats: [],
	selectedBeatIds: [],
	currentBeatIndex: 0,
	isModified: false,
	metadata: {
		name: 'Untitled Sequence',
		difficulty: 1,
		tags: [],
		createdAt: new Date(),
		lastModified: new Date()
	}
};

/**
 * Create the sequence store with actions
 */
export const sequenceStore = createStore<
	SequenceState,
	{
		addBeat: (beat: BeatData) => void;
		addBeats: (beats: BeatData[]) => void;
		setSequence: (beats: BeatData[]) => void;
		removeBeat: (beatId: string) => void;
		updateBeat: (beatId: string, updates: Partial<BeatData>) => void;
		selectBeat: (beatId: string, multiSelect?: boolean) => void;
		deselectBeat: (beatId: string) => void;
		clearSelection: () => void;
		setCurrentBeatIndex: (index: number) => void;
		updateMetadata: (metadata: Partial<SequenceState['metadata']>) => void;
		markAsSaved: () => void;
	}
>(
	'sequence',
	initialState,
	(_set, update, _get) => ({
		/**
		 * Add a new beat to the sequence
		 */
		addBeat: (beat: BeatData) => {
			update((state) => ({
				...state,
				beats: [...state.beats, beat],
				isModified: true,
				metadata: {
					...state.metadata,
					lastModified: new Date()
				}
			}));
		},

		/**
		 * Add multiple beats to the sequence
		 */
		addBeats: (beats: BeatData[]) => {
			update((state) => ({
				...state,
				beats: [...state.beats, ...beats],
				isModified: true,
				metadata: {
					...state.metadata,
					lastModified: new Date()
				}
			}));
		},

		/**
		 * Set the entire sequence
		 */
		setSequence: (beats: BeatData[]) => {
			update((state) => ({
				...state,
				beats,
				isModified: true,
				currentBeatIndex: 0,
				selectedBeatIds: [],
				metadata: {
					...state.metadata,
					lastModified: new Date()
				}
			}));
		},

		/**
		 * Remove a beat from the sequence
		 */
		removeBeat: (beatId: string) => {
			update((state) => ({
				...state,
				beats: state.beats.filter((b) => b.id !== beatId),
				selectedBeatIds: state.selectedBeatIds.filter((id) => id !== beatId),
				isModified: true,
				metadata: {
					...state.metadata,
					lastModified: new Date()
				}
			}));
		},

		/**
		 * Update a beat in the sequence
		 */
		updateBeat: (beatId: string, updates: Partial<BeatData>) => {
			update((state) => ({
				...state,
				beats: state.beats.map((beat) => (beat.id === beatId ? { ...beat, ...updates } : beat)),
				isModified: true,
				metadata: {
					...state.metadata,
					lastModified: new Date()
				}
			}));
		},

		/**
		 * Select a beat
		 */
		selectBeat: (beatId: string, multiSelect = false) => {
			update((state) => ({
				...state,
				selectedBeatIds: multiSelect ? [...state.selectedBeatIds, beatId] : [beatId]
			}));
		},

		/**
		 * Deselect a beat
		 */
		deselectBeat: (beatId: string) => {
			update((state) => ({
				...state,
				selectedBeatIds: state.selectedBeatIds.filter((id) => id !== beatId)
			}));
		},

		/**
		 * Clear all beat selections
		 */
		clearSelection: () => {
			update((state) => ({
				...state,
				selectedBeatIds: []
			}));
		},

		/**
		 * Set the current beat index
		 */
		setCurrentBeatIndex: (index: number) => {
			update((state) => ({
				...state,
				currentBeatIndex: index
			}));
		},

		/**
		 * Update sequence metadata
		 */
		updateMetadata: (metadata: Partial<SequenceState['metadata']>) => {
			update((state) => ({
				...state,
				metadata: {
					...state.metadata,
					...metadata,
					lastModified: new Date()
				}
			}));
		},

		/**
		 * Mark the sequence as saved (not modified)
		 */
		markAsSaved: () => {
			update((state) => ({
				...state,
				isModified: false
			}));
		}
	}),
	{
		persist: true,
		description: 'Stores sequence data including beats, selections, and metadata'
	}
);

// Create selectors for derived state
export const selectedBeats = createSelector(
	derived(sequenceStore, (state: SequenceState) =>
		state.beats.filter((beat) => state.selectedBeatIds.includes(beat.id))
	),
	{ id: 'sequence.selectedBeats', description: 'Currently selected beats' }
);

export const currentBeat = createSelector(
	derived(sequenceStore, (state: SequenceState) => state.beats[state.currentBeatIndex] || null),
	{ id: 'sequence.currentBeat', description: 'Currently active beat' }
);

export const beatCount = createSelector(
	derived(sequenceStore, (state: SequenceState) => state.beats.length),
	{ id: 'sequence.beatCount', description: 'Total number of beats' }
);

export const sequenceDifficulty = createSelector(
	derived(sequenceStore, (state: SequenceState) => state.metadata.difficulty),
	{ id: 'sequence.difficulty', description: 'Sequence difficulty level' }
);

// Note: The sequence machine is already connected to the store
// through the updateSequence action in the sequenceMachine.ts file.
// No additional subscription is needed here.
