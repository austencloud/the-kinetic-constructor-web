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
		 *
		 * This method has been improved to:
		 * 1. Better handle edge cases and errors
		 * 2. Ensure proper saving of sequence data
		 */
		saveToLocalStorage: () => {
			if (!browser) return;

			try {
				// Import the pictographUtils module
				import('$lib/utils/pictographUtils')
					.then(({ createSafeBeatCopy }) => {
						try {
							// Update the sequence word before saving
							const beats = state.beats;

							// Create safe copies of beats to handle circular references
							const safeBeats = beats.map((beat) => {
								// Create a safe copy of the beat
								const safeBeat = createSafeBeatCopy(beat);

								// Ensure pictographData is properly preserved
								if (!safeBeat.pictographData && beat.metadata) {
									// Try to reconstruct pictographData from metadata and other properties
									safeBeat.pictographData = {
										letter: beat.letter || beat.metadata.letter || null,
										startPos: beat.position || beat.metadata.startPos || null,
										endPos: beat.metadata.endPos || null,
										gridMode: beat.metadata.gridMode || 'diamond',
										redPropData: beat.redPropData || null,
										bluePropData: beat.bluePropData || null,
										redMotionData: beat.redMotionData || null,
										blueMotionData: beat.blueMotionData || null,
										redArrowData: beat.redArrowData || null,
										blueArrowData: beat.blueArrowData || null,
										grid: beat.metadata.grid || '',
										timing: null,
										direction: null,
										gridData: null,
										motions: [],
										redMotion: null,
										blueMotion: null,
										props: []
									};
								}

								return safeBeat;
							});

							// Extract letters from beats and combine into a word
							const letters = beats
								.map((beat) => {
									// Look for letter data according to the BeatData interface
									return (
										beat.letter ||
										(beat.metadata && typeof beat.metadata.letter === 'string'
											? beat.metadata.letter
											: null)
									);
								})
								.filter((letter): letter is string => letter !== null);

							// Build the word from letters
							const word = letters.join('');

							// Update metadata with word
							update((state) => {
								state.metadata.name = word;
							});

							// Create a safe copy of the state with the safe beats
							const safeState = {
								...state,
								beats: safeBeats
							};

							// Now save to localStorage
							localStorage.setItem('sequence', JSON.stringify(safeState));
							console.log(
								'Saved sequence to localStorage with word:',
								word,
								'and beats:',
								safeBeats.length
							);
						} catch (innerError) {
							console.error('Error in saveToLocalStorage inner function:', innerError);
						}
					})
					.catch((importError) => {
						console.error('Error importing pictographUtils:', importError);
					});
			} catch (outerError) {
				console.error('Failed to save sequence to localStorage:', outerError);
			}
		},

		/**
		 * Load the sequence from localStorage
		 *
		 * This method has been improved to:
		 * 1. Better handle edge cases and errors
		 * 2. Restore the start position when loading a sequence
		 * 3. Provide more detailed logging
		 */
		loadFromLocalStorage: () => {
			if (!browser) return false;

			try {
				const savedSequence = localStorage.getItem('sequence');
				if (!savedSequence) {
					console.log('No saved sequence found in localStorage');
					return false;
				}

				const parsed = JSON.parse(savedSequence);
				console.log('Found saved sequence in localStorage:', {
					beatsCount: parsed.beats?.length || 0,
					hasMetadata: !!parsed.metadata
				});

				// Process the beats to ensure pictographData is properly restored
				if (parsed.beats && Array.isArray(parsed.beats)) {
					parsed.beats = parsed.beats.map((beat: any) => {
						// Ensure the beat has a valid pictographData property
						if (!beat.pictographData && beat.metadata) {
							// Try to reconstruct pictographData from metadata and other properties
							beat.pictographData = {
								letter: beat.letter || beat.metadata.letter || null,
								startPos: beat.position || beat.metadata.startPos || null,
								endPos: beat.metadata.endPos || null,
								gridMode: beat.metadata.gridMode || 'diamond',
								redPropData: beat.redPropData || null,
								bluePropData: beat.bluePropData || null,
								redMotionData: beat.redMotionData || null,
								blueMotionData: beat.blueMotionData || null,
								redArrowData: beat.redArrowData || null,
								blueArrowData: beat.blueArrowData || null,
								grid: beat.metadata.grid || '',
								timing: null,
								direction: null,
								gridData: null,
								motions: [],
								redMotion: null,
								blueMotion: null,
								props: []
							};
						}

						// Ensure the beat has all required properties
						return {
							id: beat.id || `beat-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
							number: beat.number || 0,
							letter: beat.letter || beat.metadata?.letter || null,
							position: beat.position || beat.metadata?.startPos || null,
							orientation: beat.orientation || '',
							turnsTuple: beat.turnsTuple || '',
							redPropData: beat.redPropData || beat.pictographData?.redPropData || null,
							bluePropData: beat.bluePropData || beat.pictographData?.bluePropData || null,
							redArrowData: beat.redArrowData || beat.pictographData?.redArrowData || null,
							blueArrowData: beat.blueArrowData || beat.pictographData?.blueArrowData || null,
							redMotionData: beat.redMotionData || beat.pictographData?.redMotionData || null,
							blueMotionData: beat.blueMotionData || beat.pictographData?.blueMotionData || null,
							metadata: beat.metadata || {},
							pictographData: beat.pictographData || null
						};
					});
				}

				// Store a reference to the first beat for start position restoration
				const firstBeat = parsed.beats && parsed.beats.length > 0 ? parsed.beats[0] : null;

				update((state) => {
					Object.assign(state, parsed);
					// Ensure dates are properly converted from strings
					state.metadata.createdAt = new Date(state.metadata.createdAt);
					state.metadata.lastModified = new Date(state.metadata.lastModified);

					// Recalculate the word from beats to ensure consistency
					if (state.beats && state.beats.length > 0) {
						// Extract letters from beats and combine into a word
						const letters = state.beats
							.map((beat) => {
								// Look for letter data according to the BeatData interface
								return (
									beat.letter ||
									(beat.metadata && typeof beat.metadata.letter === 'string'
										? beat.metadata.letter
										: null)
								);
							})
							.filter((letter): letter is string => letter !== null);

						// Build the word from letters
						const word = letters.join('');

						// Update metadata with word
						state.metadata.name = word;
						console.log(
							'Loaded sequence with recalculated word:',
							word,
							'and beats:',
							state.beats.length
						);
					} else {
						// Reset the word if there are no beats
						state.metadata.name = '';
						console.log('Loaded empty sequence, reset word to empty string');
					}
				});

				// Restore the start position if we have a first beat
				if (firstBeat) {
					try {
						// Import the necessary modules
						Promise.all([
							import('$lib/stores/sequence/selectionStore'),
							import('$lib/state/stores/pictograph/pictographContainer')
						]).then(([{ selectedStartPos }, { pictographContainer }]) => {
							// Try to get pictographData from the first beat
							let startPosData = null;

							if (firstBeat.pictographData) {
								startPosData = firstBeat.pictographData;
							} else if (firstBeat.metadata?.pictographData) {
								startPosData = firstBeat.metadata.pictographData;
							} else {
								// Try to reconstruct pictographData from beat properties
								startPosData = {
									letter: firstBeat.letter || firstBeat.metadata?.letter || null,
									startPos: firstBeat.position || firstBeat.metadata?.startPos || null,
									endPos: firstBeat.metadata?.endPos || null,
									gridMode: firstBeat.metadata?.gridMode || 'diamond',
									redPropData: firstBeat.redPropData || null,
									bluePropData: firstBeat.bluePropData || null,
									redMotionData: firstBeat.redMotionData || null,
									blueMotionData: firstBeat.blueMotionData || null,
									redArrowData: firstBeat.redArrowData || null,
									blueArrowData: firstBeat.blueArrowData || null,
									grid: firstBeat.metadata?.grid || '',
									timing: null,
									direction: null,
									gridData: null,
									motions: [],
									redMotion: null,
									blueMotion: null,
									props: []
								};
							}

							if (startPosData) {
								// Create a deep copy to avoid reference issues
								const startPosCopy = JSON.parse(JSON.stringify(startPosData));

								// Update the selectedStartPos store
								selectedStartPos.set(startPosCopy);

								// Also update the pictographContainer
								pictographContainer.setData(startPosCopy);

								console.log('Restored start position from first beat:', startPosCopy);

								// Dispatch a custom event to notify components
								if (typeof document !== 'undefined') {
									const event = new CustomEvent('start-position-selected', {
										detail: { startPosition: startPosCopy },
										bubbles: true
									});
									document.dispatchEvent(event);
									console.log('Dispatched start-position-selected event');
								}
							}
						});
					} catch (startPosError) {
						console.error('Failed to restore start position:', startPosError);
					}
				}

				return true;
			} catch (e) {
				console.error('Failed to load sequence from localStorage:', e);
				return false;
			}
		}
	}));
}

// Create the sequence container instance
export const sequenceContainer = createSequenceContainer();

// Create derived values
export const selectedBeats = createDerived(() =>
	sequenceContainer.state.beats.filter((beat) =>
		sequenceContainer.state.selectedBeatIds.includes(beat.id)
	)
);

export const currentBeat = createDerived(
	() => sequenceContainer.state.beats[sequenceContainer.state.currentBeatIndex] || null
);

export const beatCount = createDerived(() => sequenceContainer.state.beats.length);

export const sequenceDifficulty = createDerived(() => sequenceContainer.state.metadata.difficulty);

// Set up automatic persistence
if (browser) {
	// Create a debounced save function to avoid saving too frequently
	let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;
	let lastSavedState = JSON.stringify({
		beats: sequenceContainer.state.beats.length,
		metadata: sequenceContainer.state.metadata.name
	});

	const debouncedSave = () => {
		if (saveTimeoutId) {
			clearTimeout(saveTimeoutId);
		}
		saveTimeoutId = setTimeout(() => {
			// Create a simple representation of the current state for comparison
			const currentState = JSON.stringify({
				beats: sequenceContainer.state.beats.length,
				metadata: sequenceContainer.state.metadata.name
			});

			// Only save if the state has actually changed
			if (currentState !== lastSavedState) {
				console.log('State changed, saving to localStorage');
				sequenceContainer.saveToLocalStorage();
				lastSavedState = currentState;
			}

			saveTimeoutId = null;
		}, 0); // 1000ms debounce time (increased to reduce frequency)
	};

	// Subscribe to changes in the sequence container
	sequenceContainer.subscribe((state) => {
		// Only save if there are changes and the state is marked as modified
		if (state.isModified) {
			debouncedSave();
		}
	});

	// Also save when the window is about to unload, but only if needed
	window.addEventListener('beforeunload', () => {
		if (saveTimeoutId) {
			clearTimeout(saveTimeoutId);
			saveTimeoutId = null;

			// Check if we need to save before unloading
			const currentState = JSON.stringify({
				beats: sequenceContainer.state.beats.length,
				metadata: sequenceContainer.state.metadata.name
			});

			if (currentState !== lastSavedState && sequenceContainer.state.isModified) {
				sequenceContainer.saveToLocalStorage();
			}
		}
	});
}
