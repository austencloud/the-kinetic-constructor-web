<script lang="ts">
	import Grid from './Grid/Grid.svelte';
	import Prop from './Prop/Prop.svelte';
	import { Motion } from './Motion/Motion';
	import type { PictographInterface } from '$lib/types/PictographInterface';
	import type { GridData } from './Grid/GridInterface';
	import { DefaultPropPositioner } from './Prop/PropPlacementManager/DefaultPropPositioner';
	import { createPropData } from './PropFactory';
	import { writable, type Writable } from 'svelte/store';
	import type { PropInterface } from './Prop/PropInterface';
	import { onMount } from 'svelte';

	export let pictographData: PictographInterface;
	export const onClick: () => void = () => {};

	let gridData: GridData | null = null;
	let positioner: DefaultPropPositioner | null = null;

	// Stores for props
	let redPropData: Writable<PropInterface> = writable();
	let bluePropData: Writable<PropInterface> = writable();

	onMount(() => {
		if (pictographData.redMotionData && pictographData.blueMotionData && gridData) {
			const redMotion = new Motion(pictographData.redMotionData);
			const blueMotion = new Motion(pictographData.blueMotionData);

			// Create the positioner
			positioner = new DefaultPropPositioner(gridData, pictographData.gridMode || 'diamond');

			// Create props with coordinates already set
			redPropData.set(createPropData('staff', 'red', redMotion, positioner));
			bluePropData.set(createPropData('staff', 'blue', blueMotion, positioner));
		}
	});
</script>

<svg class="pictograph" viewBox="0 0 950 950" xmlns="http://www.w3.org/2000/svg" role="img">
	<Grid
		gridMode={pictographData?.gridMode || 'diamond'}
		onPointsReady={(data) => {
			gridData = data;
		}}
	/>

	{#if gridData}
		<Prop propData={$redPropData} />
		<Prop propData={$bluePropData} />
	{/if}
</svg>


<style>
	.pictograph {
		width: 100%;
		height: 100%;
		max-width: 100%;
		max-height: 100%;
		display: flex;
		flex: 1;
		background-color: white;
		cursor: pointer;
		transition: transform 0.1s;
		/* box-sizing: border-box; */
		transform: scale(1);
		z-index: 1;
		position: relative;
		outline: 1px solid black;
		aspect-ratio: 1;
		margin: auto;
		overflow: visible;
        transform-origin: center center;
		
	}

	.pictograph:hover {
		transform: scale(1.1);
		z-index: 4;
		outline: 4px solid gold;
	}

	.pictograph:active {
		transform: scale(1);
		border: none;
		/* z-index: 1; */
	}
</style>
