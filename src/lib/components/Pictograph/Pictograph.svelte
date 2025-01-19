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

	export let pictographData: any;
	export let name: string | null = null;
	export let isSelected: boolean = false;
	export let onClick: () => void;

	let gridPoints: Record<string, { x: number; y: number }> = {};
	let motions: Motion[] = [];
	let propPlacementManager = new PropPlacementManager();

	function processPictographData(pictographData: PictographInterface | null): void {
		// Fallback to default data if null
		const data = pictographData || defaultPictographData;

		// Handle red and blue motion data
		if (data.redMotionData && data.blueMotionData) {
			motions = [createMotion(data.redMotionData), createMotion(data.blueMotionData)];

			propDicts = [
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
		} else {
			motions = [];
			propDicts = [];
		}
	}

	// Handle grid points
	function handleGridPointsReady(points: CircleCoords[keyof CircleCoords]): void {
		gridPoints = points.hand_points.normal || {};
	}

	// ExamplmotionData
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

	function createMotion(attributes: MotionInterface): Motion {
		const motionData: MotionInterface = {
			motionType: attributes.motionType,
			startLoc: attributes.startLoc,
			endLoc: attributes.endLoc,
			startOri: attributes.startOri,
			endOri: null,
			propRotDir: attributes.propRotDir,
			color: attributes.color,
			turns: attributes.turns || 0,
			handRotDir: null,
			leadState: null,
			prefloatMotionType: null,
			prefloatPropRotDir: null
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
		display: flex; /* Ensures it stretches fully */
		flex: 1;
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
