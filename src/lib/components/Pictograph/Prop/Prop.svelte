<script lang="ts">
	import { onMount } from 'svelte';
	import { DefaultPropPositioner } from './PropPlacementManager/DefaultPropPositioner';
	import type { GridData } from '../Grid/GridInterface';
	import type { PropInterface } from './PropInterface';
	import type { Motion } from '../Motion/Motion';
	import type { GridMode } from '../Motion/MotionInterface';

	export let motion: Motion;
	export let gridData: GridData;
	export let gridWidth: number;
	export let gridHeight: number;
	export let gridMode: GridMode;

	let propData: PropInterface;
	let x = 0;
	let y = 0;
	let transform = '';
	let svgPath = '';

	function getSvgPath(): string {
		const basePath = '/images/props/';
		svgPath = `${basePath}staff.svg`; // Test with a direct path
		return svgPath;
	}

	function calculateScaledCoords(originalX: number, originalY: number): { x: number; y: number } {
		return {
			x: (originalX / 950) * gridWidth,
			y: (originalY / 950) * gridHeight
		};
	}

	onMount(() => {
		console.log('Grid data:', gridData); // Log the grid data

		propData = {
			propType: 'staff',
			color: motion.color,
			motion,
			radialMode: motion.endOri === 'in' || motion.endOri === 'out' ? 'radial' : 'nonradial',
			ori: motion.endOri,
			coords: { x: 0, y: 0 },
			loc: motion.endLoc
		};

		const defaultPositioner = new DefaultPropPositioner( gridData, gridMode);
		defaultPositioner.setToDefaultPosition(propData);
		console.debug('Prop data after positioning:', propData);

		const scaledCoords = calculateScaledCoords(propData.coords.x, propData.coords.y);
		console.debug('Scaled coordinates:', scaledCoords);

		x = scaledCoords.x;
		y = scaledCoords.y;
		svgPath = getSvgPath();
		console.log('SVG Path:', svgPath); // Log the SVG path
		transform = `translate(${x}px, ${y}px)`;
	});
</script>

{#if svgPath}
	<img src={svgPath} class="prop" style="transform: {transform};" alt="Prop" />
{:else}
	<p>Prop SVG path not found.</p>
{/if}

<style>
	.prop {
		position: absolute;
		transition: all 0.3s ease;
		z-index: 10;
	}
</style>
