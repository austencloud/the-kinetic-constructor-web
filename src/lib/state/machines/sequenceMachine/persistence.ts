// src/lib/state/machines/sequenceMachine/persistence.ts
/**
 * Persistence functionality for the sequence state machine
 */
import { sequenceStore } from '../../stores/sequenceStore';
import { pictographStore } from '$lib/state/stores/pictograph/pictograph.store';
import type { Actor } from 'xstate';
import { blueArrowData } from '$lib/state/stores/pictograph/pictographSelectors';
import { writable } from 'svelte/store';

// FIXED: Initialize selectedStartPos as a proper writable store instead of null
let selectedStartPos = writable(null);
let isSequenceEmptyValue = true;

// Export the selectedStartPos store for use in other components
export { selectedStartPos };

// Export functions to manage the state
export function setIsSequenceEmpty(isEmpty: boolean) {
	isSequenceEmptyValue = isEmpty;
}

export function getIsSequenceEmpty(): boolean {
	return isSequenceEmptyValue;
}

export function setSelectedStartPos(startPos: any) {
	// FIXED: Always ensure we have a valid store before calling set
	if (selectedStartPos && typeof selectedStartPos.set === 'function') {
		selectedStartPos.set(startPos);
	} else {
		// Reinitialize if somehow the store got corrupted
		selectedStartPos = writable(startPos);
	}
}

export function getSelectedStartPos(): any {
	let currentValue = null;
	if (selectedStartPos && typeof selectedStartPos.subscribe === 'function') {
		selectedStartPos.subscribe((value) => (currentValue = value))();
	}
	return currentValue;
}

// Set up a subscription to update isSequenceEmpty whenever the sequence changes
if (typeof window !== 'undefined') {
	let hasStartPosition = false;

	// Track start position changes safely
	try {
		const currentStartPos = getSelectedStartPos();
		hasStartPosition = !!currentStartPos;
	} catch (error) {
		console.warn('Error getting start position:', error);
		hasStartPosition = false;
	}

	// Subscribe to sequence changes to update the empty state
	sequenceStore.subscribe((state) => {
		// A sequence is only truly empty if it has no beats AND no start position
		const isEmpty = state.beats.length === 0 && !hasStartPosition;
		setIsSequenceEmpty(isEmpty);
	});
}

/**
 * Initialize persistence by loading sequence data
 */
