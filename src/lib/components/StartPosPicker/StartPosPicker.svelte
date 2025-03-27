<script lang="ts">
	import Pictograph from '../Pictograph/Pictograph.svelte';
	import { onMount, onDestroy } from 'svelte';
	import StartPositionLabel from './StartPosLabel.svelte';
	import type { PictographData } from '$lib/types/PictographData.js';
	import pictographDataStore from '$lib/stores/pictographDataStore.js';
	import { selectedStartPos } from '$lib/stores/constructStores.js';
	import { writable, type Writable } from 'svelte/store';
	import LoadingSpinner from '../MainWidget/LoadingSpinner.svelte';

	let gridMode = 'diamond';
	let startPositionDataStoreSet: Writable<PictographData>[] = [];
	let isLoading = true;
	let loadedPictographs = 0;
	let totalPictographs = 0;
	let dataInitialized = false;

	// Add a timeout to prevent infinite loading
	let loadingTimeout: number;

	// Add more debug logging
	function logDebug(message: string) {
		console.log(`[StartPosPicker] ${message}`);
	}

	const unsubscribe = pictographDataStore.subscribe((data) => {
		logDebug(`Received pictograph data: ${data ? data.length : 0} items`);

		if (!data || data.length === 0) {
			isLoading = true;
			return;
		}

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

		logDebug(`Filtered to ${filteredPictographs.length} start positions`);

		// If no pictographs match, handle gracefully
		if (filteredPictographs.length === 0) {
			logDebug('No matching start positions found, using first available data');
			if (pictographData.length > 0) {
				startPositionDataStoreSet = [writable(pictographData[0])];
			} else {
				logDebug('ERROR: No pictograph data available at all');
				isLoading = false;
				return;
			}
		} else {
			startPositionDataStoreSet = filteredPictographs.map((entry) => writable(entry));
		}

		totalPictographs = startPositionDataStoreSet.length;
		loadedPictographs = 0;
		dataInitialized = true;

		logDebug(`Created ${totalPictographs} pictograph stores`);

		// Keep showing loading until pictographs finish initializing
		isLoading = true;

		// Set a safety timeout that will force display after 5 seconds even if events don't fire
		clearTimeout(loadingTimeout);
		loadingTimeout = setTimeout(() => {
			if (isLoading) {
				logDebug('⚠️ Loading timeout triggered. Forcing display.');
				isLoading = false;
			}
		}, 100);
	});

	onDestroy(() => {
		unsubscribe();
		clearTimeout(loadingTimeout);
	});

	const handleSelect = (startPosPictograph: PictographData) => {
		logDebug('Setting selectedStartPos to: ' + startPosPictograph.letter);
		selectedStartPos.set({ ...startPosPictograph });
	};

	function handlePictographLoaded(event: CustomEvent) {
		loadedPictographs++;
		logDebug(`Pictograph loaded (${loadedPictographs}/${totalPictographs})`);

		// Check if this was the last one
		if (loadedPictographs >= totalPictographs) {
			// All pictographs have loaded, we can show them
			logDebug('All pictographs loaded, displaying now');
			setTimeout(() => {
				isLoading = false;
			}, 200); // Small delay for a smoother transition
		}
	}

	function handlePictographError(event: CustomEvent) {
		loadedPictographs++;
		logDebug(
			`⚠️ Pictograph loading error (${loadedPictographs}/${totalPictographs}): ${event.detail?.message || 'Unknown error'}`
		);

		// Even with errors, proceed if this was the last one
		if (loadedPictographs >= totalPictographs) {
			logDebug('All pictographs attempted to load (with errors), displaying anyway');
			setTimeout(() => {
				isLoading = false;
			}, 200);
		}
	}

	// Create a basic fallback pictograph in case all else fails
	let fallbackDisplayed = false;

	onMount(() => {
		logDebug('Component mounted');

		// Safety timeout for initial data loading
		const initialDataTimeout = setTimeout(() => {
			if (!dataInitialized) {
				logDebug('⚠️ Data initialization timeout. Displaying fallback.');
				fallbackDisplayed = true;
				isLoading = false;
			}
		}, 10000);

		return () => {
			clearTimeout(initialDataTimeout);
		};
	});
</script>

<div class="start-pos-picker">
	<StartPositionLabel />

	{#if isLoading}
		<div class="loading-container">
			<LoadingSpinner />
			<p class="loading-text">
				{#if !dataInitialized}
					Loading Start Positions...
				{:else if loadedPictographs === 0}
					Preparing pictographs...
				{:else}
					Loading pictographs ({loadedPictographs}/{totalPictographs})
				{/if}
			</p>
		</div>
	{:else if startPositionDataStoreSet.length === 0 && fallbackDisplayed}
		<div class="error-container">
			<p>Unable to load start positions. Please try refreshing the page.</p>
			<button on:click={() => window.location.reload()}>Refresh</button>
		</div>
	{:else}
		<div class="pictograph-row">
			{#each startPositionDataStoreSet as startPositionStore}
				<div
					class="pictograph-container"
					role="button"
					tabindex="0"
					on:click={() => {
						startPositionStore.subscribe((data) => handleSelect(data))();
					}}
					on:keydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							startPositionStore.subscribe((data) => handleSelect(data))();
						}
					}}
				>
					<!-- Pass as a store and listen for loaded event -->
					<Pictograph
						pictographDataStore={startPositionStore}
						on:loaded={handlePictographLoaded}
						on:error={handlePictographError}
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
		width: 30%;
		aspect-ratio: 1 / 1;
		height: auto;
		position: relative;
		cursor: pointer;
	}
</style>
