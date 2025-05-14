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
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';
	import { selectedStartPos } from '$lib/stores/sequence/selectionStore';
	import type { PictographData } from '$lib/types/PictographData';
	import type { BeatData as LegacyBeatData } from '../BeatData';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import { useContainer } from '$lib/state/core/svelte5-integration.svelte';
	import { isSequenceEmpty } from '$lib/state/machines/sequenceMachine/persistence';

	// We'll use custom events instead of Svelte's event dispatcher
	const dispatchBeatSelectedEvent = (beatId: string) => {
		const event = new CustomEvent('beatselected', {
			detail: { beatId },
			bubbles: true
		});
		document.dispatchEvent(event);
	};

	// Use the sequence container with Svelte 5 runes
	const sequence = useContainer(sequenceContainer);

	// Local state
	let startPosition = $state<PictographData | null>(null);
	let sequenceIsEmpty = $state(true);

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

	// Subscribe to isSequenceEmpty store
	$effect(() => {
		const unsubscribe = isSequenceEmpty.subscribe((value) => {
			sequenceIsEmpty = value;
		});

		return () => {
			unsubscribe();
		};
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
				// Create a deep copy to avoid reference issues
				startPosition = JSON.parse(JSON.stringify(newStartPos));
			}
		});

		// Immediately unsubscribe to prevent further updates
		unsubscribe();

		// Listen for the custom event when a start position is selected
		const handleStartPosSelected = (event: CustomEvent) => {
			if (event.detail?.startPosition) {
				// Create a deep copy to avoid reference issues
				const newStartPos = JSON.parse(JSON.stringify(event.detail.startPosition));

				// Update the local state
				startPosition = newStartPos;

				// Update the store (but don't subscribe to its changes to avoid loops)
				selectedStartPos.set(newStartPos);
			}
		};

		document.addEventListener('start-position-selected', handleStartPosSelected as EventListener);

		return () => {
			document.removeEventListener(
				'start-position-selected',
				handleStartPosSelected as EventListener
			);
		};
	});

	// Event handlers
	export function handleStartPosBeatClick() {
		// Dispatch a custom event to trigger the start position selector
		// Create a deep copy of startPosition to avoid reference issues
		const startPosCopy = startPosition ? JSON.parse(JSON.stringify(startPosition)) : null;

		const event = new CustomEvent('select-start-pos', {
			bubbles: true,
			detail: { currentStartPos: startPosCopy }
		});
		document.dispatchEvent(event);
	}

	export function handleBeatClick(beatIndex: number) {
		// Get the beat ID from the index
		if (beatIndex >= 0 && beatIndex < beats.length) {
			const beat = beats[beatIndex];
			const beatId = beat.id;

			if (beatId) {
				// Select the beat in the container
				sequenceContainer.selectBeat(beatId);

				// Dispatch a custom event for the beat selection
				// This will be used by the deletion mode
				dispatchBeatSelectedEvent(beatId);

				// Also dispatch a global event for components that aren't direct parents
				const event = new CustomEvent('beat-selected', {
					bubbles: true,
					detail: { beatId }
				});
				document.dispatchEvent(event);
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
	}

	// Add a method to clear beats (could be called from parent)
	export function clearBeats() {
		// Use the sequence container to clear the sequence
		sequenceContainer.setSequence([]);
	}

	// Add a test method to verify persistence
	export function testPersistence() {
		// Log the current state
		console.log('Current sequence state:', {
			beats: sequence.beats.length,
			startPosition: startPosition ? 'set' : 'not set'
		});

		// Check localStorage
		if (browser) {
			const savedSequence = localStorage.getItem('sequence');
			const startPosData = localStorage.getItem('start_position');
			const backupData = localStorage.getItem('sequence_backup');

			console.log('localStorage state:', {
				sequence: savedSequence ? 'found' : 'not found',
				startPosition: startPosData ? 'found' : 'not found',
				backup: backupData ? 'found' : 'not found'
			});

			if (savedSequence) {
				try {
					const parsed = JSON.parse(savedSequence);
					console.log('Saved sequence contains:', {
						beats: parsed.beats?.length || 0,
						metadata: parsed.metadata ? 'present' : 'missing'
					});
				} catch (e) {
					console.error('Error parsing saved sequence:', e);
				}
			}
		}

		// Force a save
		sequenceContainer.saveToLocalStorage();
		console.log('Forced save to localStorage');

		return {
			success: true,
			message: 'Persistence test complete. Check console for details.'
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
<div style="display: none;" aria-hidden="true">
	<!-- Status for debugging -->
	{#if beats.length >= 0}
		<!-- State manager initialized -->
	{/if}
</div>
