<script lang="ts">
	import Pictograph from '../Pictograph/Pictograph.svelte';
	import { onMount } from 'svelte';
	import StartPositionLabel from './StartPosLabel.svelte';
	import type { PictographData } from '$lib/types/PictographData.js';
	import pictographDataStore from '$lib/stores/pictographDataStore.js';
	import { selectedStartPos } from '$lib/stores/constructStores.js';

    let gridMode = 'diamond';
    let startPositionDataSet: PictographData[] = [];

    pictographDataStore.subscribe((data) => {
        const pictographData = data as PictographData[];
        const defaultStartPosKeys =
            gridMode === 'diamond'
                ? ['alpha1_alpha1', 'beta5_beta5', 'gamma11_gamma11']
                : ['alpha2_alpha2', 'beta4_beta4', 'gamma12_gamma12'];
        startPositionDataSet = pictographData.filter((entry) => {
            return (
                entry.redMotionData &&
                entry.blueMotionData &&
                defaultStartPosKeys.includes(`${entry.startPos}_${entry.endPos}`)
            );
        });
    });

    const handleSelect = (startPosPictograph: PictographData) => {
        console.log("Setting selectedStartPos to:", startPosPictograph);
        selectedStartPos.set({ ...startPosPictograph }); // ✅ Ensure reactivity
    };
</script>

<div class="start-pos-picker">
	<StartPositionLabel />
	<div class="pictograph-row">
		{#each startPositionDataSet as startPositionData}
			<div
				class="pictograph-container"
				role="button"
				tabindex="0"
				on:click={() => handleSelect(startPositionData)}
				on:keydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						handleSelect(startPositionData);
					}
				}}
			>
				<Pictograph pictographData={startPositionData} />
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