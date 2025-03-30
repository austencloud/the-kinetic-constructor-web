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
	let loadingTimeout: ReturnType<typeof setTimeout>;

	const unsubscribe = pictographDataStore.subscribe((data) => {
		if (!data || data.length === 0) {
			isLoading = true;
			return;
		}

		const pictographData = data as PictographData[];
		const defaultStartPosKeys =
			gridMode === 'diamond'
				? ['alpha1_alpha3', 'beta5_beta5', 'gamma11_gamma11']
				: ['alpha2_alpha2', 'beta4_beta4', 'gamma12_gamma12'];

		const filteredPictographs = pictographData.filter(
			(entry) =>
				entry.redMotionData &&
				entry.blueMotionData &&
				defaultStartPosKeys.includes(`${entry.startPos}_${entry.endPos}`)
		);

		if (filteredPictographs.length === 0) {
			if (pictographData.length > 0) {
				startPositionDataStoreSet = [writable(pictographData[0])];
			} else {
				isLoading = false;
				return;
			}
		} else {
			startPositionDataStoreSet = filteredPictographs.map((entry) => writable(entry));
		}

		totalPictographs = startPositionDataStoreSet.length;
		loadedPictographs = 0;
		dataInitialized = true;

		isLoading = true;

		clearTimeout(loadingTimeout);
		loadingTimeout = setTimeout(() => {
			if (isLoading) {
				isLoading = false;
			}
		}, 100);
	});

	onDestroy(() => {
		unsubscribe();
		clearTimeout(loadingTimeout);
	});

	const handleSelect = (startPosPictograph: PictographData) => {
		selectedStartPos.set({ ...startPosPictograph });
	};

	function handlePictographLoaded(event: CustomEvent) {
		loadedPictographs++;

		if (loadedPictographs >= totalPictographs) {
			setTimeout(() => {
				isLoading = false;
			}, 200);
		}
	}

	function handlePictographError(event: CustomEvent) {
		loadedPictographs++;

		if (loadedPictographs >= totalPictographs) {
			setTimeout(() => {
				isLoading = false;
			}, 200);
		}
	}

	let fallbackDisplayed = false;

	onMount(() => {
		const initialDataTimeout = setTimeout(() => {
			if (!dataInitialized) {
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
