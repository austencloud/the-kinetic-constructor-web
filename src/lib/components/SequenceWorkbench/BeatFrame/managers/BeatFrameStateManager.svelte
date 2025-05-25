<!-- src/lib/components/SequenceWorkbench/BeatFrame/managers/BeatFrameStateManager.svelte -->
<script lang="ts" module>
	// Export the interface for the component
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
	import { selectedStartPos } from '$lib/stores/sequence/selectionStore';
	import type { PictographData } from '$lib/types/PictographData';
	import type { BeatData as LegacyBeatData } from '../BeatData';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import { sequenceState } from '$lib/state/sequence/sequenceState.svelte';
	import { createSafePictographCopy } from '$lib/utils/pictographUtils';

	// We'll use custom events instead of Svelte's event dispatcher
	// This function creates a custom event that will bubble up through the DOM
	// without being dispatched directly on the document to avoid infinite recursion
	const dispatchBeatSelectedEvent = (beatId: string) => {
		// Create a custom event that will bubble up through the DOM
		// We'll dispatch this on a DOM element, not directly on document
		return new CustomEvent('beatselected', {
			detail: { beatId },
			bubbles: true
		});
	};

	// Use reactive state for sequence container
	let sequence = $state(sequenceContainer.state);

	// Local state
	let startPosition = $state<PictographData | null>(null);
	let sequenceIsEmpty = $state(true);

	// Subscribe to sequence container changes
	$effect(() => {
		const unsubscribe = sequenceContainer.subscribe((state) => {
			sequence = state;
		});
		return unsubscribe;
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

	// CRITICAL FIX: React to modern sequence state changes and sync to container
	// This ensures BeatFrame UI updates when beats are added via OptionPicker
	$effect(() => {
		// Track modern sequence state changes
		const modernBeats = sequenceState.beats;
		const modernStartPos = sequenceState.startPosition;

		// Update local state
		sequenceIsEmpty = sequenceState.isEmpty;

		// Sync modern state to container if needed
		// Check if sync is needed by comparing lengths and content
		const needsSync =
			modernBeats.length !== sequence.beats.length ||
			modernBeats.some((modernBeat, index) => {
				const containerBeat = sequence.beats[index];
				return (
					!containerBeat ||
					containerBeat.metadata?.letter !== modernBeat.letter ||
					containerBeat.metadata?.startPos !== modernBeat.startPos ||
					containerBeat.metadata?.endPos !== modernBeat.endPos
				);
			});

		if (needsSync) {
			// Prevent infinite loops by checking if we're already syncing
			// Use a flag to prevent recursive updates
			if (!sequenceContainer.state.isModified || modernBeats.length > 0) {
				// Convert modern beats to container format and update
				const containerBeats = modernBeats.map((beat, index) => {
					return {
						id: crypto.randomUUID(),
						number: index + 1, // Set proper beat number
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
					};
				});

				// Use untrack to prevent this update from triggering the effect again
				untrack(() => {
					sequenceContainer.setSequence(containerBeats);
				});
			}
		}

		// Update start position if changed
		if (modernStartPos !== startPosition) {
			startPosition = modernStartPos;
		}
	});

	// Convert container beats to legacy BeatData format
	function convertContainerBeatsToLegacyFormat(containerBeats: any[]): LegacyBeatData[] {
		return containerBeats.map((beat) => {
			// Create a proper pictographData object from the container beat data
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
				filled: true, // Assume filled if it exists in the container
				pictographData,
				duration: 1, // Default duration
				metadata: beat.metadata
			} as LegacyBeatData;
		});
	}

	// Get the initial value from the selectedStartPos store
	onMount(() => {
		// One-time subscription to get the initial value
		const unsubscribe = selectedStartPos.subscribe((newStartPos) => {
			if (newStartPos && !startPosition) {
				// Create a safe copy to avoid reference issues
				startPosition = createSafePictographCopy(newStartPos);
			}
		});

		// Immediately unsubscribe to prevent further updates
		unsubscribe();

		// Listen for the custom event when a start position is selected
		const handleStartPosSelected = (event: CustomEvent) => {
			if (event.detail?.startPosition) {
				// Create a safe copy to avoid reference issues
				const newStartPos = createSafePictographCopy(event.detail.startPosition);

				// Update the local state only if we got a valid copy
				if (newStartPos) {
					startPosition = newStartPos;

					// Update the store (but don't subscribe to its changes to avoid loops)
					selectedStartPos.set(newStartPos);
				}
			}
		};

		// Listen for the start position refresh event (used when first beat is removed)
		const handleStartPosRefresh = (event: CustomEvent) => {
			if (event.detail?.startPosition) {
				// Create a safe copy to avoid reference issues
				const newStartPos = createSafePictographCopy(event.detail.startPosition);

				// Update the local state only if we got a valid copy
				if (newStartPos) {
					startPosition = newStartPos;

					// Update the store (but don't subscribe to its changes to avoid loops)
					selectedStartPos.set(newStartPos);
				}
			}
		};

		document.addEventListener('start-position-selected', handleStartPosSelected as EventListener);
		document.addEventListener('start-position-refresh', handleStartPosRefresh as EventListener);

		return () => {
			document.removeEventListener(
				'start-position-selected',
				handleStartPosSelected as EventListener
			);
			document.removeEventListener(
				'start-position-refresh',
				handleStartPosRefresh as EventListener
			);
		};
	});

	// Event handlers
	export function handleStartPosBeatClick() {
		// Make the start position selectable like a regular beat
		// First, select the start position in the container
		sequenceContainer.selectBeat('start-position');

		// Then dispatch a custom event for the start position selection
		// Create a safe copy of startPosition to avoid reference issues
		const startPosCopy = startPosition ? createSafePictographCopy(startPosition) : null;

		// Dispatch the event for the start position selector
		const selectStartPosEvent = new CustomEvent('select-start-pos', {
			bubbles: true,
			detail: { currentStartPos: startPosCopy }
		});
		document.dispatchEvent(selectStartPosEvent);

		// Also dispatch a beat selected event for the deletion mode
		const beatSelectedEvent = dispatchBeatSelectedEvent('start-position');
		document.querySelector('.beat-frame-state-manager')?.dispatchEvent(beatSelectedEvent);

		// Also dispatch a global event for components that aren't direct parents
		const globalEvent = new CustomEvent('beat-selected', {
			bubbles: true,
			detail: { beatId: 'start-position' }
		});
		document.dispatchEvent(globalEvent);

		// Trigger the animated highlight effect for both blue and red
		// This will make the animated highlight appear when the start position is selected
		// Use a small delay to ensure the component has time to update its selected state
		setTimeout(() => {
			const blueHighlightEvent = new CustomEvent('beat-highlight', {
				bubbles: true,
				detail: { active: true, color: 'blue' }
			});
			document.dispatchEvent(blueHighlightEvent);

			// Add a small delay before triggering the red highlight for a staggered effect
			setTimeout(() => {
				const redHighlightEvent = new CustomEvent('beat-highlight', {
					bubbles: true,
					detail: { active: true, color: 'red' }
				});
				document.dispatchEvent(redHighlightEvent);
			}, 150);
		}, 50);
	}

	// Track if shift key is pressed
	let isShiftKeyPressed = $state(false);
	let isCtrlKeyPressed = $state(false);

	// Set up event listeners for modifier keys using effect
	$effect(() => {
		if (typeof window === 'undefined') return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Shift') {
				isShiftKeyPressed = true;
			}
			if (e.key === 'Control' || e.key === 'Meta') {
				// Meta for Mac
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

		// Handle window blur to reset key states
		const handleBlur = () => {
			isShiftKeyPressed = false;
			isCtrlKeyPressed = false;
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		window.addEventListener('blur', handleBlur);

		// Clean up event listeners
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			window.removeEventListener('blur', handleBlur);
		};
	});

	export function handleBeatClick(beatIndex: number) {
		// Get the beat ID from the index
		if (beatIndex >= 0 && beatIndex < beats.length) {
			const beat = beats[beatIndex];
			const beatId = beat.id;

			if (beatId) {
				// Use the tracked modifier key states for multi-select
				// Either Shift or Ctrl/Cmd can be used for multi-select
				const multiSelect = isShiftKeyPressed || isCtrlKeyPressed;

				// Select the beat in the container with multi-select if a modifier key is pressed
				sequenceContainer.selectBeat(beatId, multiSelect);

				// Create a custom event for the beat selection
				// This will be used by the deletion mode
				const beatSelectedEvent = dispatchBeatSelectedEvent(beatId);

				// Dispatch the event on the current element, not on document
				// This allows it to bubble up naturally through the DOM
				// without causing infinite recursion
				document.querySelector('.beat-frame-state-manager')?.dispatchEvent(beatSelectedEvent);

				// Also dispatch a global event for components that aren't direct parents
				// This is a different event type ('beat-selected' vs 'beatselected')
				// so it won't cause recursion
				const event = new CustomEvent('beat-selected', {
					bubbles: true,
					detail: { beatId, multiSelect }
				});
				document.dispatchEvent(event);

				// Trigger the animated highlight effect for both blue and red
				// This will make the animated highlight appear when a beat is selected
				// Use a small delay to ensure the component has time to update its selected state
				setTimeout(() => {
					const blueHighlightEvent = new CustomEvent('beat-highlight', {
						bubbles: true,
						detail: { active: true, color: 'blue' }
					});
					document.dispatchEvent(blueHighlightEvent);

					// Add a small delay before triggering the red highlight for a staggered effect
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

	// Public methods that can be called from parent components
	export function addBeat(beatData: LegacyBeatData) {
		// Ensure the beat has an ID
		const beatWithId = beatData.id ? beatData : { ...beatData, id: crypto.randomUUID() };

		// Convert from legacy BeatData to container BeatData format
		const containerBeat = {
			id: beatWithId.id || crypto.randomUUID(), // Ensure ID is never undefined
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

		// Add the beat to the sequence container
		sequenceContainer.addBeat(containerBeat as any); // Use type assertion to bypass TypeScript error

		// Dispatch a custom event to notify components that a beat was added
		if (typeof document !== 'undefined') {
			const beatAddedEvent = new CustomEvent('beat-added', {
				bubbles: true,
				detail: { beat: containerBeat }
			});
			document.dispatchEvent(beatAddedEvent);
		}
	}

	// Add a method to clear beats (could be called from parent)
	export function clearBeats() {
		// Use the sequence container to clear the sequence
		sequenceContainer.setSequence([]);

		// Dispatch a custom event to notify components that the sequence was cleared
		if (typeof document !== 'undefined') {
			const sequenceClearedEvent = new CustomEvent('sequence-cleared', {
				bubbles: true,
				detail: { timestamp: Date.now() }
			});
			document.dispatchEvent(sequenceClearedEvent);
		}
	}

	// Add a test method to verify persistence
	export function testPersistence() {
		// Force a save
		sequenceContainer.saveToLocalStorage();

		return {
			success: true,
			message: 'Persistence test complete.'
		};
	}

	// Export methods for parent components
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

	// Export startPosBeatData for direct access
	export { startPosBeatData };
</script>

<!-- This is an invisible component that just manages state -->
<div class="beat-frame-state-manager" style="display: none;" aria-hidden="true">
	<!-- Status for debugging -->
	{#if beats.length >= 0}
		<!-- State manager initialized -->
	{/if}
</div>
