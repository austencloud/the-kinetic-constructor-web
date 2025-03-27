<script lang="ts">
	import Pictograph from '../Pictograph/Pictograph.svelte';
	import { onMount } from 'svelte';
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

	pictographDataStore.subscribe((data) => {
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
		
		startPositionDataStoreSet = filteredPictographs.map((entry) => writable(entry));
		totalPictographs = startPositionDataStoreSet.length;
		loadedPictographs = 0;
		
		// Keep showing loading until pictographs finish initializing
		isLoading = true;
	});

	const handleSelect = (startPosPictograph: PictographData) => {
		console.log('Setting selectedStartPos to:', startPosPictograph);
		selectedStartPos.set({ ...startPosPictograph }); 
	};
	
	function handlePictographLoaded() {
		loadedPictographs++;
		if (loadedPictographs >= totalPictographs) {
			// All pictographs have loaded, we can show them
			setTimeout(() => {
				isLoading = false;
			}, 200); // Small delay for a smoother transition
		}
	}
</script>

<div class="start-pos-picker">
	<StartPositionLabel />
	
	{#if isLoading}
		<div class="loading-container">
			<LoadingSpinner />
			<p class="loading-text">
				{loadedPictographs === 0 
					? "Loading Start Positions..." 
					: `Loading pictographs (${loadedPictographs}/${totalPictographs})`}
			</p>
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