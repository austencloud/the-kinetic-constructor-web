<script lang="ts">
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
	import { onMount } from 'svelte';
	import StartPositionLabel from './StartPosLabel.svelte';
	import type { PictographData } from '$lib/types/PictographData.js';
	// No longer need writable with Svelte 5 approach
	import LoadingSpinner from '$lib/components/MainWidget/loading/LoadingSpinner.svelte';
	import { selectedStartPos } from '$lib/stores/sequence/selectionStore';
	import pictographDataStore from '$lib/stores/pictograph/pictographStore';
	import { pictographStore } from '$lib/state/stores/pictograph/pictograph.store';
	import startPositionService from '$lib/services/StartPositionService';
	import { isSequenceEmpty } from '$lib/state/machines/sequenceMachine/persistence';
	import { browser } from '$app/environment'; // Import browser check
	import sequenceDataService from '$lib/services/SequenceDataService';

	let gridMode = 'diamond'; // TODO: Make this dynamic if necessary
	let startPositionPictographs: PictographData[] = []; // Store the processed data directly
	let filteredDataAvailable = false; // Flag to know if filtering yielded results
	let dataInitializationChecked = false; // Flag to know if we've processed the store data at least once
	let isLoading = true; // Start loading until store data is processed
	let loadingError = false; // Flag for loading timeout/error

	// Timeout for initial data load
	let initialDataTimeout: number | null = null;

	const unsubscribe = pictographDataStore.subscribe((data) => {
		// Only process if running in the browser
		if (!browser) return;

		if (data && data.length > 0) {
			// Data is available from the store

			dataInitializationChecked = true; // Mark that we've seen data

			const pictographData = data as PictographData[];
			const defaultStartPosKeys =
				gridMode === 'diamond'
					? ['alpha1_alpha1', 'beta5_beta5', 'gamma11_gamma11']
					: ['alpha2_alpha2', 'beta4_beta4', 'gamma12_gamma12'];

			const filteredPictographs = pictographData.filter(
				(entry) =>
					entry.redMotionData &&
					entry.blueMotionData &&
					defaultStartPosKeys.includes(`${entry.startPos}_${entry.endPos}`)
			);

			startPositionPictographs = filteredPictographs;
			filteredDataAvailable = filteredPictographs.length > 0;

			// Stop loading *after* processing
			isLoading = false;
			if (initialDataTimeout) clearTimeout(initialDataTimeout); // Clear safety timeout
		} else if (dataInitializationChecked) {
			// Data was previously available but is now empty (e.g., store reset)
			console.log('StartPosPicker: pictographDataStore became empty after initialization.');
			startPositionPictographs = [];
			filteredDataAvailable = false;
			isLoading = false; // Still not loading, just no data
		}
		// If data is initially empty/null, isLoading remains true until data arrives or timeout occurs
	});

	// Listen for the immediate start position click event
	function handleStartPosClick(event: CustomEvent) {
		if (event.detail?.immediate) {
			// Reset loading state to show immediate feedback
			isLoading = true;
			dataInitializationChecked = false;
			loadingError = false;
		}
	}

	onMount(() => {
		// Add event listener for immediate start position click
		document.addEventListener('start-position-click', handleStartPosClick as EventListener);

		// Safety timeout: If data hasn't been checked/processed after 5s, show error
		// Reduced from 10s to 5s for faster feedback
		initialDataTimeout = window.setTimeout(() => {
			if (isLoading && !dataInitializationChecked) {
				console.error('StartPosPicker: Timeout waiting for pictographDataStore initialization.');
				isLoading = false;
				loadingError = true; // Set error flag
			}
		}, 5000); // 5 seconds

		return () => {
			unsubscribe();
			document.removeEventListener('start-position-click', handleStartPosClick as EventListener);
			if (initialDataTimeout) {
				clearTimeout(initialDataTimeout);
			}
		};
	});

	// No longer need individual stores for each pictograph here
	// let startPositionDataStoreSet: Writable<PictographData>[] = [];
	// let loadedPictographs = 0; // Removed - Pictograph loading state handled internally
	// let totalPictographs = 0; // Removed

	// Helper function to safely copy pictograph data without circular references
	function safeCopyPictographData(data: PictographData): PictographData {
		// Create a new object with only the properties we need
		const safeCopy: PictographData = {
			letter: data.letter,
			startPos: data.startPos,
			endPos: data.endPos,
			timing: data.timing,
			direction: data.direction,
			gridMode: data.gridMode,
			grid: data.grid,

			// Copy motion data safely
			redMotionData: data.redMotionData
				? {
						id: data.redMotionData.id,
						handRotDir: data.redMotionData.handRotDir,
						color: data.redMotionData.color,
						leadState: data.redMotionData.leadState,
						motionType: data.redMotionData.motionType,
						startLoc: data.redMotionData.startLoc,
						endLoc: data.redMotionData.endLoc,
						startOri: data.redMotionData.startOri,
						endOri: data.redMotionData.endOri,
						propRotDir: data.redMotionData.propRotDir,
						turns: data.redMotionData.turns,
						prefloatMotionType: data.redMotionData.prefloatMotionType,
						prefloatPropRotDir: data.redMotionData.prefloatPropRotDir
					}
				: null,

			blueMotionData: data.blueMotionData
				? {
						id: data.blueMotionData.id,
						handRotDir: data.blueMotionData.handRotDir,
						color: data.blueMotionData.color,
						leadState: data.blueMotionData.leadState,
						motionType: data.blueMotionData.motionType,
						startLoc: data.blueMotionData.startLoc,
						endLoc: data.blueMotionData.endLoc,
						startOri: data.blueMotionData.startOri,
						endOri: data.blueMotionData.endOri,
						propRotDir: data.blueMotionData.propRotDir,
						turns: data.blueMotionData.turns,
						prefloatMotionType: data.blueMotionData.prefloatMotionType,
						prefloatPropRotDir: data.blueMotionData.prefloatPropRotDir
					}
				: null,

			// These will be generated by the Pictograph component
			redPropData: null,
			bluePropData: null,
			redArrowData: null,
			blueArrowData: null,
			gridData: null,

			// Copy arrays safely
			motions: [],
			redMotion: null,
			blueMotion: null,
			props: []
		};

		return safeCopy;
	}

	const handleSelect = async (startPosPictograph: PictographData) => {
		console.log('StartPosPicker.handleSelect: Starting with pictograph:', startPosPictograph);
		try {
			// Try adding start position
			console.log('StartPosPicker.handleSelect: Calling startPositionService.addStartPosition');
			await startPositionService.addStartPosition(startPosPictograph);
			console.log('StartPosPicker.handleSelect: Successfully added start position');

			// Create a safe copy of the pictograph data to avoid circular references
			const startPosCopy = safeCopyPictographData(startPosPictograph);
			console.log('StartPosPicker.handleSelect: Created safe copy:', startPosCopy);

			// Update the selected start position in the old store (for backward compatibility)
			console.log('StartPosPicker.handleSelect: Updating selectedStartPos store');
			selectedStartPos.set(startPosCopy);

			// Update the new pictographStore as well
			console.log('StartPosPicker.handleSelect: Updating pictographStore');
			pictographStore.setData(startPosCopy);

			// Update sequence state to not empty
			console.log('StartPosPicker.handleSelect: Setting isSequenceEmpty to false');
			isSequenceEmpty.set(false);

			// Dispatch a custom event for components that might be listening (browser only)
			if (browser) {
				console.log('StartPosPicker.handleSelect: Creating custom event');
				const customEvent = new CustomEvent('start-position-selected', {
					detail: { startPosition: startPosCopy },
					bubbles: true
				});

				console.log('StartPosPicker.handleSelect: Dispatching custom event');
				document.dispatchEvent(customEvent);

				// Log for debugging
				console.log(
					'StartPosPicker.handleSelect: Dispatched start-position-selected event with data:',
					startPosCopy
				);
			}
		} catch (error) {
			console.error('Error adding start position:', error);
		}
	};

	// These handlers are now managed within the Pictograph component itself
	// function handlePictographLoaded(event: CustomEvent) {}
	// function handlePictographError(event: CustomEvent) {}

	// let fallbackDisplayed = false; // Replaced by loadingError flag
