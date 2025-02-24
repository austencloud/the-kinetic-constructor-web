<script lang="ts">
	import type { ArrowData } from './ArrowData';
	import type { ArrowSvgData } from '../../SvgManager/ArrowSvgData';
	import { parseArrowSvg } from '../../SvgManager/parseArrowSvg';
	import SvgManager from '../../SvgManager/SvgManager';

	export let arrowData: ArrowData;
	console.log("📦 Received Arrow Data:", arrowData);

	let svgData: ArrowSvgData | null = null;
	let transform = '';
	const svgManager = new SvgManager();

	// Load the SVG and set up its data
	const loadArrowSvg = async () => {
		try {
			const svgText = await svgManager.getArrowSvg(
				arrowData.motionType, // ✅ Use stored motionType
				arrowData.startOri,   // ✅ Use stored startOri
				arrowData.turns,      // ✅ Use stored turns
				arrowData.color
			);

			if (!svgText?.includes('<svg')) {
				throw new Error('Invalid SVG content: Missing <svg> element');
			}

			const originalSvgData = parseArrowSvg(svgText);

			// Adjust center point if mirrored
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
			svgData = {
				imageSrc: '/fallback-arrow.svg',
				viewBox: { x: 0, y: 0, width: 100, height: 100 },
				center: { x: 50, y: 50 }
			};
		}
	};

	// Trigger the SVG load
	$: if (arrowData.motionType) {
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
