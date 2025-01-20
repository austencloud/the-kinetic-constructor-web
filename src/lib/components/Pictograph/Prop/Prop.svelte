<script lang="ts">
	import { onMount } from 'svelte';
	import { DefaultPropPositioner } from './PropPlacementManager/DefaultPropPositioner';
	import type { GridData } from '../Grid/GridInterface';
	import type { PropInterface } from './PropInterface';
	import type { Motion } from '../Motion/Motion';

	export let motion: Motion;
	export let gridData: GridData;
	export let gridWidth: number; // Width of the container
	export let gridHeight: number; // Height of the container

	let propData: PropInterface;
	let x = 0;
	let y = 0;
	let transform = '';
	let svgPath = '';

	// Get the path to the SVG file based on the prop type
	function getSvgPath(): string {
		const basePath = '/images/props/';
		return `${basePath}${propData.propType || 'staff'}.svg`; // Default to 'staff'
	}

	// Scale the coordinates from the original 950x950 grid to the current container size
	function calculateScaledCoords(originalX: number, originalY: number): { x: number; y: number } {
		return {
			x: (originalX / 950) * gridWidth,
			y: (originalY / 950) * gridHeight,
		};
	}

	onMount(() => {
		// Initialize prop data
		propData = {
			propType: 'staff',
			color: motion.color,
			motion,
			radialMode: motion.endOri === 'in' || motion.endOri === 'out' ? 'radial' : 'nonradial',
			ori: motion.endOri,
			coords: { x: 0, y: 0 },
			loc: motion.endLoc,
		};

		// Use DefaultPropPositioner to get the default position of the prop
		const defaultPositioner = new DefaultPropPositioner(gridData);
		defaultPositioner.setToDefaultPosition(propData);

		// Scale the coordinates for the current container size
		const scaledCoords = calculateScaledCoords(propData.coords.x, propData.coords.y);

		x = scaledCoords.x;
		y = scaledCoords.y;
		svgPath = getSvgPath();
		transform = `translate(${x}px, ${y}px)`;
	});
</script>

{#if svgPath}
	<svg
		class="prop"
		style="transform: {transform};"
		xmlns="http://www.w3.org/2000/svg"
	>
		<use href={svgPath}></use>
	</svg>
{/if}

<style>
	.prop {
		position: absolute;
		transition: all 0.3s ease;
		z-index: 10;
	}
</style>
