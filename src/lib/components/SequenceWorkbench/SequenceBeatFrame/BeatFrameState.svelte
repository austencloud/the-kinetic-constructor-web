<!-- src/lib/components/SequenceWorkbench/SequenceBeatFrame/BeatFrameState.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { browser } from '$app/environment';
	import type { PictographData } from '$lib/types/PictographData';
	import type { BeatData } from './BeatData';
	import { selectedStartPos } from '$lib/stores/sequence/selectionStore';
	import { initDevToolsUpdater, updateDevTools } from '$lib/utils/devToolsUpdater';
	import { sequenceActions, sequenceSelectors } from '$lib/state/machines/sequenceMachine';
	import { layoutStore } from '$lib/stores/layout/layoutStore';
	import { autoAdjustLayout } from './beatFrameHelpers';

	// Create stores for state management
	const beatsStore = writable<BeatData[]>([]);
	const selectedBeatIdsStore = writable<string[]>([]);
	const selectedBeatIndexStore = writable<number>(-1);
	const startPositionStore = writable<PictographData | null>(null);

	// Local variables
	let beats: BeatData[] = [];
	let selectedBeatIndex: number = -1;
	let startPosition: PictographData | null = null;
	let beatRows = 1;
	let beatCols = 1;
	let prevRows = 1;
	let prevCols = 1;

	// Function to update local state from the sequence store
	function updateLocalState() {
		// Get beats from the sequence store and convert them to our BeatData format
		const storeBeats = sequenceSelectors.beats();
		const convertedBeats = storeBeats.map((storeBeat) => {
			// Convert from store BeatData to our BeatData format
			// Create a proper pictographData object from the store beat data
			const pictographData = {
				letter: storeBeat.metadata?.letter || null,
				startPos: storeBeat.metadata?.startPos || null,
				endPos: storeBeat.metadata?.endPos || null,
				redPropData: storeBeat.redPropData || null,
				bluePropData: storeBeat.bluePropData || null,
				redMotionData: storeBeat.redMotionData || null,
				blueMotionData: storeBeat.blueMotionData || null,
				redArrowData: storeBeat.redArrowData || null,
				blueArrowData: storeBeat.blueArrowData || null
			};

			return {
				id: storeBeat.id,
				beatNumber: storeBeat.number,
				filled: true, // Assume filled if it exists in the store
				pictographData: pictographData,
				duration: 1, // Default duration
				metadata: storeBeat.metadata
			} as BeatData;
		});

		// Update the beats store
		beatsStore.set(convertedBeats);

		// Get selected beat IDs from the sequence store
		const selectedIds = sequenceSelectors.selectedBeatIds();
		selectedBeatIdsStore.set(selectedIds);

		// Find the index of the selected beat in our local beats array
		if (selectedIds.length > 0 && convertedBeats.length > 0) {
			const selectedId = selectedIds[0]; // Just use the first selected ID for now
			const selectedIndex = convertedBeats.findIndex((beat) => beat.id === selectedId);
			selectedBeatIndexStore.set(selectedIndex);
		} else {
			selectedBeatIndexStore.set(-1);
		}
	}

	// Subscribe to the stores to get the current values
	const unsubscribeBeats = beatsStore.subscribe((value) => {
		beats = value;

		// Update layout when beats change
		[beatRows, beatCols] = autoAdjustLayout(Math.max(1, beats.length));

		// Check if the layout has changed
		if (beatRows !== prevRows || beatCols !== prevCols) {
			// Update the layout store
			layoutStore.updateLayout(beatRows, beatCols, beats.length);

			// Update previous values
			prevRows = beatRows;
			prevCols = beatCols;
		}
	});

	const unsubscribeSelectedIds = selectedBeatIdsStore.subscribe(() => {
		// Just keep the subscription active for reactivity
	});

	const unsubscribeSelectedIndex = selectedBeatIndexStore.subscribe((value) => {
		selectedBeatIndex = value;
	});

	// Subscribe to the local start position store
	const unsubscribeStartPos = startPositionStore.subscribe((value) => {
		startPosition = value;
	});

	// Also subscribe to the global selectedStartPos store
	const unsubscribeGlobalStartPos = selectedStartPos.subscribe((startPos) => {
		if (startPos) {
			// Create a deep copy to avoid reference issues
			const startPosCopy = JSON.parse(JSON.stringify(startPos));
			startPositionStore.set(startPosCopy);
		}
	});

	// Set up event listeners for sequence updates
	onMount(() => {
		// Initialize dev tools updater
		if (browser) {
			initDevToolsUpdater();
		}

		// Update local state when sequence is updated
		const handleSequenceUpdate = () => {
			// Update the local state and trigger reactivity
			updateLocalState();
			// Force a component update by triggering a state change
			beatsStore.update((beats) => [...beats]);
			// Update dev tools
			updateDevTools();
		};

		// Listen for sequence-updated events
		document.addEventListener('sequence-updated', handleSequenceUpdate);
		document.addEventListener('beat-selected', handleSequenceUpdate);
		document.addEventListener('beat-deselected', handleSequenceUpdate);
		document.addEventListener('beat-added', handleSequenceUpdate);
		document.addEventListener('beat-removed', handleSequenceUpdate);
		document.addEventListener('beat-updated', handleSequenceUpdate);

		// Set up an interval to periodically check for updates (as a fallback)
		const intervalId = setInterval(() => {
			updateLocalState();
			// Update dev tools periodically
			updateDevTools();
		}, 500);

		// Listen for the custom event when a start position is selected
		const handleStartPosSelected = (event: CustomEvent) => {
			if (event.detail?.startPosition) {
				updateStartPosition(event.detail.startPosition);
			}
		};

		document.addEventListener('start-position-selected', handleStartPosSelected as EventListener);

		return () => {
			// Clean up event listeners
			document.removeEventListener('sequence-updated', handleSequenceUpdate);
			document.removeEventListener('beat-selected', handleSequenceUpdate);
			document.removeEventListener('beat-deselected', handleSequenceUpdate);
			document.removeEventListener('beat-added', handleSequenceUpdate);
			document.removeEventListener('beat-removed', handleSequenceUpdate);
			document.removeEventListener('beat-updated', handleSequenceUpdate);
			document.removeEventListener(
				'start-position-selected',
				handleStartPosSelected as EventListener
			);
			clearInterval(intervalId);
		};
	});

	// Clean up subscriptions on component destroy
	onDestroy(() => {
		unsubscribeBeats();
		unsubscribeSelectedIds();
		unsubscribeSelectedIndex();
		unsubscribeStartPos();
		unsubscribeGlobalStartPos();
	});

	// Initial update
	updateLocalState();

	// Function to update start position
	export function updateStartPosition(newStartPos: PictographData) {
		if (newStartPos) {
			// Create a deep copy to avoid reference issues
			const startPosCopy = JSON.parse(JSON.stringify(newStartPos));
			startPositionStore.set(startPosCopy);
		}
	}

	// Add a method to add beats (could be called from parent)
	export function addBeat(beatData: BeatData) {
		// Ensure the beat has an ID
		const beatWithId = beatData.id ? beatData : { ...beatData, id: crypto.randomUUID() };

		// Use the sequence machine to add the beat
		sequenceActions.addBeat(beatWithId);
	}

	// Add a method to clear beats (could be called from parent)
	export function clearBeats() {
		// Use the sequence machine to clear the sequence
		sequenceActions.clearSequence();
	}

	// Function to handle beat selection
	export function selectBeat(beatIndex: number) {
		// Get the beat ID from the index
		if (beatIndex >= 0 && beatIndex < beats.length) {
			const beat = beats[beatIndex];
			const beatId = beat.id;

			if (beatId) {
				sequenceActions.selectBeat(beatId);
			}
		}
	}

	// Function to deselect the current beat
	export function deselectBeat() {
		sequenceActions.deselectBeat();
	}

	// Initialize state immediately
	updateLocalState();

	// Expose the current state
	export { beats, selectedBeatIndex, startPosition, beatRows, beatCols };
</script>

<!-- This component doesn't render anything, it just manages state -->
<div style="display: none;"></div>
