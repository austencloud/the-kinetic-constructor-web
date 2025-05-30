<!-- src/lib/components/SequenceWorkbench/BeatFrame/managers/BeatFrameStateManager.svelte -->
<script lang="ts" module>
	export interface BeatFrameStateManager {
		getState: () => {
			startPosition: any;
			beats: any[];
			selectedBeatIds: string[];
			selectedBeatIndex: number;
			sequenceIsEmpty: boolean;
		};
		addBeat: (beatData: any) => void;
		clearBeats: () => void;
		testPersistence: () => { success: boolean; message: string };
	}
</script>

<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';
	import {
		getSelectedStartPosition,
		setSelectedStartPosition
	} from '$lib/state/sequence/selectionState.svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import type { BeatData as LegacyBeatData } from '../BeatData';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer.svelte';
	import { sequenceState } from '$lib/state/sequence/sequenceState.svelte';
	import { createSafePictographCopy } from '$lib/utils/pictographUtils';

	const dispatchBeatSelectedEvent = (beatId: string) => {
		return new CustomEvent('beatselected', {
			detail: { beatId },
			bubbles: true
		});
	};

	let sequence = $state(sequenceContainer.state);
	let startPosition = $state<PictographData | null>(null);
	let sequenceIsEmpty = $state(true);

	$effect(() => {
		sequence = sequenceContainer.state;
	});

	const beats = $derived(convertContainerBeatsToLegacyFormat(sequence.beats));
	const selectedBeatIds = $derived(sequence.selectedBeatIds);
	const selectedBeatIndex = $derived(
		selectedBeatIds.length > 0 ? beats.findIndex((beat) => beat.id === selectedBeatIds[0]) : -1
	);
	const beatCount = $derived(beats.length);
	const startPosBeatData = $derived({
		beatNumber: 0,
		filled: !!startPosition,
		pictographData: startPosition || defaultPictographData
	});

	// 🚨 EMERGENCY FIX: Add proper loop prevention with deep comparison
	let lastStartPosId = $state<string | null>(null);
	let isUpdatingStartPos = false;

	// NUCLEAR DISABLE: Main reactive effect causing infinite loops - CONFIRMED CULPRIT
	// $effect(() => {
	// 	const modernBeats = sequenceState.beats;
	// 	const modernStartPos = sequenceState.startPosition;
	// 	const modernIsEmpty = sequenceState.isEmpty;

	// 	// Create a unique ID for the start position to detect actual changes
	// 	const currentStartPosId = modernStartPos
	// 		? `${modernStartPos.letter}-${modernStartPos.startPos}-${modernStartPos.endPos}`
	// 		: null;

	// 	// Only update if the start position actually changed (not just a proxy update)
	// 	if (currentStartPosId !== lastStartPosId && !isUpdatingStartPos) {
	// 		isUpdatingStartPos = true;

	// 		untrack(() => {
	// 			console.log('3️⃣ BeatFrameStateManager start position ACTUALLY changed:', currentStartPosId);
	// 			startPosition = modernStartPos;
	// 			sequenceIsEmpty = modernIsEmpty;
	// 			lastStartPosId = currentStartPosId;

	// 			if (modernStartPos) {
	// 				console.log(
	// 					'✅ FIXED: Start position updated in BeatFrameStateManager',
	// 					modernStartPos.letter
	// 				);
	// 			}
	// 		});

	// 		// Reset flag after a short delay
	// 		setTimeout(() => {
	// 			isUpdatingStartPos = false;
	// 		}, 50);
	// 	}

	// 	// Handle beats sync separately with its own guard
	// 	const needsSync = modernBeats.length !== sequence.beats.length;

	// 	if (needsSync && !sequenceContainer.state.isModified) {
	// 		const containerBeats = modernBeats.map((beat, index) => ({
	// 			id: crypto.randomUUID(),
	// 			number: index + 1,
	// 			redPropData: beat.redPropData,
	// 			bluePropData: beat.bluePropData,
	// 			redMotionData: beat.redMotionData,
	// 			blueMotionData: beat.blueMotionData,
	// 			redArrowData: beat.redArrowData,
	// 			blueArrowData: beat.blueArrowData,
	// 			metadata: {
	// 				letter: beat.letter,
	// 				startPos: beat.startPos,
	// 				endPos: beat.endPos,
	// 				gridMode: beat.gridMode,
	// 				timing: beat.timing,
	// 				direction: beat.direction
	// 			}
	// 		}));

	// 		untrack(() => {
	// 			sequenceContainer.setSequence(containerBeats);
	// 		});
	// 	}
	// });

	function convertContainerBeatsToLegacyFormat(containerBeats: any[]): LegacyBeatData[] {
		return containerBeats.map((beat) => {
			const pictographData = {
				letter: beat.metadata?.letter || null,
				startPos: beat.metadata?.startPos || null,
				endPos: beat.metadata?.endPos || null,
				gridMode: beat.metadata?.gridMode || 'diamond',
				redPropData: beat.redPropData || null,
				bluePropData: beat.bluePropData || null,
				redMotionData: beat.redMotionData || null,
				blueMotionData: beat.blueMotionData || null,
				redArrowData: beat.redArrowData || null,
				blueArrowData: beat.blueArrowData || null,
				grid: beat.metadata?.grid || ''
			};

			return {
				id: beat.id,
				beatNumber: beat.number,
				filled: true,
				pictographData,
				duration: 1,
				metadata: beat.metadata
			} as LegacyBeatData;
		});
	}

	onMount(() => {
		const currentStartPosition = getSelectedStartPosition();
		if (currentStartPosition && !startPosition) {
			startPosition = createSafePictographCopy(currentStartPosition);
		}

		const handleStartPosSelected = (event: CustomEvent) => {
			if (event.detail?.startPosition) {
				const newStartPos = createSafePictographCopy(event.detail.startPosition);

				if (newStartPos) {
					startPosition = newStartPos;
					setSelectedStartPosition(newStartPos);
				}
			}
		};

		const handleStartPosRefresh = (event: CustomEvent) => {
			if (event.detail?.startPosition) {
				const newStartPos = createSafePictographCopy(event.detail.startPosition);

				if (newStartPos) {
					startPosition = newStartPos;
					setSelectedStartPosition(newStartPos);
				}
			}
		};

		// 🔄 NON-REACTIVE APPROACH: Listen for beat-added events and manually sync
		const handleBeatAdded = (event: CustomEvent) => {
			console.log('🔄 NON-REACTIVE: Beat added event received, manually syncing beats');

			// 🔧 FIX: Use untrack() to prevent reactive loops when accessing sequenceState
			const currentBeats = untrack(() => sequenceState.beats);

			// Convert to container format
			const containerBeats = currentBeats.map((beat, index) => ({
				id: crypto.randomUUID(),
				number: index + 1,
				redPropData: beat.redPropData,
				bluePropData: beat.bluePropData,
				redMotionData: beat.redMotionData,
				blueMotionData: beat.blueMotionData,
				redArrowData: beat.redArrowData,
				blueArrowData: beat.blueArrowData,
				metadata: {
					letter: beat.letter,
					startPos: beat.startPos,
					endPos: beat.endPos,
					gridMode: beat.gridMode,
					timing: beat.timing,
					direction: beat.direction
				}
			}));

			// Update the container without reactive effects
			sequenceContainer.setSequence(containerBeats);

			console.log('🔄 NON-REACTIVE: Beats synced to container', {
				beatsCount: containerBeats.length
			});
		};

		document.addEventListener('start-position-selected', handleStartPosSelected as EventListener);
		document.addEventListener('start-position-refresh', handleStartPosRefresh as EventListener);
		document.addEventListener('beat-added', handleBeatAdded as EventListener);

		return () => {
			document.removeEventListener(
				'start-position-selected',
				handleStartPosSelected as EventListener
			);
			document.removeEventListener(
				'start-position-refresh',
				handleStartPosRefresh as EventListener
			);
			document.removeEventListener('beat-added', handleBeatAdded as EventListener);
		};
	});

	export function handleStartPosBeatClick() {
		sequenceContainer.selectBeat('start-position');

		const startPosCopy = startPosition ? createSafePictographCopy(startPosition) : null;

		const selectStartPosEvent = new CustomEvent('select-start-pos', {
			bubbles: true,
			detail: { currentStartPos: startPosCopy }
		});
		document.dispatchEvent(selectStartPosEvent);

		const beatSelectedEvent = dispatchBeatSelectedEvent('start-position');
		document.querySelector('.beat-frame-state-manager')?.dispatchEvent(beatSelectedEvent);

		const globalEvent = new CustomEvent('beat-selected', {
			bubbles: true,
			detail: { beatId: 'start-position' }
		});
		document.dispatchEvent(globalEvent);

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

	let isShiftKeyPressed = $state(false);
	let isCtrlKeyPressed = $state(false);

	// NUCLEAR DISABLE: Keyboard effect - may contribute to loops
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

	export function handleBeatClick(beatIndex: number) {
		if (beatIndex >= 0 && beatIndex < beats.length) {
			const beat = beats[beatIndex];
			const beatId = beat.id;

			if (beatId) {
				const multiSelect = isShiftKeyPressed || isCtrlKeyPressed;

				sequenceContainer.selectBeat(beatId, multiSelect);

				const beatSelectedEvent = dispatchBeatSelectedEvent(beatId);
				document.querySelector('.beat-frame-state-manager')?.dispatchEvent(beatSelectedEvent);

				const event = new CustomEvent('beat-selected', {
					bubbles: true,
					detail: { beatId, multiSelect }
				});
				document.dispatchEvent(event);

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

	export function addBeat(beatData: LegacyBeatData) {
		const beatWithId = beatData.id ? beatData : { ...beatData, id: crypto.randomUUID() };

		const containerBeat = {
			id: beatWithId.id || crypto.randomUUID(),
			number: beatWithId.beatNumber,
			redPropData: beatWithId.pictographData.redPropData,
			bluePropData: beatWithId.pictographData.bluePropData,
			redMotionData: beatWithId.pictographData.redMotionData,
			blueMotionData: beatWithId.pictographData.blueMotionData,
			redArrowData: beatWithId.pictographData.redArrowData,
			blueArrowData: beatWithId.pictographData.blueArrowData,
			metadata: {
				...beatWithId.metadata,
				letter: beatWithId.pictographData.letter,
				startPos: beatWithId.pictographData.startPos,
				endPos: beatWithId.pictographData.endPos,
				gridMode: beatWithId.pictographData.gridMode
			}
		};

		sequenceContainer.addBeat(containerBeat as any);

		if (typeof document !== 'undefined') {
			const beatAddedEvent = new CustomEvent('beat-added', {
				bubbles: true,
				detail: { beat: containerBeat }
			});
			document.dispatchEvent(beatAddedEvent);
		}
	}

	export function clearBeats() {
		sequenceContainer.setSequence([]);

		if (typeof document !== 'undefined') {
			const sequenceClearedEvent = new CustomEvent('sequence-cleared', {
				bubbles: true,
				detail: { timestamp: Date.now() }
			});
			document.dispatchEvent(sequenceClearedEvent);
		}
	}

	export function testPersistence() {
		sequenceContainer.saveToLocalStorage();

		return {
			success: true,
			message: 'Persistence test complete.'
		};
	}

	export function getState() {
		return {
			startPosition,
			beats,
			selectedBeatIds,
			selectedBeatIndex,
			sequenceIsEmpty,
			startPosBeatData,
			beatCount
		};
	}

	export { startPosBeatData };
</script>

<div class="beat-frame-state-manager" style="display: none;" aria-hidden="true">
	{#if beats.length >= 0}
		<!-- State manager initialized -->
	{/if}
</div>
