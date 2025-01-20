<script lang="ts">
	import { onMount } from 'svelte';
	import { DefaultPropPositioner } from './PropPlacementManager/DefaultPropPositioner';
	import type { GridData } from '../Grid/GridInterface';
	import type { PropInterface } from './PropInterface';
	import type { Motion } from '../Motion/Motion';
	import type { GridMode } from '../Motion/MotionInterface';
	import { pictographsRendered, totalPictographs } from '$lib/stores/pictographRenderStore';

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
	let scaleFactor = 1;

	function getSvgPath(): string {
		const basePath = '/images/props/';
		svgPath = `${basePath}staff.svg`;
		return svgPath;
	}

	function calculateScaledCoords(originalX: number, originalY: number): { x: number; y: number } {
		return {
			x: (originalX / 950) * gridWidth,
			y: (originalY / 950) * gridHeight,
		};
	}


	onMount(() => {

		// Wait until all pictographs are ready
		
		const unsubscribe = pictographsRendered.subscribe((rendered) => {
			totalPictographs.subscribe((total) => {
				if (rendered === total) {
					scaleFactor = Math.min(gridWidth / 950, gridHeight / 950);
					propData = {
						propType: 'staff',
						color: motion.color,
						motion,
						radialMode: motion.endOri === 'in' || motion.endOri === 'out' ? 'radial' : 'nonradial',
						ori: motion.endOri,
						coords: { x: 0, y: 0 },
						loc: motion.endLoc,
					};
					x = calculateScaledCoords(propData.coords.x, propData.coords.y).x;
					y = calculateScaledCoords(propData.coords.x, propData.coords.y).y;
					svgPath = getSvgPath();
					transform = `translate(${x}px, ${y}px) scale(${scaleFactor})`;
					unsubscribe();
				}
			});
		});
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
		transform-origin: center; /* Ensure scaling is centered */
		z-index: 10;
	}
</style>
