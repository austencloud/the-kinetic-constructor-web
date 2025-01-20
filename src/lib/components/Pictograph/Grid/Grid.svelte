<script lang="ts">
	import { onMount } from 'svelte';
	import type { CircleCoords } from '../../../types/CircleCoords';
	import type { GridData } from './GridInterface';

	export let onPointsReady: (gridData: GridData) => void;
	export let gridMode: 'diamond' | 'box' = 'diamond';

	let gridImagePath: string = '';
	let circleCoords: CircleCoords | null = null;

	async function loadCircleCoords(): Promise<void> {
		try {
			const response = await fetch('/circle_coords.json');
			if (!response.ok) throw new Error('Failed to load circle_coords.json');

			circleCoords = await response.json();

			if (circleCoords) {
				const gridData: GridData = {
					allHandPointsStrict: parsePoints(circleCoords, 'strict'),
					allHandPointsNormal: parsePoints(circleCoords, 'normal')
				};

				if (onPointsReady) onPointsReady(gridData);
			}
		} catch (error) {
			console.error('Error loading circle coordinates:', error);
		}
	}

	function parsePoints(
		circleCoords: CircleCoords,
		mode: 'strict' | 'normal'
	): Record<string, { coordinates: { x: number; y: number } }> {
		const points = circleCoords[gridMode]?.hand_points[mode] || {};
		return Object.entries(points).reduce(
			(acc: Record<string, { coordinates: { x: number; y: number } }>, [key, value]) => {
				acc[key] = { coordinates: value as { x: number; y: number } };
				return acc;
			},
			{}
		);
	}

	$: gridImagePath = gridMode === 'diamond' ? '/diamond_grid.png' : '/box_grid.png';

	onMount(() => {
		loadCircleCoords();
	});
</script>

<div class="grid-container">
	<img src={gridImagePath} alt="Grid Background" />
</div>

<style>
	.grid-container {
		width: 100%;
		height: 100%;
		margin: 0; /* No outer spacing */
		padding: 0; /* No inner spacing */
		border: none; /* Removes any default borders */
		display: flex; /* Aligns content */
		justify-content: center; /* Ensures centering (if necessary) */
		align-items: center; /* Ensures centering (if necessary) */
		overflow: hidden; /* Avoids content overflow */
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover; /* Ensures the image stretches properly */
		margin: 0; /* No outer spacing */
		padding: 0; /* No inner spacing */
		border: none; /* Removes default borders */
	}
</style>
