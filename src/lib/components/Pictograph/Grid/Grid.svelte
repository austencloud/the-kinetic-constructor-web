<script lang="ts">
	import { onMount } from 'svelte';
	import type { CircleCoords } from '../../../types/CircleCoords';
	import type { GridData } from './GridInterface';

	export let onPointsReady: (gridData: GridData) => void;
	export let gridMode: 'diamond' | 'box' = 'diamond';

	let circleCoords: CircleCoords | null = null;
	let gridWidth = 950; // Default dimensions for scaling reference
	let gridHeight = 950;

	async function loadCircleCoords(): Promise<void> {
		try {
			const response = await fetch('/circle_coords.json');
			if (!response.ok) throw new Error('Failed to load circle_coords.json');
			circleCoords = await response.json();

			if (circleCoords) {
				const gridData: GridData = {
					allHandPointsStrict: parsePoints(circleCoords, 'strict'),
					allHandPointsNormal: parsePoints(circleCoords, 'normal'),
				};

				onPointsReady?.(gridData);
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
			{} as Record<string, { coordinates: { x: number; y: number } }>
		);
	}

	onMount(() => {
		loadCircleCoords();
	});
</script>

<svg
	class="grid"
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 {gridWidth} {gridHeight}"
	preserveAspectRatio="xMidYMid meet"
>
	<rect width="100%" height="100%" fill="none" stroke="black" />
</svg>

<style>
	.grid {
		width: 100%;
		height: 100%;
	}
</style>
