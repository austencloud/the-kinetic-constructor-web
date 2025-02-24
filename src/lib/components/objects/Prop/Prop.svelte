<script lang="ts">
	import { onMount } from 'svelte';
	import { parsePropSvg } from '../../SvgManager/PropSvgParser';
	import SvgManager from '../../SvgManager/SvgManager';
	import type { PropData } from './PropData';
	import type { PropSvgData } from '../../SvgManager/PropSvgData';
	import { rotateOffset } from './rotationUtils';
	import PropRotAngleManager from './PropRotAngleManager';
	import { PropChecker } from './PropChecker';

	export let propData: PropData;
    console.log("📦 Received Prop Data:", propData);

	let transform = '';
	let svgData: PropSvgData | null = null;
	let coords = { x: 0, y: 0 };
	let checker = propData ? new PropChecker(propData) : null;

	const svgManager = new SvgManager();

	// Load SVG and update svgData
	const loadSvg = async () => {
		try {
			const svgText = await svgManager.getPropSvg(propData.propType, propData.color);
			const { viewBox, center } = parsePropSvg(svgText);

			svgData = {
				imageSrc: `data:image/svg+xml;base64,${btoa(svgText)}`,
				viewBox,
				center
			};

			propData.svgCenter = center;
		} catch (error) {
			console.error('Prop load failed:', error);
			svgData = null;
		}
	};

	$: {
		if (propData.propType || propData.color) {
			loadSvg();
		}
	}

	$: coords = svgData
		? rotateOffset({ x: -svgData.center.x, y: -svgData.center.y }, -propData.rotAngle)
		: { x: 0, y: 0 };

	$: transform =
		svgData && (propData.endLoc || propData.endOri) // ✅ Use stored values instead of motion reference
			? (() => {
					const rotAngleManager = new PropRotAngleManager({
						loc: propData.endLoc, // ✅ Use `propData.endLoc`
						ori: propData.endOri  // ✅ Use `propData.endOri`
					});
					propData.rotAngle = rotAngleManager.getRotationAngle();
					return `translate(${propData.coords.x} ${propData.coords.y})
					rotate(${propData.rotAngle} ${svgData.center.x} ${svgData.center.y})`;
				})()
			: '';
</script>

{#if svgData}
	<g {transform}>
		<image
			href={svgData.imageSrc}
			width={svgData.viewBox.width}
			height={svgData.viewBox.height}
			x={coords.x}
			y={coords.y}
			preserveAspectRatio="xMidYMid meet"
		/>
	</g>
{/if}
