<script lang="ts">
	import { onMount } from 'svelte';
	import PropRotAngleManager from './PropRotAngleManager';
	import type { PropInterface } from './PropInterface';

	export let propData: PropInterface;
	export let propScaleFactor: number; // Scaling factor from Pictograph

	let transform = '';
	let svgPath = '';
	let imageSrc = ''; // Holds the data URL for the transformed SVG

	const COLOR_MAP: Record<string, string> = {
		red: '#ED1C24',
		blue: '#2E3192'
	};

	const getSvgPath = () => `/images/props/${propData.propType}.svg`;

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

	function getSvgCenterPoint(svgData: string): { x: number; y: number } | null {
		try {
			const parser = new DOMParser();
			const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
			const centerElement = svgDoc.getElementById('centerPoint');
			if (centerElement) {
				const x = parseFloat(centerElement.getAttribute('cx') || '0');
				const y = parseFloat(centerElement.getAttribute('cy') || '0');
				return { x, y };
			}
		} catch (error) {
			console.error('Failed to parse SVG center point:', error);
		}
		return null;
	}

	async function loadAndTransformSvg(svgPath: string, color: string): Promise<void> {
		try {
			const response = await fetch(svgPath);

			// Check if the response contains SVG content
			const contentType = response.headers.get('content-type');
			if (!response.ok || !contentType?.includes('image/svg+xml')) {
				throw new Error('Invalid SVG file or path');
			}

			const svgData = await response.text();

			// Apply color transformations
			const transformedSvg = applyColorTransformations(svgData, color);

			// Extract center point
			const centerPoint = getSvgCenterPoint(transformedSvg);
			if (centerPoint) {
				propData.svgCenter = centerPoint;
			}

			// Convert the transformed SVG to a data URL
			imageSrc = `data:image/svg+xml;base64,${btoa(transformedSvg)}`;
		} catch (error) {
			console.error('Error loading or transforming SVG:', svgPath, error);
			imageSrc = ''; // Clear on error
		}
	}

	onMount(() => {
		svgPath = getSvgPath();
		loadAndTransformSvg(svgPath, propData.color);

		// Compute transform for prop position
		if (propData.coords) {
			const rotationManager = new PropRotAngleManager({
				location: propData.loc,
				orientation: propData.ori
			});
			const rotationAngle = rotationManager.getRotationAngle();

			transform = `translate(${propData.coords.x * propScaleFactor}px, ${propData.coords.y * propScaleFactor}px)
						 scale(${propScaleFactor}) rotate(${rotationAngle}deg)`;
		} else {
			console.error('Prop coordinates are missing.');
		}
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
