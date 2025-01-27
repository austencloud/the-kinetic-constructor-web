<script lang="ts">
	import type { ArrowInterface } from './ArrowInterface';
	import type { ArrowSvgData } from '../SvgManager/ArrowSvgData';
	import { onMount } from 'svelte';
	import { parseArrowSvg } from '../SvgManager/ArrowSvgParser';
	import SvgManager from '../SvgManager/SvgManager';

	export let arrowData: ArrowInterface;

	let svgData: ArrowSvgData | null = null;
	let transform = '';
	const svgManager = new SvgManager();


	const loadAndTransformArrow = async () => {
		try {
			const svgText = await svgManager.getArrowSvg(
				arrowData.motion.motionType,
				arrowData.motion.startOri,
				arrowData.motion.turns,
				arrowData.motion.color
			);

			if (!svgText?.includes('<svg')) {
				throw new Error('Invalid SVG content: Missing <svg> element');
			}

			const { viewBox, center } = parseArrowSvg(svgText);
			svgData = {
				imageSrc: `data:image/svg+xml;base64,${btoa(svgText)}`,
				viewBox,
				center
			};
			arrowData.svgCenter = center;

			
			(arrowData.loc);
			transform = `translate(${arrowData.coords.x}, ${arrowData.coords.y}) 
				rotate(${arrowData.rotAngle} ${center.x} ${center.y})`;
		} catch (error) {
			console.error('Error loading or rotating arrow:', error);

			svgData = {
				imageSrc: '/fallback-arrow.svg',
				viewBox: { width: 100, height: 100 },
				center: { x: 50, y: 50 }
			};
			transform = `translate(${arrowData.coords.x}, ${arrowData.coords.y})`;
		}
		
	};

	$: if (arrowData.motion) {
		loadAndTransformArrow();
	}

	$: if (svgData && arrowData.coords.x !== 0) {
		transform = `translate(${arrowData.coords.x}, ${arrowData.coords.y})
			rotate(${arrowData.rotAngle}, ${svgData.center.x}, ${svgData.center.y})`;
	}
</script>

{#if svgData}
	<g
		transform={`
    translate(${arrowData.coords.x}, ${arrowData.coords.y})
    rotate(${arrowData.rotAngle}, 0, 0)
  `}
	>
		<image
			href={svgData.imageSrc}
			width={svgData.viewBox.width}
			height={svgData.viewBox.height}
			x={-svgData.center.x}
			y={-svgData.center.y}
		/>
	</g>
{/if}

<style>
	/* Your styles here */
</style>
