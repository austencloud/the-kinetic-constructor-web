<script lang="ts">
	import { onMount } from 'svelte';
	import PropRotAngleManager from './PropRotAngleManager';
	import type { PropInterface } from './PropInterface';

	export let propData: PropInterface;

	let transform = '';
	let svgPath = '';
	let imageSrc = '';

	/**
	 * Generates the path to the SVG asset for the prop.
	 */
	const getSvgPath = () => `/images/props/${propData.propType}.svg`;

	/**
	 * Computes the transform string for placing and rotating the prop.
	 */
	function computeTransform(): string {
		const rotationManager = new PropRotAngleManager({
			location: propData.loc,
			orientation: propData.ori
		});
		const rotationAngle = rotationManager.getRotationAngle();
		return `translate(${propData.coords.x}px, ${propData.coords.y}px) rotate(${rotationAngle}deg)`;
	}

	/**
	 * Handles SVG loading and assigns the transformed URL for rendering.
	 */
	async function loadSvg(): Promise<void> {
		try {
			const response = await fetch(svgPath);

			if (!response.ok || !response.headers.get('content-type')?.includes('image/svg+xml')) {
				throw new Error('Failed to load valid SVG file.');
			}

			const svgData = await response.text();
			imageSrc = `data:image/svg+xml;base64,${btoa(svgData)}`;
		} catch (error) {
			console.error('Error loading SVG:', error);
			imageSrc = '';
		}
	}

	// Reactive statement for transform
	$: transform = computeTransform();

	onMount(() => {
		svgPath = getSvgPath();
		loadSvg();
	});
</script>

{#if imageSrc}
	<g class="prop-group" transform={transform}>
		<image
			href={imageSrc}
			width="252.8" 
			height="77.8" 
			x="0"
			y="0"
			preserveAspectRatio="xMidYMid meet"
		/>
	</g>
{:else}
	<p>Loading or transforming SVG failed.</p>
{/if}

<style>
	.prop-group {
		transform-origin: center;
		cursor: pointer;
		transition: transform 0.2s ease;
	}
</style>
