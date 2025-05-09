<!-- src/lib/components/SequenceWorkbench/SequenceBeatFrame/SequenceBeatFrame.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { BeatData } from './BeatData';
	import type { PictographData } from '$lib/types/PictographData';

	// Import our new modular components
	import BeatFrameState from './BeatFrameState.svelte';
	import BeatFrameLayout from './BeatFrameLayout.svelte';

	// Component references
	let stateManager: BeatFrameState;
	let isStateManagerReady = false;

	// Default values for props until state manager is ready
	let beats: BeatData[] = [];
	let selectedBeatIndex = -1;
	let startPosition: PictographData | null = null;
	let beatRows = 1;
	let beatCols = 1;

	// Update local variables when state manager is ready
	function updateLocalState() {
		if (stateManager) {
			beats = stateManager.beats || [];
			selectedBeatIndex = stateManager.selectedBeatIndex || -1;
			startPosition = stateManager.startPosition || null;
			beatRows = stateManager.beatRows || 1;
			beatCols = stateManager.beatCols || 1;
			isStateManagerReady = true;
		}
	}

	// Check when state manager is ready
	$: if (stateManager) {
		updateLocalState();
	}

	// Exported methods that delegate to the state manager
	export function addBeat(beatData: BeatData) {
		if (stateManager) {
			stateManager.addBeat(beatData);
		}
	}

	export function clearBeats() {
		if (stateManager) {
			stateManager.clearBeats();
		}
	}

	// Event handlers
	function handleBeatClick(event: CustomEvent<{ beatIndex: number }>) {
		if (stateManager) {
			stateManager.selectBeat(event.detail.beatIndex);
		}
	}

	function handleStartPosClick() {
		if (stateManager) {
			stateManager.deselectBeat();

			// Dispatch a custom event to trigger the start position selector
			const event = new CustomEvent('select-start-pos', {
				bubbles: true,
				detail: { currentStartPos: stateManager.startPosition }
			});
			document.dispatchEvent(event);
		}
	}

	// Set up a listener for state changes
	onMount(() => {
		// Initial update
		updateLocalState();

		// Set up an interval to check for state updates
		const intervalId = setInterval(() => {
			if (stateManager) {
				updateLocalState();
			}
		}, 100);

		return () => {
			clearInterval(intervalId);
		};
	});
</script>

<!-- State manager component (no UI) -->
<BeatFrameState bind:this={stateManager} />

<!-- Layout component (handles UI) -->
{#if isStateManagerReady}
	<BeatFrameLayout
		{beats}
		{selectedBeatIndex}
		{startPosition}
		{beatRows}
		{beatCols}
		on:beat-click={handleBeatClick}
		on:start-pos-click={handleStartPosClick}
	/>
{:else}
	<div class="loading-container">
		<p>Initializing sequence...</p>
	</div>
{/if}

<style>
	.loading-container {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		color: #666;
		font-style: italic;
	}
</style>
