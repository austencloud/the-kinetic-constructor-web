<script lang="ts">
	import Grid from './Grid/Grid.svelte';
	import Prop from './Prop/Prop.svelte';
	import Arrow from './Arrow/Arrow.svelte';
	import { Motion } from './Motion/Motion';
	import { PropPlacementManager } from './PropPlacementManager/PropPlacementManager';
	import type { CircleCoords } from '$lib/types/CircleCoords';
	import type { MotionInterface, PropRotDir } from './Motion/MotionInterface';
	import type { Orientation } from './Prop/PropTypes';
	import type { PictographInterface } from '$lib/types/PictographInterface';
	import { defaultPictographData } from './defaultPictographData';
	import type { PropInterface, RadialMode } from './Prop/PropInterface';

	export let pictographData: any;
	export let onClick: () => void;

	let gridPoints: Record<string, { x: number; y: number }> = {};
	let motions: Motion[] = [];
	let propDicts: PropInterface[] = [];
	let propPlacementManager = new PropPlacementManager();

	function processPictographData(pictographData: PictographInterface | null): void {
		const data = pictographData || defaultPictographData;

		if (data.redMotionData && data.blueMotionData) {
			motions = [createMotion(data.redMotionData), createMotion(data.blueMotionData)];

			propDicts = [
				{
					propType: 'staff',
					color: 'red',
					motion: motions[0],
					radialMode: determineRadialMode(data.redMotionData.endOri),
					ori: data.redMotionData.endOri,
					coords: {x:0, y:0}
				},
				{
					propType: 'staff',
					color: 'blue',
					motion: motions[1],
					radialMode: determineRadialMode(data.blueMotionData.endOri),
					ori: data.blueMotionData.endOri,
					coords: {x:0, y:0}
				}
			];
		} else {
			motions = [];
			propDicts = [];
		}
	}

	function determineRadialMode(endOri: Orientation | null): RadialMode {
		return endOri === 'in' || endOri === 'out' ? 'radial' : 'nonradial';
	}

	function handleGridPointsReady(points: CircleCoords[keyof CircleCoords]): void {
		gridPoints = points.hand_points.normal || {};
	}

	function createMotion(attributes: MotionInterface): Motion {
		const motionData: MotionInterface = {
			...attributes,
			pictographData: pictographData,
			endOri: attributes.endOri || null
		};

		const motion = new Motion(motionData);
		pictographData.motionData = pictographData.motionData || [];
		return motion;
	}

	$: processPictographData(pictographData);
</script>

<div
	class="pictograph"
	role="button"
	tabindex="0"
	on:click|stopPropagation={onClick}
	on:keydown={(e) => e.key === 'Enter' && onClick()}
>
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
		display: flex;
		flex: 1;
		background-color: white;
		margin: 0;
		padding: 0;
		border: none;
		cursor: pointer;
		transition: transform 0.1s;
	}

	.pictograph:hover {
		transform: scale(1.1);
		z-index: 1;
		border: 1px solid black;
	}

	.pictograph:active {
		transform: scale(1);
		border: none;
	}
</style>
