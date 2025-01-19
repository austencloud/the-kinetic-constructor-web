<script lang="ts">
	import Grid from './Grid/Grid.svelte';
	import Arrow from './Arrow/Arrow.svelte';
	import Prop from './Prop/Prop.svelte';
	import { createMotion } from './Motion/MotionCreator';
	import PictographView from './PictographView.svelte';
	import type { Motion } from './Motion/Motion';

	export let pictographData: any;
	export let isSelected: boolean = false;
	export let name: string | null = null;
	export let interactive: boolean = true;
	export let onClick: () => void;

	let gridPoints: Record<string, { x: number; y: number }> = {};
	let motions: Motion[] = [];
	let currentPictograph: any;

	function processPictographData(data: any) {
		if (!data) return;

		motions = [
			createMotion(data.red_attributes, currentPictograph, 'red', 'in', 'cw'),
			createMotion(data.blue_attributes, currentPictograph, 'blue', 'out', 'ccw')
		];
	}

	$: processPictographData(pictographData);

	function handleGridPointsReady(points: any) {
		gridPoints = { ...points };
	}
</script>

<PictographView bind:this={currentPictograph} {isSelected} {interactive} {onClick} {name}>
	<div class="pictograph">
		<Grid gridMode={pictographData?.grid_mode || 'diamond'} onPointsReady={handleGridPointsReady} />
		{#each motions as motion}
			<Arrow {motion} />
			<Prop {motion} />
		{/each}
	</div>
</PictographView>

<style>
	.pictograph {
		position: relative;
		width: 100%;
		height: 100%;
		background-color: white;
	}
</style>
