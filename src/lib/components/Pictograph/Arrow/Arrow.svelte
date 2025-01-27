<script lang="ts">
	import type { ArrowInterface } from './ArrowInterface';
	import type { ArrowSvgData } from '../SvgManager/ArrowSvgData';
	import { parseArrowSvg } from '../SvgManager/parseArrowSvg';
	import SvgManager from '../SvgManager/SvgManager';

	export let arrowData: ArrowInterface;

	let svgData: ArrowSvgData | null = null;
	let transform = '';
	const svgManager = new SvgManager();

	// Load the SVG and apply mirroring logic programmatically
	const loadArrowSvg = async () => {
		try {
			// Get the original SVG based on motion properties
			const svgText = await svgManager.getArrowSvg(
				arrowData.motion.motionType,
				arrowData.motion.startOri,
				arrowData.motion.turns,
				arrowData.motion.color
			);

			if (!svgText?.includes('<svg')) {
				throw new Error('Invalid SVG content: Missing <svg> element');
			}

			// Parse the original SVG
			const originalParsed = parseArrowSvg(svgText);

			// Determine SVG center
			let center = { ...originalParsed.center };

			// If mirroring is enabled, adjust the center programmatically
			if (arrowData.svgMirrored) {
				center.x = originalParsed.viewBox.width - center.x;
			}

			// Update the arrow data and assign the SVG source
			svgData = {
				imageSrc: `data:image/svg+xml;base64,${btoa(svgText)}`,
				viewBox: originalParsed.viewBox,
				center,
			};

			arrowData.svgCenter = center;
		} catch (error) {
			console.error('Error loading arrow SVG:', error);

			// Fallback for errors
			svgData = {
				imageSrc: '/fallback-arrow.svg',
				viewBox: { x: 0, y: 0, width: 100, height: 100 },
				center: { x: 50, y: 50 },
			};
			arrowData.svgCenter = { x: 50, y: 50 };
		}
	};

	// Trigger the SVG load on arrow motion updates
	$: if (arrowData.motion) {
		loadArrowSvg();
	}

	// Calculate the transform with mirroring adjustment
	$: if (svgData) {
		// If mirrored, apply a programmatic mirroring transform
		const mirrorTransform = arrowData.svgMirrored ? `scale(-1, 1)` : '';
		transform = `
			translate(${arrowData.coords.x}, ${arrowData.coords.y})
			${mirrorTransform}
			rotate(${arrowData.rotAngle}, ${svgData.center.x}, ${svgData.center.y})
		`;
	}
</script>

{#if svgData}
	<g transform={transform}>
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
	/* Optional styles for additional customization */
</style>
