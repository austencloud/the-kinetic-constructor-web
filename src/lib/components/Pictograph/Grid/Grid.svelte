
<script lang="ts">
	import { onMount } from 'svelte';
	import { circleCoordinates } from './circleCoordinates';
	import type { GridData } from './GridInterface';

	export let gridMode: 'diamond' | 'box' = 'diamond';
	export let gridScaleFactor: number; // Scaling factor from Pictograph
	export let onPointsReady: (gridData: GridData) => void;

	let gridSrc = '';
	let gridData: GridData;

	$: {
		gridSrc = gridMode === 'diamond' ? '/diamond_grid.svg' : '/box_grid.svg';
	}

	function parseCoordinates(coordString: string): { x: number; y: number } | null {
		if (coordString === 'None') return null;
		const [x, y] = coordString.replace(/[()]/g, '').split(', ').map(parseFloat);
		return { x, y };
	}


	onMount(() => {
		const modeData = circleCoordinates[gridMode];

		// Convert raw data into GridData structure
		gridData = {
			allHandPointsStrict: Object.fromEntries(
				Object.entries(modeData.hand_points.strict).map(([key, value]) => [
					key,
					{ coordinates: parseCoordinates(value as string) }
				])
			),
			allHandPointsNormal: Object.fromEntries(
				Object.entries(modeData.hand_points.normal).map(([key, value]) => [
					key,
					{ coordinates: parseCoordinates(value as string) }
				])
			),
			allLayer2PointsStrict: Object.fromEntries(
				Object.entries(modeData.layer2_points.strict).map(([key, value]) => [
					key,
					{ coordinates: parseCoordinates(value as string) }
				])
			),
			allLayer2PointsNormal: Object.fromEntries(
				Object.entries(modeData.layer2_points.normal).map(([key, value]) => [
					key,
					{ coordinates: parseCoordinates(value as string) }
				])
			),
			allOuterPoints: Object.fromEntries(
				Object.entries(modeData.outer_points).map(([key, value]) => [
					key,
					{ coordinates: parseCoordinates(value as string) }
				])
			),
			centerPoint: {
				coordinates: parseCoordinates(modeData.center_point)
			}
		};

		onPointsReady(gridData);
	});
</script>

<div
	class="grid-container"
	style="transform: translate(-50%, -50%) scale({gridScaleFactor});"
>
	<img src={gridSrc} alt="Grid" class="grid-image" />
</div>

<style>
	.grid-container {
		width: 950px;
		height: 950px;
		transform-origin: center;
		display: flex;
		justify-content: center;
		align-items: center;
		position: absolute;
		top: 50%;
		left: 50%;
		box-sizing: border-box;
	}

	.grid-image {
		width: 100%;
		height: auto;
	}
</style>
