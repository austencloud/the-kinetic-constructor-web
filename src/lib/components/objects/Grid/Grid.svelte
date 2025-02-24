<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { circleCoordinates } from './circleCoordinates';
	import type { GridData } from './GridData';

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
	const validateGridData = (data: GridData) => {
		const requiredPoints = [
			data.centerPoint,
			...Object.values(data.allHandPointsNormal),
			...Object.values(data.allLayer2PointsNormal),
			...Object.values(data.allOuterPoints),
			...Object.values(data.allHandPointsStrict),
			...Object.values(data.allLayer2PointsStrict)
		];
		
		if (requiredPoints.some(p => !p?.coordinates)) {
			throw new Error('Invalid grid data: Missing required points');
		}
	};

	onMount(async () => {
		await tick(); // Wait for DOM to render

		const modeData = circleCoordinates[gridMode];

		const parsePoints = (points: Record<string, string>) =>
			Object.fromEntries(
				Object.entries(points).map(([key, value]) => [
					key,
					{ coordinates: parseCoordinates(value) }
				])
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

		validateGridData(gridData); // Validate before sending
		onPointsReady(gridData);
	});
</script>

<!-- Replace image with -->
<image href={gridSrc} x="0" y="0" width="950" height="950" preserveAspectRatio="none" />
