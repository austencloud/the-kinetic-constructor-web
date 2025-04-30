<!-- src/lib/components/SequenceWorkbench/SequenceBeatFrame/SequenceBeatFrame.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { useResizeObserver } from '$lib/composables/useResizeObserver';
	import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';
	import { autoAdjustLayout, calculateCellSize } from './beatFrameHelpers';
	import { selectedStartPos } from '$lib/stores/sequence/selectionStore';
	import { writable } from 'svelte/store';
	import type { PictographData } from '$lib/types/PictographData';
	import type { BeatData } from './BeatData';
	import { browser } from '$app/environment'; // Import browser check
	import { initDevToolsUpdater, updateDevTools } from '$lib/utils/devToolsUpdater';

	// Import the sequence machine actions and selectors
	import { sequenceActions, sequenceSelectors } from '$lib/state/machines/sequenceMachine';

	// Components
	import StartPosBeat from './StartPosBeat.svelte';
	import Beat from './Beat.svelte';
	import SelectionOverlay from './SelectionOverlay.svelte';
	import ReversalGlyph from './ReversalGlyph.svelte';
	import BeatNumberLabel from './BeatNumberLabel.svelte';
	const ssrDefaults = { width: 800, height: 600 }; // Example reasonable defaults
	const { size, resizeObserver } = useResizeObserver(
		browser ? undefined : ssrDefaults // Pass undefined in browser to let hook calculate, use defaults for SSR
		// OR ensure useResizeObserver internally handles SSR returning 0s or defaults
	);
	// No gap between cells

	// Use reactive stores for beats and selection state
	// Create a store that updates whenever the sequence store changes
	const beatsStore = writable<BeatData[]>([]);
	const selectedBeatIdsStore = writable<string[]>([]);
	const selectedBeatIndexStore = writable<number>(-1);
	let startPosition: PictographData | null = null;

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

		// Calculate the selected beat index based on the selected beat ID
		if (selectedIds.length > 0) {
			const selectedId = selectedIds[0];
			const index = convertedBeats.findIndex((beat) => beat.id === selectedId);
			selectedBeatIndexStore.set(index);
		} else {
			selectedBeatIndexStore.set(-1);
		}
	}

	// Subscribe to the stores to get the current values
	let beats: BeatData[] = [];
	let selectedBeatIndex: number = -1;

	const unsubscribeBeats = beatsStore.subscribe((value) => (beats = value));
	// We don't need to track selectedBeatIds directly in the component
	const unsubscribeSelectedIds = selectedBeatIdsStore.subscribe(() => {
		// Just keep the subscription active for reactivity
	});
	const unsubscribeSelectedIndex = selectedBeatIndexStore.subscribe(
		(value) => (selectedBeatIndex = value)
	);

	// Clean up subscriptions on component destroy
	onDestroy(() => {
		unsubscribeBeats();
		unsubscribeSelectedIds();
		unsubscribeSelectedIndex();
	});

	// Initial update
	updateLocalState();

	// Local store just for the start position
	const startPositionStore = writable<PictographData | null>(null);

	// Subscribe to the local start position store
	const unsubscribeStartPos = startPositionStore.subscribe((value) => (startPosition = value));

	// Also subscribe to the global selectedStartPos store
	const unsubscribeGlobalStartPos = selectedStartPos.subscribe((startPos) => {
		if (startPos) {
			// Create a deep copy to avoid reference issues
			const startPosCopy = JSON.parse(JSON.stringify(startPos));
			startPositionStore.set(startPosCopy);
			console.log('SequenceBeatFrame: Updated startPositionStore with startPos:', startPosCopy);
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

		// Listen for dev tools update events
		document.addEventListener('dev-tools-update', () => {
			console.log('[Dev Tools] Update event received');
		});

		// Set up an interval to periodically check for updates (as a fallback)
		const intervalId = setInterval(() => {
			updateLocalState();
			// Update dev tools periodically
			updateDevTools();
		}, 500);

		return () => {
			// Clean up event listeners
			document.removeEventListener('sequence-updated', handleSequenceUpdate);
			document.removeEventListener('beat-selected', handleSequenceUpdate);
			document.removeEventListener('beat-deselected', handleSequenceUpdate);
			document.removeEventListener('beat-added', handleSequenceUpdate);
			document.removeEventListener('beat-removed', handleSequenceUpdate);
			document.removeEventListener('beat-updated', handleSequenceUpdate);
			document.removeEventListener('dev-tools-update', () => {});
			clearInterval(intervalId);
		};
	});

	// Clean up on component destroy
	onDestroy(() => {
		unsubscribeStartPos();
		unsubscribeGlobalStartPos();
	});

	// Create start position beat data
	$: startPosBeatData = {
		beatNumber: 0,
		filled: !!startPosition,
		pictographData: startPosition || defaultPictographData
	};

	// Reactive layout calculations based on beat count
	$: [beatRows, beatCols] = autoAdjustLayout(beats.length);

	// Calculate cell size based on container dimensions
	// For scrollable layouts (more than 16 beats), we only need to consider 4 rows for height calculation
	// This ensures the cell size remains consistent even as more rows are added
	$: cellSize = calculateCellSize(
		$size.width,
		$size.height,
		// For small grids, use actual rows; for large grids, limit to 4 rows for consistent sizing
		beats.length > 16 ? Math.min(4, beatRows) : beatRows,
		beatCols + 1,
		0
	);

	// Event handlers
	function handleStartPosBeatClick() {
		// Deselect current beat
		sequenceActions.deselectBeat();

		// Dispatch a custom event to trigger the start position selector
		const event = new CustomEvent('select-start-pos', {
			bubbles: true,
			detail: { currentStartPos: startPosition }
		});
		document.dispatchEvent(event);
	}

	function handleBeatClick(beatIndex: number) {
		// Get the beat ID from the index
		if (beatIndex >= 0 && beatIndex < beats.length) {
			const beatId = beats[beatIndex].id;
			if (beatId) {
				sequenceActions.selectBeat(beatId);
			}
		}
	}

	// Handle start position selection
	function updateStartPosition(newStartPos: PictographData) {
		if (newStartPos) {
			// Create a deep copy to avoid reference issues
			const startPosCopy = JSON.parse(JSON.stringify(newStartPos));
			startPositionStore.set(startPosCopy);
			console.log(
				'SequenceBeatFrame.updateStartPosition: Updated startPositionStore with:',
				startPosCopy
			);
		}
	}

	// Set up event listener for when a start position is selected
	onMount(() => {
		// Listen for the custom event when a start position is selected
		const handleStartPosSelected = (event: CustomEvent) => {
			if (event.detail?.startPosition) {
				console.log(
					'SequenceBeatFrame: Received start-position-selected event with data:',
					event.detail.startPosition
				);
				updateStartPosition(event.detail.startPosition);
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
</script>

<div use:resizeObserver class="beat-frame-container" class:scrollable={beats.length > 16}>
	<div
		class="beat-frame"
		style="--total-rows: {beatRows}; --total-cols: {beatCols + 1}; --cell-size: {cellSize}px;"
	>
		<!-- Regular Beats with Start Position on the left of each row -->
		{#each Array(beatRows) as _, rowIndex}
			<!-- Start Position Beat (only for the first row) -->
			{#if rowIndex === 0}
				<div class="beat-container start-position" style="grid-row: 1; grid-column: 1;">
					<StartPosBeat beatData={startPosBeatData} onClick={handleStartPosBeatClick} />
				</div>
			{/if}

			<!-- Beats for this row -->
			{#each Array(beatCols) as _, colIndex}
				{#if rowIndex * beatCols + colIndex < beats.length}
					{@const beatIndex = rowIndex * beatCols + colIndex}
					{@const beat = beats[beatIndex]}
					<div
						class="beat-container"
						class:selected={selectedBeatIndex === beatIndex}
						style="grid-row: {rowIndex + 1}; grid-column: {colIndex + 2};"
					>
						<Beat {beat} onClick={() => handleBeatClick(beatIndex)} />

						<!-- Show beat number -->
						<div class="beat-number">
							<BeatNumberLabel beatNumber={beat.beatNumber} duration={beat.duration || 1} />
						</div>

						<!-- Show reversals if any -->
						{#if beat.metadata?.blueReversal || beat.metadata?.redReversal}
							<div class="reversal-indicator">
								<ReversalGlyph
									blueReversal={beat.metadata?.blueReversal || false}
									redReversal={beat.metadata?.redReversal || false}
								/>
							</div>
						{/if}

						<!-- Selection overlay -->
						<SelectionOverlay isSelected={selectedBeatIndex === beatIndex} />
					</div>
				{/if}
			{/each}
		{/each}
	</div>
</div>

<style>
	.beat-frame-container {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center; /* Center vertically by default */
		overflow: hidden; /* Hide overflow by default */
	}

	.scrollable {
		overflow-y: auto; /* Enable vertical scrolling when needed */
		overflow-x: hidden; /* Prevent horizontal scrolling */
		align-items: flex-start; /* Align to top when scrollable */
	}

	.beat-frame {
		display: grid;
		grid-template-columns: var(--cell-size) repeat(var(--total-cols) - 1, var(--cell-size));
		grid-template-rows: repeat(var(--total-rows), var(--cell-size));
		gap: 0; /* No gap at all */
		justify-content: center;
		align-content: center; /* Center vertically by default */
		width: 100%;
		min-height: min-content; /* Allow grid to grow based on content */
		max-height: 100%; /* Limit height to container */
	}

	/* When inside a scrollable container, align to top */
	.scrollable .beat-frame {
		align-content: start;
	}

	.beat-container {
		position: relative;
		width: var(--cell-size);
		height: var(--cell-size);
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: transparent;
	}

	/* Start position styling is now handled inline */

	.beat-number {
		position: absolute;
		z-index: 2;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		pointer-events: none; /* Allow clicks to pass through */
	}

	.reversal-indicator {
		position: absolute;
		bottom: 5px;
		right: 5px;
		z-index: 2;
	}
</style>
