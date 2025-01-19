<script lang="ts">
	import Pictograph from '../Pictograph/Pictograph.svelte';
	import pictographDataStore from '$lib/stores/pictographDataStore';
	import { writable } from 'svelte/store';
	import StartPositionLabel from './StartPosLabel.svelte';
	import type { PictographInterface } from '$lib/types/PictographInterface';

	export const selectedStartPos = writable<PictographInterface | null>(null);

	let startPositions: PictographInterface[] = [];
	let gridMode = 'diamond';

	pictographDataStore.subscribe((data) => {
		if (!Array.isArray(data)) {
			console.error('Invalid pictograph data:', data);
			return;
		}

		const defaultStartPosKeys =
			gridMode === 'diamond'
				? ['alpha1_alpha1', 'beta5_beta5', 'gamma11_gamma11']
				: ['alpha2_alpha2', 'beta4_beta4', 'gamma12_gamma12'];

		// Filter and validate the data
		startPositions = (data as PictographInterface[]).filter((entry) => {
			const isValid =
				entry.redMotionData &&
				entry.blueMotionData &&
				defaultStartPosKeys.includes(`${entry.startPos}_${entry.endPos}`);
			return isValid;
		});
	});

	const handleSelect = (position: PictographInterface) => {
		selectedStartPos.set(position);
		console.log('Selected start position:', position);
	};
</script>

<div class="start-pos-picker">
	<StartPositionLabel />
	<div class="pictograph-container">
		{#if startPositions.length > 0}
			{#each startPositions as position}
				{#if position.redMotionData && position.blueMotionData}
					<Pictograph
						pictographData={position}
						onClick={() => handleSelect(position)}
					/>
				{:else}
					<p>Error: Invalid motion data for {position.letter}</p>
				{/if}
			{/each}
		{:else}
			<p>No start positions available.</p>
		{/if}
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
		margin-bottom: 5%;
	}

	.pictograph-container {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		align-items: center;
		width: 70%;
		height: auto;
		gap: 3%;
	}
</style>
