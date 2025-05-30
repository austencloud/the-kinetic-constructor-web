// src/lib/components/SequenceWorkbench/BeatFrame/composables/useBeatFrameState.svelte.ts

import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer.svelte';
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
import { selectedStartPos } from '$lib/state/machines/sequenceMachine/persistence';
import { untrack } from 'svelte';

/**
 * Composable for managing BeatFrame state using Svelte 5 runes
 */
export function useBeatFrameState() {
	// Local reactive state
	let startPosition = $state<PictographData | null>(null);
	let sequenceIsEmpty = $state(true);
	let sequence = $state(sequenceContainer.state);

	// Guard flags to prevent infinite loops
	let isUpdatingFromContainer = false;
	let isUpdatingFromModernState = false;

	// 🚨 NUCLEAR FIX: COMPLETELY DISABLE circular reactive effects to prevent infinite loops
	// The issue is that these two effects create a circular dependency:
	// 1. Container changes → Effect 1 → Updates local sequence
	// 2. Modern state changes → Effect 2 → Updates container → Triggers Effect 1 → INFINITE LOOP

	// 🔧 SYSTEMATIC TEST 15: Re-enable useBeatFrameState main reactive effect - WATCHING FOR LOOPS
	$effect(() => {
		// Simple one-way sync: sequenceState → local sequence (no circular dependency)
		const modernBeats = untrack(() => sequenceState.beats);
		const modernIsEmpty = untrack(() => sequenceState.isEmpty);
		const modernStartPos = untrack(() => sequenceState.startPosition);

		// 🔧 FIX: Use untrack() around state mutations to prevent infinite loops
		untrack(() => {
			// Update local state directly without triggering container updates
			sequenceIsEmpty = modernIsEmpty;

			// 🔧 SYSTEMATIC TEST 18: Sync start position from sequenceState - WATCHING FOR LOOPS
			if (modernStartPos !== startPosition) {
				startPosition = modernStartPos;
			}
		});

		// Only update sequence if beat count changed (prevents unnecessary updates)
		if (modernBeats.length !== sequence.beats.length) {
			// Convert modern beats to container format
			const containerBeats = modernBeats.map((beat) => convertPictographToContainerFormat(beat));
			// Update sequence directly without triggering reactive loops
			sequence = { ...sequence, beats: containerBeats };
		}
	});
	console.log(
		'🔧 SYSTEMATIC TEST 15 + 18: useBeatFrameState reactive effects re-enabled with start position sync - WATCHING FOR LOOPS'
	);

	// TEMPORARILY DISABLE both effects to break the infinite loop
	// $effect(() => {
	// 	if (!isUpdatingFromModernState) {
	// 		untrack(() => {
	// 			isUpdatingFromContainer = true;
	// 			sequence = sequenceContainer.state;
	// 			isUpdatingFromContainer = false;
	// 		});
	// 	}
	// });

	// TEMPORARILY DISABLE the modern state sync effect
	// let syncTimeout: ReturnType<typeof setTimeout> | null = null;
	// $effect(() => {
	// 	// Track modern sequence state changes
	// 	const modernBeats = sequenceState.beats;
	// 	const modernStartPos = sequenceState.startPosition;
	// 	const modernIsEmpty = sequenceState.isEmpty;

	// 	// Clear existing timeout to debounce updates
	// 	if (syncTimeout) {
	// 		clearTimeout(syncTimeout);
	// 	}

	// 	// Debounced sync to prevent rapid updates
	// 	syncTimeout = setTimeout(() => {
	// 		untrack(() => {
	// 			if (!isUpdatingFromContainer) {
	// 				isUpdatingFromModernState = true;

	// 				// Update local state
	// 				sequenceIsEmpty = modernIsEmpty;

	// 				// Sync modern state to container if needed (with length check to prevent unnecessary updates)
	// 				if (modernBeats.length !== sequence.beats.length) {
	// 					const containerBeats = modernBeats.map((beat) =>
	// 						convertPictographToContainerFormat(beat)
	// 					);
	// 					sequenceContainer.setSequence(containerBeats);
	// 				}

	// 				// Update start position if changed
	// 				if (modernStartPos !== startPosition) {
	// 					startPosition = modernStartPos;
	// 				}

	// 				isUpdatingFromModernState = false;
	// 			}
	// 		});
	// 	}, 50); // 50ms debounce
	// });

	// 🧪 NUCLEAR TEST: Disable $derived chains to prevent infinite loops
	// const beats = $derived(convertContainerBeatsToLegacyFormat(sequence.beats));
	// const selectedBeatIds = $derived(sequence.selectedBeatIds);
	// const selectedBeatIndex = $derived(
	// 	selectedBeatIds.length > 0 ? beats.findIndex((beat) => beat.id === selectedBeatIds[0]) : -1
	// );
	// const beatCount = $derived(beats.length);

	// Static fallback values to prevent component crashes
	const beats = $derived(convertContainerBeatsToLegacyFormat(sequence.beats));
	const selectedBeatIds = $derived(sequence.selectedBeatIds);
	const selectedBeatIndex = $derived(
		selectedBeatIds.length > 0 ? beats.findIndex((beat) => beat.id === selectedBeatIds[0]) : -1
	);

	// Keep remaining $derived chain disabled for now
	// const beatCount = $derived(beats.length);

	// Static fallback value for the remaining disabled chain
	const beatCount = 0;
	console.log('🧪 NUCLEAR TEST: useBeatFrameState $derived chains disabled');

	// 🔧 SYSTEMATIC TEST 17: Re-enable start position beat data $derived - WATCHING FOR LOOPS
	const startPosBeatData = $derived({
		beatNumber: 0,
		filled: !!startPosition,
		pictographData: startPosition || defaultPictographData
	});
	console.log('🔧 SYSTEMATIC TEST 17: startPosBeatData $derived re-enabled - WATCHING FOR LOOPS');

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

	// 🧪 NUCLEAR TEST: Disable keyboard event listeners to prevent infinite loops
	// $effect(() => {
	// 	if (typeof window === 'undefined') return;

	// 	const handleKeyDown = (e: KeyboardEvent) => {
	// 		if (e.key === 'Shift') {
	// 			isShiftKeyPressed = true;
	// 		}
	// 		if (e.key === 'Control' || e.key === 'Meta') {
	// 			isCtrlKeyPressed = true;
	// 		}
	// 	};

	// 	const handleKeyUp = (e: KeyboardEvent) => {
	// 		if (e.key === 'Shift') {
	// 			isShiftKeyPressed = false;
	// 		}
	// 		if (e.key === 'Control' || e.key === 'Meta') {
	// 			isCtrlKeyPressed = false;
	// 		}
	// 	};

	// 	const handleBlur = () => {
	// 		isShiftKeyPressed = false;
	// 		isCtrlKeyPressed = false;
	// 	};

	// 	window.addEventListener('keydown', handleKeyDown);
	// 	window.addEventListener('keyup', handleKeyUp);
	// 	window.addEventListener('blur', handleBlur);

	// 	return () => {
	// 		window.removeEventListener('keydown', handleKeyDown);
	// 		window.removeEventListener('keyup', handleKeyUp);
	// 		window.removeEventListener('blur', handleBlur);
	// 	};
	// });
	console.log('🧪 NUCLEAR TEST: Keyboard event listeners disabled');

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

	// 🧪 NUCLEAR TEST: Disable start position initialization to prevent infinite loops
	let isInitializingStartPos = false;
	// $effect(() => {
	// 	const unsubscribe = selectedStartPos.subscribe((newStartPos) => {
	// 		if (newStartPos && !startPosition && !isInitializingStartPos) {
	// 			untrack(() => {
	// 				isInitializingStartPos = true;
	// 				startPosition = createSafePictographCopy(newStartPos);
	// 				isInitializingStartPos = false;
	// 			});
	// 		}
	// 	});
	// 	return unsubscribe;
	// });

	// 🧪 NUCLEAR TEST: Disable start position event listeners to prevent infinite loops
	let eventTimeout: ReturnType<typeof setTimeout> | null = null;
	// $effect(() => {
	// 	const handleStartPosSelected = (event: CustomEvent) => {
	// 		if (event.detail?.startPosition && !isInitializingStartPos) {
	// 			// Clear existing timeout to debounce events
	// 			if (eventTimeout) {
	// 				clearTimeout(eventTimeout);
	// 			}

	// 			// Debounced event handling
	// 			eventTimeout = setTimeout(() => {
	// 				untrack(() => {
	// 					isInitializingStartPos = true;
	// 					const newStartPos = createSafePictographCopy(event.detail.startPosition);
	// 					if (newStartPos) {
	// 						startPosition = newStartPos;
	// 						selectedStartPos.set(newStartPos as any);
	// 					}
	// 					isInitializingStartPos = false;
	// 				});
	// 			}, 100); // 100ms debounce for events
	// 		}
	// 	};

	// 	document.addEventListener('start-position-selected', handleStartPosSelected as EventListener);
	// 	document.addEventListener('start-position-refresh', handleStartPosSelected as EventListener);

	// 	return () => {
	// 		if (eventTimeout) {
	// 			clearTimeout(eventTimeout);
	// 		}
	// 		document.removeEventListener(
	// 			'start-position-selected',
	// 			handleStartPosSelected as EventListener
	// 		);
	// 		document.removeEventListener(
	// 			'start-position-refresh',
	// 			handleStartPosSelected as EventListener
	// 		);
	// 	};
	// });
	console.log('🧪 NUCLEAR TEST: Start position effects disabled');

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
