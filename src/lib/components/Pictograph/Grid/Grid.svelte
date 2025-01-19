<script lang="ts">
	import { onMount } from 'svelte';
	import { parseCircleCoords } from '../../../utils/gridCoordinateUtils'; // Utilities
	import type { CircleCoords } from '../../../types/CircleCoords'; // Types

	export let onPointsReady: (points: CircleCoords[keyof CircleCoords]) => void;
	export let gridMode: 'diamond' | 'box' = 'diamond';

	let gridImagePath: string = '';
	let points: CircleCoords[keyof CircleCoords] | null = null;

	async function loadCircleCoords(): Promise<void> {
		try {
			const response = await fetch('/circle_coords.json');
			if (!response.ok) {
				throw new Error('Failed to load circle_coords.json');
			}

			const data: CircleCoords = await response.json();
			points = parseCircleCoords(data, gridMode);

			if (onPointsReady && points) {
				onPointsReady(points);
			}
		} catch (error) {
			console.error('Error loading circle coordinates:', error);
		}
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
