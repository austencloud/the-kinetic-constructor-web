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

		startPositionDataStoreSet = pictographData
			.filter(
				(entry) =>
					entry.redMotionData &&
					entry.blueMotionData &&
					defaultStartPosKeys.includes(`${entry.startPos}_${entry.endPos}`)
			)
			.map((entry) => writable(entry));
		
		// After loading data, set loading to false with a slight delay for smooth transition
		setTimeout(() => {
			isLoading = false;
		}, 200);
	});

	const handleSelect = (startPosPictograph: PictographData) => {
		console.log('Setting selectedStartPos to:', startPosPictograph);
		selectedStartPos.set({ ...startPosPictograph }); 
	};
</script>

<div class="start-pos-picker">
	<StartPositionLabel />
	
	{#if isLoading}
		<div class="loading-container">
			<LoadingSpinner />
			<p class="loading-text">Loading Start Positions...</p>
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
					<!-- Pass as a store -->
					<Pictograph pictographDataStore={startPositionStore} />
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