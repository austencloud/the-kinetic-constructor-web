// src/lib/components/SequenceWorkbench/BeatFrame/composables/useBeatFrameState.svelte.ts

import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
import { selectedStartPos } from '$lib/stores/sequence/selectionStore';
import { sequenceState } from '$lib/state/sequence/sequenceState.svelte';
import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';
import { createSafePictographCopy } from '$lib/utils/pictographUtils';
import type { PictographData } from '$lib/types/PictographData';
import type { BeatData as LegacyBeatData } from '../BeatData';
import {
	convertContainerBeatsToLegacyFormat,
	convertLegacyBeatToContainerFormat,
	convertPictographToContainerFormat
} from '../utils/beatFrameUtils';

/**
 * Composable for managing BeatFrame state using Svelte 5 runes
 */
export function useBeatFrameState() {
	// Local reactive state
	let startPosition = $state<PictographData | null>(null);
	let sequenceIsEmpty = $state(true);
	let sequence = $state(sequenceContainer.state);

	// CRITICAL FIX: Subscribe to both sequence container AND modern sequence state
	$effect(() => {
		const unsubscribe = sequenceContainer.subscribe((state) => {
			// Don't use untrack here - we want reactivity to work
			sequence = state;
		});
		return unsubscribe;
	});

	// CRITICAL FIX: React to modern sequence state changes and sync to container
	$effect(() => {
		// Track modern sequence state changes
		const modernBeats = sequenceState.beats;
		const modernStartPos = sequenceState.startPosition;

		// Update local state
		sequenceIsEmpty = sequenceState.isEmpty;

		// Sync modern state to container if needed
		if (modernBeats.length !== sequence.beats.length) {
			// Convert modern beats to container format and update
			const containerBeats = modernBeats.map((beat) => convertPictographToContainerFormat(beat));
			sequenceContainer.setSequence(containerBeats);
		}

		// Update start position if changed
		if (modernStartPos !== startPosition) {
			startPosition = modernStartPos;
		}
	});

	// Derived values
	const beats = $derived(convertContainerBeatsToLegacyFormat(sequence.beats));
	const selectedBeatIds = $derived(sequence.selectedBeatIds);
	const selectedBeatIndex = $derived(
		selectedBeatIds.length > 0 ? beats.findIndex((beat) => beat.id === selectedBeatIds[0]) : -1
	);
	const beatCount = $derived(beats.length);

	// Create start position beat data
	const startPosBeatData = $derived({
		beatNumber: 0,
		filled: !!startPosition,
		pictographData: startPosition || defaultPictographData
	});

	// Event handlers
	function handleStartPosBeatClick() {
		// Select the start position in the container
		sequenceContainer.selectBeat('start-position');

		// Create a safe copy of startPosition
		const startPosCopy = startPosition ? createSafePictographCopy(startPosition) : null;

		// Dispatch the event for the start position selector
		const selectStartPosEvent = new CustomEvent('select-start-pos', {
			bubbles: true,
			detail: { currentStartPos: startPosCopy }
		});
		document.dispatchEvent(selectStartPosEvent);

		// Dispatch a beat selected event
		const beatSelectedEvent = new CustomEvent('beatselected', {
			detail: { beatId: 'start-position' },
			bubbles: true
		});
		document.dispatchEvent(beatSelectedEvent);

		// Dispatch a global event
		const globalEvent = new CustomEvent('beat-selected', {
			bubbles: true,
			detail: { beatId: 'start-position' }
		});
		document.dispatchEvent(globalEvent);

		// Trigger animated highlight effects
		setTimeout(() => {
			const blueHighlightEvent = new CustomEvent('beat-highlight', {
				bubbles: true,
				detail: { active: true, color: 'blue' }
			});
			document.dispatchEvent(blueHighlightEvent);

			setTimeout(() => {
				const redHighlightEvent = new CustomEvent('beat-highlight', {
					bubbles: true,
					detail: { active: true, color: 'red' }
				});
				document.dispatchEvent(redHighlightEvent);
			}, 150);
		}, 50);
	}

	// Track modifier keys for multi-select
	let isShiftKeyPressed = $state(false);
	let isCtrlKeyPressed = $state(false);

	// Set up keyboard event listeners
	$effect(() => {
		if (typeof window === 'undefined') return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Shift') {
				isShiftKeyPressed = true;
			}
			if (e.key === 'Control' || e.key === 'Meta') {
				isCtrlKeyPressed = true;
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.key === 'Shift') {
				isShiftKeyPressed = false;
			}
			if (e.key === 'Control' || e.key === 'Meta') {
				isCtrlKeyPressed = false;
			}
		};

		const handleBlur = () => {
			isShiftKeyPressed = false;
			isCtrlKeyPressed = false;
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		window.addEventListener('blur', handleBlur);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			window.removeEventListener('blur', handleBlur);
		};
	});

	function handleBeatClick(beatIndex: number) {
		if (beatIndex >= 0 && beatIndex < beats.length) {
			const beat = beats[beatIndex];
			const beatId = beat.id;

			if (beatId) {
				const multiSelect = isShiftKeyPressed || isCtrlKeyPressed;

				// Select the beat in the container
				sequenceContainer.selectBeat(beatId, multiSelect);

				// Dispatch events
				const beatSelectedEvent = new CustomEvent('beatselected', {
					detail: { beatId },
					bubbles: true
				});
				document.dispatchEvent(beatSelectedEvent);

				const globalEvent = new CustomEvent('beat-selected', {
					bubbles: true,
					detail: { beatId, multiSelect }
				});
				document.dispatchEvent(globalEvent);

				// Trigger animated highlight effects
				setTimeout(() => {
					const blueHighlightEvent = new CustomEvent('beat-highlight', {
						bubbles: true,
						detail: { active: true, color: 'blue' }
					});
					document.dispatchEvent(blueHighlightEvent);

					setTimeout(() => {
						const redHighlightEvent = new CustomEvent('beat-highlight', {
							bubbles: true,
							detail: { active: true, color: 'red' }
						});
						document.dispatchEvent(redHighlightEvent);
					}, 150);
				}, 50);
			}
		}
	}

	// Public methods
	function addBeat(beatData: LegacyBeatData) {
		const containerBeat = convertLegacyBeatToContainerFormat(beatData);
		sequenceContainer.addBeat(containerBeat as any);

		// Dispatch event
		const beatAddedEvent = new CustomEvent('beat-added', {
			bubbles: true,
			detail: { beat: containerBeat }
		});
		document.dispatchEvent(beatAddedEvent);
	}

	function clearBeats() {
		sequenceContainer.setSequence([]);

		// Dispatch event
		const sequenceClearedEvent = new CustomEvent('sequence-cleared', {
			bubbles: true,
			detail: { timestamp: Date.now() }
		});
		document.dispatchEvent(sequenceClearedEvent);
	}

	function testPersistence() {
		if (typeof window === 'undefined') {
			return {
				success: false,
				message: 'Persistence test failed. Not in browser environment.'
			};
		}

		const savedSequence = localStorage.getItem('sequence');
		const startPosData = localStorage.getItem('start_position');
		const backupData = localStorage.getItem('sequence_backup');

		sequenceContainer.saveToLocalStorage();

		return {
			success: true,
			message: 'Persistence test complete. Sequence saved to localStorage.',
			details: {
				sequenceBeats: sequence.beats.length,
				startPositionSet: !!startPosition,
				sequenceInStorage: !!savedSequence,
				startPositionInStorage: !!startPosData,
				backupInStorage: !!backupData
			}
		};
	}

	// Initialize start position from store
	$effect(() => {
		const unsubscribe = selectedStartPos.subscribe((newStartPos) => {
			if (newStartPos && !startPosition) {
				startPosition = createSafePictographCopy(newStartPos);
			}
		});
		unsubscribe();
	});

	// Listen for start position events
	$effect(() => {
		const handleStartPosSelected = (event: CustomEvent) => {
			if (event.detail?.startPosition) {
				const newStartPos = createSafePictographCopy(event.detail.startPosition);
				if (newStartPos) {
					startPosition = newStartPos;
					selectedStartPos.set(newStartPos);
				}
			}
		};

		document.addEventListener('start-position-selected', handleStartPosSelected as EventListener);
		document.addEventListener('start-position-refresh', handleStartPosSelected as EventListener);

		return () => {
			document.removeEventListener(
				'start-position-selected',
				handleStartPosSelected as EventListener
			);
			document.removeEventListener(
				'start-position-refresh',
				handleStartPosSelected as EventListener
			);
		};
	});

	return {
		// State
		get startPosition() {
			return startPosition;
		},
		get beats() {
			return beats;
		},
		get selectedBeatIds() {
			return selectedBeatIds;
		},
		get selectedBeatIndex() {
			return selectedBeatIndex;
		},
		get sequenceIsEmpty() {
			return sequenceIsEmpty;
		},
		get startPosBeatData() {
			return startPosBeatData;
		},
		get beatCount() {
			return beatCount;
		},

		// Methods
		handleStartPosBeatClick,
		handleBeatClick,
		addBeat,
		clearBeats,
		testPersistence
	};
}
