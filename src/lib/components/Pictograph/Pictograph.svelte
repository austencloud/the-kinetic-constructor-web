<script lang="ts">
	import Grid from './Grid/Grid.svelte';
	import Prop from './Prop/Prop.svelte';
	import Arrow from './Arrow/Arrow.svelte';
	import type { Motion } from './Motion/Motion';
	import { createMotion } from './Motion/MotionCreator';
	import { PropPlacementManager } from './PropPlacementManager/PropPlacementManager';
	import type { CircleCoords } from '$lib/types/CircleCoords';

	export let pictographData: any;
	export let name: string | null = null;
	export let isSelected: boolean = false;
	export let interactive: boolean = true;
	export let onClick: () => void;

	let gridPoints: Record<string, { x: number; y: number }> = {};
	let motions: Motion[] = [];
	let propPlacementManager = new PropPlacementManager();

	function processPictographData(data: any): void {
		if (!data) return;
		// console.log("Processing pictograph data:", data);
		// Create motion objects
		motions = [
			createMotion(data.red_attributes, data, 'red', 'in', 'cw'),
			createMotion(data.blue_attributes, data, 'blue', 'out', 'ccw')
		];
	}

	// Handle grid points
	function handleGridPointsReady(points: CircleCoords[keyof CircleCoords]): void {
		gridPoints = points.hand_points.normal || {};
	}

	// Example props
	let propDicts: { propType: string; color: 'red' | 'blue'; motion: Motion }[] = [
		{
			propType: 'staff',
			color: 'red',
			motion: motions[0]
		},
		{
			propType: 'staff',
			color: 'blue',
			motion: motions[1]
		}
	];

	$: processPictographData(pictographData);
    
</script>

<div class="pictograph">
	<Grid gridMode={pictographData?.grid_mode || 'diamond'} onPointsReady={handleGridPointsReady} />
	{#each propDicts as propDict}
		<Prop {propDict} {gridPoints} />
	{/each}
	{#each motions as motion}
		<Arrow {motion} />
	{/each}
</div>

<style>
	.pictograph {
		width: 100%;
		height: 100%;
		display: flex; /* Ensures it stretches fully */
        flex:1;
		background-color: white;
		margin: 0;
		padding: 0;
		border: none;
        cursor: pointer;
        transition: transform 0.1s;
	}
    
	.pictograph:hover {
        transform: scale(1.1); /* Subtle hover effect */
		z-index: 1;
        border: 1px solid black;
	}
    
	.pictograph:active {
        transform: scale(1);
        border: none;
	}
</style>
