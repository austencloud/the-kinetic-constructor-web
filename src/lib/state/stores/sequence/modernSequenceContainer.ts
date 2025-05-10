/**
 * Modern Sequence Container
 *
 * This module provides a modern implementation of the sequence state using
 * the new container-based approach.
 */

import { createContainer } from '$lib/state/core/container';
import { createDerived } from '$lib/state/core/container';
import { browser } from '$app/environment';

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
	redMotionData?: any;
	blueMotionData?: any;
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
		name: '', // Empty string instead of 'Untitled Sequence'
		difficulty: 0, // Start with 0 (no difficulty shown)
		tags: [],
		createdAt: new Date(),
		lastModified: new Date()
	}
};

/**
 * Creates the sequence container
 */
function createSequenceContainer() {
	return createContainer(initialState, (state, update) => ({
		/**
		 * Add a new beat to the sequence
		 */
		addBeat: (beat: BeatData) => {
			update((state) => {
				state.beats.push(beat);
				state.isModified = true;
				state.metadata.lastModified = new Date();
			});
		},

		/**
		 * Add multiple beats to the sequence
		 */
		addBeats: (beats: BeatData[]) => {
			update((state) => {
				state.beats.push(...beats);
				state.isModified = true;
				state.metadata.lastModified = new Date();
			});
		},

		/**
		 * Set the entire sequence
		 */
		setSequence: (beats: BeatData[]) => {
			update((state) => {
				state.beats = beats;
				state.isModified = true;
				state.currentBeatIndex = 0;
				state.selectedBeatIds = [];
				state.metadata.lastModified = new Date();
			});
		},

		/**
		 * Remove a beat from the sequence
		 */
		removeBeat: (beatId: string) => {
			update((state) => {
				state.beats = state.beats.filter((beat) => beat.id !== beatId);
				state.selectedBeatIds = state.selectedBeatIds.filter((id) => id !== beatId);
				state.isModified = true;
				state.metadata.lastModified = new Date();
			});
		},

		/**
		 * Update a beat in the sequence
		 */
		updateBeat: (beatId: string, updates: Partial<BeatData>) => {
			update((state) => {
				const beatIndex = state.beats.findIndex((beat) => beat.id === beatId);
				if (beatIndex >= 0) {
					state.beats[beatIndex] = { ...state.beats[beatIndex], ...updates };
					state.isModified = true;
					state.metadata.lastModified = new Date();
				}
			});
		},

		/**
		 * Select a beat
		 */
		selectBeat: (beatId: string, multiSelect = false) => {
			update((state) => {
				if (!multiSelect) {
					state.selectedBeatIds = [beatId];
				} else if (!state.selectedBeatIds.includes(beatId)) {
					state.selectedBeatIds.push(beatId);
				}
			});
		},

		/**
		 * Deselect a beat
		 */
		deselectBeat: (beatId: string) => {
			update((state) => {
				state.selectedBeatIds = state.selectedBeatIds.filter((id) => id !== beatId);
			});
		},

		/**
		 * Clear the selection
		 */
		clearSelection: () => {
			update((state) => {
				state.selectedBeatIds = [];
			});
		},

		/**
		 * Set the current beat index
		 */
		setCurrentBeatIndex: (index: number) => {
			update((state) => {
				state.currentBeatIndex = index;
			});
		},

		/**
		 * Update sequence metadata
		 */
		updateMetadata: (metadata: Partial<SequenceState['metadata']>) => {
			update((state) => {
				state.metadata = {
					...state.metadata,
					...metadata,
					lastModified: new Date()
				};
				state.isModified = true;
			});
		},

		/**
		 * Mark the sequence as saved (not modified)
		 */
		markAsSaved: () => {
			update((state) => {
				state.isModified = false;
			});
		},

		/**
		 * Save the sequence to localStorage
		 */
		saveToLocalStorage: () => {
			if (browser) {
				try {
					localStorage.setItem('sequence', JSON.stringify(state));
				} catch (e) {
					console.error('Failed to save sequence to localStorage:', e);
				}
			}
		},

		/**
		 * Load the sequence from localStorage
		 */
		loadFromLocalStorage: () => {
			if (browser) {
				try {
					const savedSequence = localStorage.getItem('sequence');
					if (savedSequence) {
						const parsed = JSON.parse(savedSequence);
						update((state) => {
							Object.assign(state, parsed);
							// Ensure dates are properly converted from strings
							state.metadata.createdAt = new Date(state.metadata.createdAt);
							state.metadata.lastModified = new Date(state.metadata.lastModified);
						});
						return true;
					}
				} catch (e) {
					console.error('Failed to load sequence from localStorage:', e);
				}
			}
			return false;
		}
	}));
}

// Create the sequence container instance
export const sequenceContainer = createSequenceContainer();

// Create derived values
export const selectedBeats = createDerived(() => 
	sequenceContainer.state.beats.filter(beat => 
		sequenceContainer.state.selectedBeatIds.includes(beat.id)
	)
);

export const currentBeat = createDerived(() => 
	sequenceContainer.state.beats[sequenceContainer.state.currentBeatIndex] || null
);

export const beatCount = createDerived(() => 
	sequenceContainer.state.beats.length
);

export const sequenceDifficulty = createDerived(() => 
	sequenceContainer.state.metadata.difficulty
);