export function initializePersistence(sequenceActor: Actor<any>) {
	if (typeof window === 'undefined') return;

	// Import the sequenceContainer
	import('$lib/state/stores/sequence/SequenceContainer').then(({ sequenceContainer }) => {
		// First try to load from the modern 'sequence' storage
		let sequenceLoaded = false;
		try {
			sequenceLoaded = sequenceContainer.loadFromLocalStorage();
			if (sequenceLoaded) {
				// Update isSequenceEmpty based on the loaded sequence
				const hasBeats = sequenceContainer.state.beats.length > 0;
				setIsSequenceEmpty(!hasBeats);

				// If we have beats, also restore the start position
				const firstBeat = sequenceContainer.state.beats[0] as any;
				if (hasBeats) {
					let pictographData = null;

					// Try to get pictographData from different possible locations
					if (firstBeat.pictographData) {
						pictographData = firstBeat.pictographData;
					} else if (firstBeat.metadata?.pictographData) {
						pictographData = firstBeat.metadata.pictographData;
					} else {
						// Try to reconstruct pictographData from beat properties
						pictographData = {
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

					if (pictographData) {
						// Use longer timeout to break reactivity chains
						setTimeout(() => {
							restoreStartPosition(pictographData);
						}, 200);
					}
				}
			}
		} catch (error) {
			console.error('Error loading sequence from modern storage:', error);
		}

		// If no sequence was loaded from modern storage, try the legacy backup
		if (!sequenceLoaded) {
			try {
				const backupData = localStorage.getItem('sequence_backup');
				if (backupData) {
					const backup = JSON.parse(backupData);

					// Restore the beats to the sequence store
					if (backup.beats && Array.isArray(backup.beats) && backup.beats.length > 0) {
						// Process the beats to ensure pictographData is properly preserved
						const processedBeats = backup.beats.map((beat: any) => {
							const processedBeat = { ...beat };

							if (!processedBeat.pictographData && processedBeat.metadata) {
								processedBeat.pictographData = {
									letter: processedBeat.letter || processedBeat.metadata.letter || null,
									startPos: processedBeat.position || processedBeat.metadata.startPos || null,
									endPos: processedBeat.metadata.endPos || null,
									gridMode: processedBeat.metadata.gridMode || 'diamond',
									redPropData: processedBeat.redPropData || null,
									bluePropData: processedBeat.bluePropData || null,
									redMotionData: processedBeat.redMotionData || null,
									blueMotionData: processedBeat.blueMotionData || null,
									redArrowData: processedBeat.redArrowData || null,
									blueArrowData: processedBeat.blueArrowData || null,
									grid: processedBeat.metadata.grid || '',
									timing: null,
									direction: null,
									gridData: null,
									motions: [],
									redMotion: null,
									blueMotion: null,
									props: []
								};
							}

							return processedBeat;
						});

						// Update the sequence store with the processed beats
						sequenceStore.setSequence(processedBeats);
						sequenceContainer.setSequence(processedBeats);

						// Handle metadata updates
						if (backup.word) {
							sequenceContainer.updateMetadata({ name: backup.word });
						} else {
							const letters = processedBeats
								.map((beat: any) => {
									return (
										beat.letter ||
										(beat.metadata && typeof beat.metadata.letter === 'string'
											? beat.metadata.letter
											: null)
									);
								})
								.filter((letter: any): letter is string => letter !== null);

							const word = letters.join('');
							sequenceContainer.updateMetadata({ name: word });
						}

						setIsSequenceEmpty(false);

						// Extract the start position from the first beat
						const firstBeat = processedBeats[0];
						if (firstBeat) {
							let pictographData = null;

							if (firstBeat.pictographData) {
								pictographData = firstBeat.pictographData;
							} else if (firstBeat.metadata?.pictographData) {
								pictographData = firstBeat.metadata.pictographData;
							} else {
								pictographData = {
									letter: firstBeat.letter || firstBeat.metadata?.letter || null,
									startPos: firstBeat.position || firstBeat.metadata?.startPos || null,
									endPos: firstBeat.metadata?.endPos || null,
									gridMode: firstBeat.metadata?.gridMode || 'diamond',
									redPropData: firstBeat.redPropData || null,
									bluePropData: firstBeat.bluePropData || null,
									redMotionData: firstBeat.redMotionData || null,
									blueMotionData: firstBeat.blueMotionData || null,
									redArrowData: firstBeat.redArrowData || null,
									blueArrowData: blueArrowData || null,
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

							if (pictographData) {
								// Use longer timeout to break reactivity chains
								setTimeout(() => {
									restoreStartPosition(pictographData);
								}, 300);
							}
						}

						// Save to the modern storage format
						sequenceContainer.saveToLocalStorage();
					}
				}
			} catch (error) {
				console.error('Error loading sequence backup:', error);
			}
		}
	});

	/**
	 * FIXED: Helper function to restore the start position with better error handling
	 */
	function restoreStartPosition(pictographData: any) {
		try {
			// Create a deep copy to avoid reference issues
			const startPosCopy = JSON.parse(JSON.stringify(pictographData));

			// FIXED: Ensure selectedStartPos is a valid store before calling set
			if (!selectedStartPos || typeof selectedStartPos.set !== 'function') {
				selectedStartPos = writable(null);
			}

			// Update the selectedStartPos store safely
			selectedStartPos.set(startPosCopy);

			// Also update the pictographStore
			if (pictographStore && typeof pictographStore.setData === 'function') {
				pictographStore.setData(startPosCopy);
			}

			// Dispatch event with longer timeout to break reactivity chains
			setTimeout(() => {
				if (typeof document !== 'undefined') {
					const event = new CustomEvent('start-position-selected', {
						detail: { startPosition: startPosCopy },
						bubbles: true
					});
					document.dispatchEvent(event);
				}
			}, 100);
		} catch (error) {
			console.error('Error restoring start position:', error);
			// Initialize a fresh store if restoration fails
			selectedStartPos = writable(null);
		}
	}

	// Subscribe to state changes to save backup with debouncing
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;

	sequenceActor.subscribe((state) => {
		// Clear existing timeout to debounce saves
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}

		// Use longer timeout to break reactivity chains and debounce saves
		saveTimeout = setTimeout(() => {
			// Import required modules
			Promise.all([
				import('$lib/state/stores/sequence/SequenceContainer'),
				import('$lib/utils/pictographUtils')
			]).then(([{ sequenceContainer }, { createSafeBeatCopy }]) => {
				try {
					let beats: any[] = [];
					sequenceStore.subscribe((state) => {
						beats = state.beats;
					})();

					// Create safe copies of beats
					const safeBeats = beats.map((beat) => {
						const safeBeat = createSafeBeatCopy(beat);

						if (!safeBeat.pictographData && beat.metadata) {
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

					// Calculate the sequence word
					const letters = beats
						.map((beat: any) => {
							return (
								beat.letter ||
								(beat.metadata && typeof beat.metadata.letter === 'string'
									? beat.metadata.letter
									: null)
							);
						})
						.filter((letter: any): letter is string => letter !== null);

					const word = letters.join('');

					// Save to both storage mechanisms
					localStorage.setItem(
						'sequence_backup',
						JSON.stringify({
							beats: safeBeats,
							options: state.context.generationOptions,
							word: word
						})
					);

					sequenceContainer.saveToLocalStorage();
				} catch (error) {
					console.error('Error saving sequence:', error);
				}
			});
		}, 500); // Increased debounce time
	});
}
