<!-- src/lib/components/SequenceWorkbench/SequenceBeatFrame/Beat.svelte -->
<script lang="ts">
	import { writable, get } from 'svelte/store';
	import { onMount, onDestroy } from 'svelte';
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
	import type { BeatData } from './BeatData';
	import { updateDevTools } from '$lib/utils/devToolsUpdater';
	import { layoutStore } from '$lib/stores/layout/layoutStore';

	export let beat: BeatData;
	export let onClick: () => void;
	export let isStartPosition: boolean = false;

	// Import the default pictograph data
	import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';

	// Function to force a complete reset of the pictograph
	function forceCompleteReset() {
		if (beat.pictographData) {
			console.log(`Beat ${beat.beatNumber} - Forcing complete reset`);

			// Create a fresh deep copy of the pictograph data
			const freshCopy = JSON.parse(JSON.stringify(beat.pictographData));

			// Set the store with the fresh copy
			pictographDataStore.set(freshCopy);
		}
	}

	// Create a local pictograph data store with the initial data
	// Ensure we always have valid pictograph data, even if beat.pictographData is null
	const pictographDataStore = writable(beat.pictographData || defaultPictographData);

	// For debugging

	// This is important: update the store whenever the beat's pictograph data changes
	$: {
		if (beat) {
			if (beat.pictographData) {
				// Make a deep copy to ensure reactivity
				const copy = JSON.parse(JSON.stringify(beat.pictographData));

				// Preserve motion types from the previous data if they exist
				const currentData = get(pictographDataStore);
				if (currentData) {


					// Special case for Beat 5 - don't preserve motion types when the layout shifts
					// This is when we go from 2x2 to 3x3 layout
					const isLayoutShiftBeat = beat.beatNumber === 5;

					// Check if we're actually changing the grid layout
					// Since GridData doesn't have rows/cols properties, we'll just use the beat number
					const isGridLayoutChanging = copy.gridMode !== currentData.gridMode || isLayoutShiftBeat; // For beat 5, we know it's a layout shift

					if (!isLayoutShiftBeat || !isGridLayoutChanging) {
						// Preserve red motion type if it exists
						if (currentData.redMotionData?.motionType && copy.redMotionData) {
							copy.redMotionData.motionType = currentData.redMotionData.motionType;
						}

						// Preserve blue motion type if it exists
						if (currentData.blueMotionData?.motionType && copy.blueMotionData) {
							copy.blueMotionData.motionType = currentData.blueMotionData.motionType;
						}
					} else {
						console.log(
							`Beat ${beat.beatNumber} - Layout shift detected, NOT preserving motion types`
						);
					}


				}

				pictographDataStore.set(copy);
			} else {
				// If no pictograph data, use default data
				pictographDataStore.set(defaultPictographData);
			}
		}
	}

	// Force an update when the beat object reference changes
	$: {
		if (beat) {
			// This will trigger a component update but preserve motion types
			pictographDataStore.update((data) => {
				if (!data) return data;

				// Create a shallow copy to trigger reactivity
				const updatedData = { ...data };

				// Ensure motion data is preserved
				if (updatedData.redMotionData) {
					updatedData.redMotionData = { ...updatedData.redMotionData };
				}

				if (updatedData.blueMotionData) {
					updatedData.blueMotionData = { ...updatedData.blueMotionData };
				}

				return updatedData;
			});
		}
	}

	// Handle the click event once at this level
	function handleClick(event: MouseEvent) {
		// Prevent the event from propagating to avoid double-handling
		event.stopPropagation();
		onClick();

		// Update dev tools after click
		updateDevTools();
	}

	// Set up event listener for layout changes
	onMount(() => {
		// Listen for layout changes
		const handleLayoutChange = (_event: CustomEvent) => {
			// Only reset if this is beat 4 or 5 (the ones affected by layout shifts)
			if (
				beat.beatNumber === 4 ||
				beat.beatNumber === 5 ||
				beat.beatNumber === 9 ||
				beat.beatNumber === 10
			) {
				console.log(`Beat ${beat.beatNumber} - Layout change detected, forcing reset`);
				forceCompleteReset();
			}
		};

		// Add event listener
		document.addEventListener('layout-changed', handleLayoutChange as EventListener);

		// Clean up on component destroy
		return () => {
			document.removeEventListener('layout-changed', handleLayoutChange as EventListener);
		};
	});
</script>

<button
	class="beat"
	class:filled={beat.filled}
	on:click={handleClick}
	aria-label={`Beat ${beat.beatNumber}`}
>
	<Pictograph {pictographDataStore} beatNumber={beat.beatNumber} {isStartPosition} />
</button>

<style>
	.beat {
		width: 100%;
		height: 100%;
		background-color: transparent;
		border: none;
		padding: 0;
		margin: 0;
		cursor: pointer;
		transition: transform 0.2s ease;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 4px;
		/* Use 100% for both dimensions to fill the container completely */
		min-width: 100%;
		min-height: 100%;
		box-sizing: border-box;
	}

	.beat:hover {
		transform: scale(1.05);
	}

	.beat:active {
		transform: scale(0.95);
	}

	.filled {
		box-shadow: 0 0 8px transparent;
	}
</style>
