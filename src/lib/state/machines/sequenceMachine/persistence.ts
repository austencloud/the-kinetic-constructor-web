/**
 * Persistence functionality for the sequence state machine
 */
import { sequenceStore } from '../../stores/sequenceStore';
import { pictographStore } from '$lib/state/stores/pictograph/pictograph.store';
import type { Actor } from 'xstate';
import { blueArrowData } from '$lib/state/stores/pictograph/pictographSelectors';

// Import reactive state functions (these will be used by components that can import .svelte.ts files)
// For this .ts file, we'll use a different approach
let selectedStartPos: any = null;
let isSequenceEmptyValue = true;

// Export functions to manage the state
export function setIsSequenceEmpty(isEmpty: boolean) {
	isSequenceEmptyValue = isEmpty;
}

export function getIsSequenceEmpty(): boolean {
	return isSequenceEmptyValue;
}

export function setSelectedStartPos(startPos: any) {
	selectedStartPos = startPos;
}

export function getSelectedStartPos(): any {
	return selectedStartPos;
}

// Set up a subscription to update isSequenceEmpty whenever the sequence changes
if (typeof window !== 'undefined') {
	// We need to check both the sequence beats and the start position
	// to determine if the sequence is truly empty
	let hasStartPosition = false;

	// Track start position changes
	hasStartPosition = !!selectedStartPos;

	// Subscribe to sequence changes to update the empty state
	sequenceStore.subscribe((state) => {
		// A sequence is only truly empty if it has no beats AND no start position
		const isEmpty = state.beats.length === 0 && !hasStartPosition;

		// Update the isSequenceEmpty value
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
				// Use any type assertion to access pictographData which might be in metadata or directly on the beat
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
						restoreStartPosition(pictographData);
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
							// Create a processed beat with all required properties
							const processedBeat = { ...beat };

							// Ensure the beat has a valid pictographData property
							if (!processedBeat.pictographData && processedBeat.metadata) {
								// Try to reconstruct pictographData from metadata and other properties
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

						// Also update the modern container
						sequenceContainer.setSequence(processedBeats);

						// If the backup has a word, update the metadata
						if (backup.word) {
							sequenceContainer.updateMetadata({
								name: backup.word
							});
						} else {
							// Calculate the word from the beats
							const letters = processedBeats
								.map((beat: any) => {
									// Look for letter data according to the BeatData interface
									return (
										beat.letter ||
										(beat.metadata && typeof beat.metadata.letter === 'string'
											? beat.metadata.letter
											: null)
									);
								})
								.filter((letter: any): letter is string => letter !== null);

							// Build the word from letters
							const word = letters.join('');

							// Update metadata with word
							sequenceContainer.updateMetadata({
								name: word
							});
						}

						// Set isSequenceEmpty to false to show the Option Picker
						setIsSequenceEmpty(false);

						// Extract the start position from the first beat (if it exists)
						const firstBeat = processedBeats[0];
						if (firstBeat) {
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
								restoreStartPosition(pictographData);
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
	 * Helper function to restore the start position
	 */
	function restoreStartPosition(pictographData: any) {
		// Create a deep copy to avoid reference issues
		const startPosCopy = JSON.parse(JSON.stringify(pictographData));

		// Update the selectedStartPos store
		selectedStartPos.set(startPosCopy);

		// Also update the pictographStore
		pictographStore.setData(startPosCopy);

		// Dispatch a custom event to notify components
		if (typeof document !== 'undefined') {
			const event = new CustomEvent('start-position-selected', {
				detail: { startPosition: startPosCopy },
				bubbles: true
			});
			document.dispatchEvent(event);
		}
	}

	// Subscribe to state changes to save backup
	sequenceActor.subscribe((state) => {
		// Import the sequenceContainer and pictograph utilities to ensure they're available
		Promise.all([
			import('$lib/state/stores/sequence/SequenceContainer'),
			import('$lib/utils/pictographUtils')
		]).then(([{ sequenceContainer }, { createSafeBeatCopy }]) => {
			try {
				// Get the current beats from the sequence store
				let beats: any[] = [];
				sequenceStore.subscribe((state) => {
					beats = state.beats;
				})();

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

				// Calculate the sequence word from beats
				const letters = beats
					.map((beat: any) => {
						// Look for letter data according to the BeatData interface
						return (
							beat.letter ||
							(beat.metadata && typeof beat.metadata.letter === 'string'
								? beat.metadata.letter
								: null)
						);
					})
					.filter((letter: any): letter is string => letter !== null);

				// Build the word from letters
				const word = letters.join('');

				// Save to both storage mechanisms for backward compatibility
				// 1. Save to the legacy backup format
				localStorage.setItem(
					'sequence_backup',
					JSON.stringify({
						beats: safeBeats,
						options: state.context.generationOptions,
						word: word // Add the word to the backup
					})
				);

				// 2. Save to the modern storage format
				sequenceContainer.saveToLocalStorage();
			} catch (error) {
				console.error('Error saving sequence:', error);
			}
		});
	});
}
