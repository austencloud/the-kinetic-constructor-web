<script lang="ts">
	import Grid from './Grid/Grid.svelte';
	import Arrow from './Arrow/Arrow.svelte';
	import PictographView from './PictographView.svelte';

	export let pictographData: any; // Input pictograph data
	export let isSelected: boolean = false;
	export let onClick: (() => void) | undefined;
	export let name: string | null = null;
	export let interactive: boolean = true;

	let gridPoints: Record<string, { x: number; y: number }> = {};
	let arrows: Array<{
		color: 'red' | 'blue';
		position: { x: number; y: number };
		rotation: number;
		mirrored: boolean;
		motion: {
			startLoc: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | 'c';
			endLoc: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | 'c';
			type: 'pro' | 'anti' | 'dash' | 'static';
			propRotDir?: 'cw' | 'ccw' | "no_rot";
		};
	}> = [];

	// Pictograph instance for arrows
	let pictograph: any = { gridPoints, data: pictographData }; // Example of a pictograph instance

	// Extract arrow data from the pictograph data
	function processPictographData(data: any) {
		if (!data) return;

		arrows = [
			{
				color: 'red',
				position: { x: 0, y: 0 },
				rotation: 0,
				mirrored: false,
				motion: {
					startLoc: data.red_attributes?.motion?.startLoc || 'c',
					endLoc: data.red_attributes?.motion?.endLoc || 'c',
					type: data.red_attributes?.motion?.type || 'static'
				}
			},
			{
				color: 'blue',
				position: { x: 0, y: 0 },
				rotation: 0,
				mirrored: false,
				motion: {
					startLoc: data.blue_attributes?.motion?.startLoc || 'c',
					endLoc: data.blue_attributes?.motion?.endLoc || 'c',
					type: data.blue_attributes?.motion?.type || 'static'
				}
			}
		];
	}

	// Reactively update arrow data whenever pictographData changes
	$: processPictographData(pictographData);

	function handlePointsReady(points: {
		hand_points: {
			normal: Record<string, { x: number; y: number }>;
			strict: Record<string, { x: number; y: number }>;
		};
		layer2_points: {
			normal: Record<string, { x: number; y: number }>;
			strict: Record<string, { x: number; y: number }>;
		};
		outer_points: Record<string, string>;
		center_point: { x: number; y: number };
	}) {
		gridPoints = {
			...points.hand_points.normal,
			...points.hand_points.strict,
			...points.layer2_points.normal,
			...points.layer2_points.strict,
			...points.outer_points,
			center: points.center_point
		};
		pictograph.gridPoints = gridPoints; // Update the pictograph grid points
	}
</script>

<PictographView {isSelected} {interactive} {onClick} {name}>
	<div class="base-pictograph">
		<Grid gridMode={pictographData?.grid_mode || 'diamond'} onPointsReady={handlePointsReady} />
		{#each arrows as arrow (arrow.color)}
			<Arrow {...arrow} {pictograph} />
		{/each}
	</div>
</PictographView>

<style>
	.base-pictograph {
		width: 100%;
		height: 100%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f0f0f0;
		overflow: hidden;
	}
</style>
