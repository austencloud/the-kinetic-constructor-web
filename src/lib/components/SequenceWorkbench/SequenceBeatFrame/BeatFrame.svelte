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
	import { layoutStore } from '$lib/stores/layout/layoutStore';

	// Import the sequence store and actions
	import { sequenceStore } from '$lib/state/stores/sequenceStore';
	import { sequenceActions } from '$lib/state/machines/sequenceMachine';

	// Components
	import StartPosBeat from './StartPosBeat.svelte';
	import Beat from './Beat.svelte';
	import SelectionOverlay from './SelectionOverlay.svelte';
	import ReversalGlyph from './ReversalGlyph.svelte';
	const ssrDefaults = { width: 800, height: 600 }; // Example reasonable defaults
	const { size, resizeObserver } = useResizeObserver({
		width: browser ? window.innerWidth : 800,
		height: browser ? window.innerHeight : 600
	});

	// No gap between cells

	// Use reactive stores for beats and selection state
	// Create a store that updates whenever the sequence store changes
	const beatsStore = writable<BeatData[]>([]);
	const selectedBeatIdsStore = writable<string[]>([]);
	const selectedBeatIndexStore = writable<number>(-1);
	let startPosition: PictographData | null = null;

	// Function to update local state from the sequence store
	function updateLocalState() {
		try {
			// Get the sequence state from the sequence store
			const unsubscribe = sequenceStore.subscribe((state) => {
				// Convert beats from the store to our BeatData format
				const convertedBeats = state.beats.map((storeBeat: any) => {
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

				// Get selected beat IDs from the store
				const selectedIds = state.selectedBeatIds || [];
				selectedBeatIdsStore.set(selectedIds);

				// Calculate the selected beat index based on the selected beat ID
				if (selectedIds.length > 0) {
					const selectedId = selectedIds[0];
					const index = convertedBeats.findIndex((beat: any) => beat.id === selectedId);
					selectedBeatIndexStore.set(index);
				} else {
					selectedBeatIndexStore.set(-1);
				}
			});

			// Unsubscribe immediately to avoid memory leaks
			unsubscribe();
		} catch (error) {
			console.error('Error updating local state from sequence store:', error);
			// Set empty state as fallback
			beatsStore.set([]);
			selectedBeatIdsStore.set([]);
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

	// Create start position beat data - always create it even if startPosition is null
	$: startPosBeatData = {
		beatNumber: 0,
		filled: !!startPosition, // This will be false when startPosition is null
		pictographData: startPosition || defaultPictographData // Use defaultPictographData when startPosition is null
	};

	// Reactive layout calculations based on beat count
	// Always ensure at least one row for the start position beat
	$: [beatRows, beatCols] = autoAdjustLayout(Math.max(1, beats.length));

	// Track previous layout for detecting changes
	let prevRows = 1;
	let prevCols = 1;

	// Update the layout store when the layout changes
	$: {
		// Check if the layout has changed
		if (beatRows !== prevRows || beatCols !== prevCols) {
			console.log(`Layout changed from ${prevRows}x${prevCols} to ${beatRows}x${beatCols}`);

			// Update the layout store
			layoutStore.updateLayout(beatRows, beatCols, beats.length);

			// Update previous values
			prevRows = beatRows;
			prevCols = beatCols;

			// Dispatch a custom event for layout changes
			const event = new CustomEvent('layout-changed', {
				bubbles: true,
				detail: {
					rows: beatRows,
					cols: beatCols,
					beatCount: beats.length,
					previousLayout: { rows: prevRows, cols: prevCols }
				}
			});
			document.dispatchEvent(event);
		}
	}
	$: beatCount = beats.length;

	// Calculate cell size based on container dimensions
	$: cellSize = calculateCellSize(
		beatCount,
		$size.width || 0,
		$size.height || 0,
		beatRows,
		beatCols, // Add 1 for start position column
		0 // No gap
	);

	// Force recalculation when layout changes
	$: if (beatRows || beatCols) {
		cellSize = calculateCellSize(
			beatCount,
			$size.width || 0,
			$size.height || 0,
			beatRows,
			beatCols + 1,
			0
		);
	}

	// Update class based on actual content overflow rather than beat count
	$: isScrollable = beats.length > 28; // Only scroll when we exceed 5 rows (5x4=20 beats)

	// Event handlers
	function handleStartPosBeatClick() {
		// Deselect current beat - clear all selections
		sequenceStore.clearSelection();

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
			const beat = beats[beatIndex];
			const beatId = beat.id;

			// Log detailed information about the beat being selected
			console.log(
				`Selecting beat - Index: ${beatIndex}, Beat Number: ${beat.beatNumber}, ID: ${beatId}, ` +
					`Grid Layout: ${beatRows}x${beatCols}, ` +
					`Position: Row ${Math.floor(beatIndex / beatCols) + 1}, Col ${(beatIndex % beatCols) + 1}, ` +
					`Red Motion Type: ${beat.pictographData?.redMotionData?.motionType || 'none'}, ` +
					`Blue Motion Type: ${beat.pictographData?.blueMotionData?.motionType || 'none'}\n` +
					`Stack trace: ${new Error().stack}`
			);

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

<div use:resizeObserver class="beat-frame-container" class:scrollable={isScrollable}>
	<div
		class="beat-frame"
		style="--total-rows: {beatRows}; --total-cols: {beatCount === 0
			? 1
			: beatCols + 1}; --cell-size: {cellSize}px;"
	>
		{#each Array(beatRows) as _, rowIndex}
			{#if rowIndex === 0}
				<div class="beat-container start-position" style="grid-row: 1; grid-column: 1;">
					<StartPosBeat beatData={startPosBeatData} onClick={handleStartPosBeatClick} />
				</div>
			{/if}

			{#each Array(beatCols) as _, colIndex}
				{#if rowIndex * beatCols + colIndex < beats.length}
					{@const beatIndex = rowIndex * beatCols + colIndex}
					{@const beat = beats[beatIndex]}

					{#key beat.id}
						<div
							class="beat-container"
							class:selected={selectedBeatIndex === beatIndex}
							style="grid-row: {rowIndex + 1}; grid-column: {colIndex + (beatCount === 0 ? 1 : 2)};"
						>
							<Beat {beat} onClick={() => handleBeatClick(beatIndex)} />

							{#if beat.metadata?.blueReversal || beat.metadata?.redReversal}
								<div class="reversal-indicator">
									<ReversalGlyph
										blueReversal={beat.metadata?.blueReversal || false}
										redReversal={beat.metadata?.redReversal || false}
									/>
								</div>
							{/if}
							<SelectionOverlay isSelected={selectedBeatIndex === beatIndex} />
						</div>
					{/key}
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
		align-items: center;
		overflow: hidden;
		position: relative;
	}

	.scrollable {
		overflow-y: auto;
		overflow-x: hidden;
		align-items: flex-start;
	}

	.beat-frame {
		display: grid;
		grid-template-columns: repeat(var(--total-cols), var(--cell-size));
		grid-template-rows: repeat(var(--total-rows), var(--cell-size));
		gap: 0; /* No gap between cells */
		justify-content: center;
		align-content: center;
		width: fit-content;
		height: fit-content;
		margin: auto;
		/* Add transition for smooth size changes */
		transition: all 0.3s ease;
	}

	/* Only align to top when scrolling and there are beats */
	.scrollable .beat-frame:not(:only-child) {
		align-content: start;
	}

	.beat-container {
		position: relative;
		width: var(--adjusted-cell-size, var(--cell-size));
		height: var(--adjusted-cell-size, var(--cell-size));
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: transparent;
		/* Add transition for smooth size changes */
		transition:
			width 0.3s ease,
			height 0.3s ease;
		/* Ensure content is properly centered */
		box-sizing: border-box;
		/* Prevent overflow */
		overflow: hidden;
	}

	/* Specific styling for start position when it's the only beat */
	.beat-container.start-position:only-child {
		justify-self: center;
		align-self: center;
	}

	.reversal-indicator {
		position: absolute;
		bottom: 5px;
		right: 5px;
		z-index: 2;
	}
</style>
