<script lang="ts">
	import Pictograph from '../Pictograph/Pictograph.svelte';
	import pictographDataStore from '$lib/stores/pictographDataStore';
	import { pictographsRendered, totalPictographs } from '$lib/stores/pictographRenderStore';
	import { onMount } from 'svelte';
	import StartPositionLabel from './StartPosLabel.svelte';
	import type { PictographInterface } from '$lib/types/PictographInterface';
	import { writable } from 'svelte/store';

	let startPositions: PictographInterface[] = [];
	let gridMode = 'diamond';
	export const selectedStartPos = writable<PictographInterface | null>(null);

	// Track rendering status
	$: pictographsRendered.subscribe((rendered) => {
		if (rendered === startPositions.length) {
			console.debug('All pictographs rendered, starting scaling adjustments.');
			// Trigger scaling logic or any additional post-render adjustments here
		}
	});

	pictographDataStore.subscribe((data) => {
		const defaultStartPosKeys =
			gridMode === 'diamond'
				? ['alpha1_alpha1', 'beta5_beta5', 'gamma11_gamma11']
				: ['alpha2_alpha2', 'beta4_beta4', 'gamma12_gamma12'];

		startPositions = (data as PictographInterface[]).filter((entry) => {
			return (
				entry.redMotionData &&
				entry.blueMotionData &&
				defaultStartPosKeys.includes(`${entry.startPos}_${entry.endPos}`)
			);
		});
		totalPictographs.set(startPositions.length);
	});
	const handleSelect = (start_pos_pictograph: PictographInterface) => {
		selectedStartPos.set(start_pos_pictograph);
		console.log('Selected start position:', start_pos_pictograph);
	};
</script>

<div class="start-pos-picker">
	<StartPositionLabel />
	<div class="pictograph-container">
		{#if startPositions.length > 0}
			{#each startPositions as position}
				<Pictograph
					pictographData={position}
					onClick={() => handleSelect(position)}
					on:mounted={() => {
						pictographsRendered.update((n) => n + 1);
					}}
				/>
			{:else}
				<p>Error: Invalid motion data </p>
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
