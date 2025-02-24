<script lang="ts">
	import Pictograph from '../Pictograph/Pictograph.svelte';
	import { onMount } from 'svelte';
	import StartPositionLabel from './StartPosLabel.svelte';
	import type { PictographData } from '$lib/types/PictographData.js';
	import pictographDataStore from '$lib/stores/pictographDataStore.js';
	import { selectedStartPos } from '$lib/stores/constructStores.js';
	import { writable, type Writable } from 'svelte/store';

	let gridMode = 'diamond';
	let startPositionDataStoreSet: Writable<PictographData>[] = []; // ✅ Store as Writable

	pictographDataStore.subscribe((data) => {
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
			.map((entry) => writable(entry)); // ✅ Convert to writable store
	});

	const handleSelect = (startPosPictograph: PictographData) => {
		console.log('Setting selectedStartPos to:', startPosPictograph);
		selectedStartPos.set({ ...startPosPictograph }); // ✅ Ensure reactivity
	};
</script>

<div class="start-pos-picker">
	<StartPositionLabel />
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
				<!-- ✅ Pass as a store -->
				<Pictograph pictographDataStore={startPositionStore} />
			</div>
		{/each}
	</div>
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
