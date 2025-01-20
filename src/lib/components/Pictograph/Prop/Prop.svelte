<script lang="ts">
	import { onMount } from 'svelte';
	import PropRotAngleManager from './PropRotAngleManager';
	import type { PropInterface } from './PropInterface';

	export let propData: PropInterface;
	export let propScaleFactor: number; // Scaling factor from Pictograph
	let transform = '';
	let svgPath = '';

	const getSvgPath = () => `/images/props/${propData.propType}.svg`;

	onMount(() => {
		console.log('Prop Data:', propData);
		console.log('Scene Scale Factor:', propScaleFactor);

		// Validate coordinates and calculate transform
		if (propData.coords) {
			const rotationManager = new PropRotAngleManager({
				location: propData.loc,
				orientation: propData.ori
			});
			const rotationAngle = rotationManager.getRotationAngle();

			// Transform includes scaling, translation, and rotation
			transform = `translate(${propData.coords.x * propScaleFactor}px, ${propData.coords.y * propScaleFactor}px)
                         scale(${propScaleFactor}) rotate(${rotationAngle}deg)`;
		} else {
			console.error('Prop coordinates are missing.');
		}

		svgPath = getSvgPath();
		console.log('Calculated Transform:', transform);
		console.log('SVG Path:', svgPath);
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
		transform-origin: center; /* Center scaling and rotation */
		z-index: 10;
		box-sizing: border-box;
	}
</style>