</script>

<div class="start-pos-picker">
	<StartPositionLabel />

	{#if isLoading}
		<div class="loading-container">
			<LoadingSpinner size="large" />
			<p class="loading-text">Loading Start Positions...</p>
		</div>
	{:else if loadingError}
		<div class="error-container">
			<p>Unable to load start positions. Please try refreshing the page.</p>
			<button
				on:click={() => {
					if (browser) window.location.reload();
				}}>Refresh</button
			>
		</div>
	{:else if !filteredDataAvailable}
		<div class="error-container">
			<p>No valid start positions found for the current configuration.</p>
		</div>
	{:else}
		<div class="pictograph-row">
			{#each startPositionPictographs as pictograph (pictograph.letter + '_' + pictograph.startPos + '_' + pictograph.endPos)}
				<div
					class="pictograph-container"
					role="button"
					tabindex="0"
					on:click={() => {
						console.log('StartPosPicker: Clicked on pictograph:', pictograph);
						handleSelect(pictograph);
					}}
					on:keydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault(); // Prevent space scrolling
							console.log('StartPosPicker: Keydown on pictograph:', pictograph);
							handleSelect(pictograph);
						}
					}}
				>
					<Pictograph
						pictographData={pictograph}
						showLoadingIndicator={false}
						debug={true}
						useNewStateManagement={false}
					/>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.start-pos-picker {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 60%;
		width: 100%;
	}

	.loading-text {
		margin-top: 20px;
		font-size: 1.2rem;
		color: #555;
		animation: pulse 1.5s infinite ease-in-out;
	}

	@keyframes pulse {
		0% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
		100% {
			opacity: 0.6;
		}
	}

	.error-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 60%;
		width: 100%;
		background-color: rgba(255, 220, 220, 0.7);
		padding: 20px;
		border-radius: 10px;
	}

	.pictograph-row {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		align-items: center;
		width: 90%;
		gap: 3%;
	}

	.pictograph-container {
		width: 25%;
		aspect-ratio: 1 / 1;
		height: auto;
		position: relative;
		cursor: pointer;
	}
</style>
