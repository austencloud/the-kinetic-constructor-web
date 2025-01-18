<script lang="ts">
	import Grid from './Grid/Grid.svelte';
	import Arrow from './Arrow/Arrow.svelte';
	import Prop from './Prop/Prop.svelte';
	import { Motion } from './Motion/Motion';
	import SvgManager from './SvgManager/SvgManager';
	import PictographView from './PictographView.svelte';

	export let pictographData: any;
	export let isSelected: boolean = false;
	export let name: string | null = null;
	export let interactive: boolean = true;
	export let onClick: () => void;
	let gridPoints: Record<string, { x: number; y: number }> = {};
	let motions: Motion[] = [];
	let svgManager = new SvgManager();

	// Generate motions, arrows, and props
	function processPictographData(data: any) {
		if (!data) return;

		motions = [
			new Motion(
				{
					pictograph: { gridPoints },
					motionType: data.red_attributes?.motion?.type || 'static',
					startLoc: data.red_attributes?.motion?.startLoc || 'n',
					endLoc: data.red_attributes?.motion?.endLoc || 's',
					color: 'red',
					arrow: {
						color: 'red',
						position: { x: 0, y: 0 },
						rotation: 0,
						motionType: data.red_attributes?.motion?.type || 'static'
					},
					prop: {
						propType: 'hand',
						color: 'red',
						location: 'n',
						orientation: 'in',
						size: { width: 50, height: 50 }
					}
				},
				gridPoints
			),
			new Motion(
				{
					pictograph: { gridPoints },
					motionType: data.blue_attributes?.motion?.type || 'static',
					startLoc: data.blue_attributes?.motion?.startLoc || 'c',
					endLoc: data.blue_attributes?.motion?.endLoc || 'c',
					color: 'blue',
					arrow: {
						color: 'blue',
						position: { x: 0, y: 0 },
						rotation: 0,
						motionType: data.blue_attributes?.motion?.type || 'static'
					},
					prop: {
						propType: 'staff',
						color: 'blue',
						location: 's',
						orientation: 'out',
						size: { width: 50, height: 50 }
					}
				},
				gridPoints
			)
		];
	}

	$: processPictographData(pictographData);

	function handleGridPointsReady(points: any) {
		gridPoints = { ...points };
	}
</script>

<PictographView {isSelected} {interactive} {onClick} {name}>
	<div class="pictograph">
		<Grid gridMode={pictographData?.grid_mode || 'diamond'} onPointsReady={handleGridPointsReady} />
		{#each motions as motion}
			<Arrow {...motion.arrow} pictograph={motion.pictograph} />
			{#if motion.prop}
				<Prop
					propType={motion.prop.propType}
					color={motion.prop.color}
					loc={motion.prop.location}
					ori={motion.prop.orientation}
					size={motion.prop.size}
				/>
			{/if}
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
