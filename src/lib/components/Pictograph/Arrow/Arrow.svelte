<script lang="ts">
	import type { ArrowInterface } from './ArrowInterface';
	import type { ArrowSvgData } from '../SvgManager/ArrowSvgData';
	import { onMount } from 'svelte';
	import { parseArrowSvg } from '../SvgManager/ArrowSvgParser';
	import ArrowRotAngleManager from './ArrowRotAngleManager';
	import SvgManager from '../SvgManager/SvgManager';

	export let arrowData: ArrowInterface;

	let svgData: ArrowSvgData | null = null;
	let transform = '';
	const svgManager = new SvgManager();
	let arrowRotAngleManager: ArrowRotAngleManager;

	/**
	 * Load SVG and compute rotation.
	 */
	const loadAndTransformArrow = async () => {
		try {
			// Load SVG content
			const svgText = await svgManager.getArrowSvg(
				arrowData.motion.motionType,
				arrowData.motion.startOri,
				arrowData.motion.turns
			);
			console.debug('Raw SVG text from svgManager:', svgText);

			if (!svgText?.includes('<svg')) {
				throw new Error('Invalid SVG content: Missing <svg> element');
			}

			// Parse SVG
			const { viewBox, center } = parseArrowSvg(svgText);
			svgData = {
				imageSrc: `data:image/svg+xml;base64,${btoa(svgText)}`,
				viewBox,
				center
			};
			arrowData.svgCenter = center;

			// Calculate rotation angle
			arrowRotAngleManager = new ArrowRotAngleManager(arrowData);
			arrowData.rotAngle = arrowRotAngleManager.updateRotation();
			// log the rot angle
			console.debug('Arrow rotation angle:', arrowData.rotAngle);
			transform = `translate(${arrowData.coords.x}, ${arrowData.coords.y}) 
				rotate(${arrowData.rotAngle} ${center.x} ${center.y})`;

			console.debug('Arrow rotation applied with transform:', transform);
		} catch (error) {
			console.error('Error loading or rotating arrow:', error);

			// Fallback to default SVG
			svgData = {
				imageSrc: '/fallback-arrow.svg',
				viewBox: { width: 100, height: 100 },
				center: { x: 50, y: 50 }
			};
			transform = `translate(${arrowData.coords.x}, ${arrowData.coords.y})`;
		}
	};

	// Reactive logic
	onMount(() => {
		loadAndTransformArrow();
	});
</script>

{#if svgData}
	<g {transform}>
		<image
			href={svgData.imageSrc}
			width={svgData.viewBox.width}
			height={svgData.viewBox.height}
			x={-svgData.center.x}
			y={-svgData.center.y}
			transform-origin="center"
		/>
	</g>
{/if}

<style>
	/* Your styles here */
</style>
