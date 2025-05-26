// src/lib/state/machines/sequenceMachine/persistence.svelte.ts
/**
 * Persistence functionality for the sequence state machine - MODERNIZED WITH RUNES
 * NO STORES - RUNES ONLY!
 */
// NO STORES - RUNES ONLY! Import the modern container directly
import { pictographContainer } from '$lib/state/stores/pictograph/pictographContainer';
import type { AnyActorRef } from 'xstate';
import { blueArrowData } from '$lib/state/stores/pictograph/pictographSelectors';

// MODERNIZED: Use runes instead of stores - NO STORES!
let _selectedStartPos = $state<any>(null);
let isSequenceEmptyValue = true;

// Export functions to manage the state
export function setIsSequenceEmpty(isEmpty: boolean) {
	isSequenceEmptyValue = isEmpty;
}

export function getIsSequenceEmpty(): boolean {
	return isSequenceEmptyValue;
}

export function setSelectedStartPos(startPos: any) {
	// MODERNIZED: Direct assignment with runes - NO STORES!
	_selectedStartPos = startPos;
}

export function getSelectedStartPos(): any {
	// MODERNIZED: Direct access with runes - NO STORES!
	return _selectedStartPos;
}

// Set up a reactive effect to update isSequenceEmpty whenever the sequence changes
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
}

/**
 * Initialize persistence by loading sequence data
 */
export function initializePersistence(sequenceActor: AnyActorRef) {
	if (typeof window === 'undefined') return;

	// Effects are now handled by EffectsInitializer.svelte component

	// Import the sequenceContainer
	import('$lib/state/stores/sequence/SequenceContainer.svelte').then(({ sequenceContainer }) => {
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

						// Update the sequence container with the processed beats - NO STORES!
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
	 * MODERNIZED: Helper function to restore the start position with runes
	 */
	function restoreStartPosition(pictographData: any) {
		try {
			// Create a deep copy to avoid reference issues
			const startPosCopy = JSON.parse(JSON.stringify(pictographData));

			// MODERNIZED: Direct assignment with runes - NO STORES!
			_selectedStartPos = startPosCopy;

			// Also update the pictographContainer
			if (pictographContainer && typeof pictographContainer.setData === 'function') {
				pictographContainer.setData(startPosCopy);
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
			// MODERNIZED: Reset with runes - NO STORES!
			_selectedStartPos = null;
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
				import('$lib/state/stores/sequence/SequenceContainer.svelte'),
				import('$lib/utils/pictographUtils')
			]).then(([{ sequenceContainer }, { createSafeBeatCopy }]) => {
				try {
					// Get beats directly from the modern container - NO STORES!
					const beats = sequenceContainer.state.beats;

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
