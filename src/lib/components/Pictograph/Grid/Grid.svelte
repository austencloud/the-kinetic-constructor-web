<script lang="ts">
	import { onMount } from 'svelte';

	export let gridMode: 'diamond' | 'box' = 'diamond';
	export let onPointsReady: (gridData: GridData) => void;

	import type { GridData } from './GridInterface';

	let gridSrc = '';
	let gridData: GridData;

	$: {
		// Dynamically load the grid SVG based on the mode
		gridSrc = gridMode === 'diamond' ? '/diamond_grid.svg' : '/box_grid.svg';
	}

	// Simulate loading gridData (replace with actual logic for fetching or generating gridData)
	onMount(() => {
		gridData = {
			allHandPointsStrict: {
				n_diamond_hand_point_strict: { coordinates: { x: 475, y: 325 } },
			},
			allHandPointsNormal: {
				n_diamond_hand_point: { coordinates: { x: 475, y: 331.9 } },
			},
		};

		// Emit the event when gridData is ready
		onPointsReady(gridData);
	});
</script>

<div class="grid-container">
	<img src={gridSrc} alt="{gridMode} grid" class="grid-image" />
</div>

<style>
	.grid-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
	}

	.grid-image {
		width: 100%;
		height: auto;
		object-fit: contain;
	}
</style>
