<script lang="ts">
	import type { ArrowData } from './ArrowData';
	import type { ArrowSvgData } from '../SvgManager/ArrowSvgData';
	import { parseArrowSvg } from '../SvgManager/parseArrowSvg';
	import SvgManager from '../SvgManager/SvgManager';

	export let arrowData: ArrowData;

	let svgData: ArrowSvgData | null = null;
	let transform = '';
	const svgManager = new SvgManager();
	

	// Load the SVG and set up its data
	const loadArrowSvg = async () => {
		try {
			// Get the SVG data
			const svgText = await svgManager.getArrowSvg(
				arrowData.motion.motionType,
				arrowData.motion.startOri,
				arrowData.motion.turns,
				arrowData.motion.color
			);

			if (!svgText?.includes('<svg')) {
				throw new Error('Invalid SVG content: Missing <svg> element');
			}

			// Parse the SVG to extract viewBox and center
			const originalSvgData = parseArrowSvg(svgText);

			// If mirrored, adjust the center point
			const center = { ...originalSvgData.center };
			if (arrowData.svgMirrored) {
				center.x = originalSvgData.viewBox.width - center.x;
			}

			svgData = {
				imageSrc: `data:image/svg+xml;base64,${btoa(svgText)}`,
				viewBox: originalSvgData.viewBox,
				center
			};
		} catch (error) {
			console.error('Error loading arrow SVG:', error);
			// Fallback in case of failure
			svgData = {
				imageSrc: '/fallback-arrow.svg',
				viewBox: { x: 0, y: 0, width: 100, height: 100 },
				center: { x: 50, y: 50 }
			};
		}
	};

	// Trigger the SVG load
	$: if (arrowData.motion) {
		loadArrowSvg();
	}
	$: if (svgData && (arrowData.coords || arrowData.rotAngle || arrowData.svgMirrored)) {
		const mirrorTransform = arrowData.svgMirrored ? `scale(-1, 1)` : '';



		transform = `
			translate(${arrowData.coords.x}, ${arrowData.coords.y})
			rotate(${arrowData.rotAngle})
			${mirrorTransform}
	`;
	}
</script>

{#if svgData}
	<g {transform}>
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
	/* Optional styles for customization */
</style>
