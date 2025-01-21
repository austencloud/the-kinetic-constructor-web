<script lang="ts">
	import { onMount } from 'svelte';
	import { circleCoordinates } from './circleCoordinates';
	import type { GridData } from './GridInterface';

	export let gridMode: 'diamond' | 'box' = 'diamond';
	export let onPointsReady: (gridData: GridData) => void;

	let gridSrc = '';

	$: {
		gridSrc = gridMode === 'diamond' ? '/diamond_grid.svg' : '/box_grid.svg';
	}

	/**
	 * Parses a string coordinate in the format "(x, y)" into a { x, y } object.
	 */
	function parseCoordinates(coordString: string): { x: number; y: number } | null {
		if (!coordString || coordString === 'None') return null;

		const [x, y] = coordString.replace(/[()]/g, '').split(', ').map(parseFloat);
		return { x, y };
	}

	onMount(() => {
		const modeData = circleCoordinates[gridMode];

		const parsePoints = (points: Record<string, string>) =>
			Object.fromEntries(
				Object.entries(points).map(([key, value]) => [key, { coordinates: parseCoordinates(value) }])
			);

		// Convert raw data into structured `GridData`
		const gridData: GridData = {
			allHandPointsStrict: parsePoints(modeData.hand_points.strict),
			allHandPointsNormal: parsePoints(modeData.hand_points.normal),
			allLayer2PointsStrict: parsePoints(modeData.layer2_points.strict),
			allLayer2PointsNormal: parsePoints(modeData.layer2_points.normal),
			allOuterPoints: parsePoints(modeData.outer_points),
			centerPoint: { coordinates: parseCoordinates(modeData.center_point) }
		};

		// Send the structured data to the parent component
		onPointsReady(gridData);
	});
</script>

<image href={gridSrc} width="950" height="950" />
