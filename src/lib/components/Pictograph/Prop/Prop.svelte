<script lang="ts">
	import { onMount } from 'svelte';
	import PropRotAngleManager from './PropRotAngleManager';
	import type { PropInterface } from './PropInterface';

	export let propData: PropInterface;
	export let propScaleFactor: number; // Scaling factor from Pictograph
	let transform = '';
	let svgPath = '';
	let fillColor = '';
	let imageSrc = ''; // Holds the data URL for the transformed SVG

	const getSvgPath = () => `/images/props/${propData.propType}.svg`;

	const COLOR_MAP: Record<string, string> = {
		red: '#ED1C24',
		blue: '#2E3192'
	};

	function applyColorTransformations(svgData: string, newColor: string): string {
		const newHexColor = COLOR_MAP[newColor];
		if (!newHexColor) return svgData;

		const classColorPattern = /(\.st0\s*\{.*?fill:\s*)(#[a-fA-F0-9]{6})(.*?\})/g;
		const fillPattern = /(fill=")(#[a-fA-F0-9]{6})(")/g;

		const replaceColor = (match: string, prefix: string, color: string, suffix: string) => {
			return `${prefix}${newHexColor}${suffix}`;
		};

		return svgData.replace(classColorPattern, replaceColor).replace(fillPattern, replaceColor);
	}

	async function loadAndTransformSvg(svgPath: string, color: string): Promise<void> {
		try {
			console.log('Fetching SVG from path:', svgPath);

			const response = await fetch(svgPath);

			// Log response headers
			console.log('Response Headers:', response.headers);

			// Check if the content type is SVG
			const contentType = response.headers.get('content-type');
			if (!response.ok || !contentType?.includes('image/svg+xml')) {
				console.error('Invalid content type:', contentType, 'for path:', svgPath);
				throw new Error('Invalid SVG file or path');
			}

			const svgData = await response.text();

			// Apply color transformations
			const transformedSvg = applyColorTransformations(svgData, color);

			// Convert the transformed SVG to a data URL
			imageSrc = `data:image/svg+xml;base64,${btoa(transformedSvg)}`;
			console.log('Generated Image Source:', imageSrc);
		} catch (error) {
			console.error('Error loading or transforming SVG:', svgPath, error);
			imageSrc = ''; // Clear on error
		}
	}

	onMount(() => {
		console.log('Prop Data:', propData);
		console.log('Prop Scale Factor:', propScaleFactor);
		svgPath = getSvgPath();
		loadAndTransformSvg(svgPath, propData.color);

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
		fillColor = propData.color ? COLOR_MAP[propData.color] : '#000000'; // Default to black if color is missing
		console.log('Calculated Transform:', transform);
		console.log('SVG Path:', svgPath);
		console.log('Fill Color:', fillColor);
	});
</script>

{#if imageSrc}
	<img
		src={imageSrc}
		class="prop"
		style="transform: {transform};"
		alt="Transformed Prop"
	/>
{:else}
	<p>Loading or transforming SVG failed.</p>
{/if}

<style>
	.prop {
		position: absolute;
		transform-origin: center; /* Center scaling and rotation */
		z-index: 10;
		box-sizing: border-box;
	}
</style>
