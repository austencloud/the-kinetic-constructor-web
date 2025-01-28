<script lang="ts">
	import Pictograph from '../Pictograph/Pictograph.svelte';
	import pictographDataStore from '$lib/stores/pictographDataStore';
	import { pictographsRendered, totalPictographs } from '$lib/stores/pictographRenderStore';
	import { onMount } from 'svelte';
	import StartPositionLabel from './StartPosLabel.svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import { writable } from 'svelte/store';

	let startPositionDataSet: PictographData[] = [];
	let gridMode = 'diamond';
	export const selectedStartPos = writable<PictographData | null>(null);

	// Track rendering status
	$: pictographsRendered.subscribe((rendered) => {
		if (rendered === startPositionDataSet.length) {
			console.debug('All pictographs rendered, starting scaling adjustments.');
			// Trigger scaling logic or any additional post-render adjustments here
		}
	});

	pictographDataStore.subscribe((data) => {
		const pictographData = data as PictographData[];
		const defaultStartPosKeys =
			gridMode === 'diamond'
				? // ? ['alpha1_alpha1', 'beta5_beta5', 'gamma11_gamma11']
					['alpha1_gamma15']
				: ['alpha2_alpha2', 'beta4_beta4', 'gamma12_gamma12'];
		startPositionDataSet = pictographData.filter((entry) => {
			return (
				entry.redMotionData &&
				entry.blueMotionData &&
				defaultStartPosKeys.includes(`${entry.startPos}_${entry.endPos}`)
			);
		});
		totalPictographs.set(startPositionDataSet.length);
	});
	const handleSelect = (start_pos_pictograph: PictographData) => {
		selectedStartPos.set(start_pos_pictograph);
		console.log('Selected start position:', start_pos_pictograph);
	};
</script>

<div class="start-pos-picker">
	<StartPositionLabel />
	<div class="pictograph-row">
		{#if startPositionDataSet.length > 0}
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
					{#if startPositionData}
						{console.log(`Creating ${startPositionData.letter} pictograph: `, startPositionData)}
					{/if}
					<Pictograph
						pictographData={startPositionData}
						onClick={() => handleSelect(startPositionData)}
						on:mounted={() => {
							pictographsRendered.update((n) => n + 1);
						}}
					/>
				</div>
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

	.pictograph-row {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		align-items: center;
		width: 90%;
		height: auto;
		gap: 3%;
	}
	/* make the container 1/4 of the width of tis
	 */
	.pictograph-container {
		width: 30%; /* Fixed 30% width */
		aspect-ratio: 1 / 1; /* Maintain square aspect ratio */
		height: auto;
		position: relative;
	}
</style>
