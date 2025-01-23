<!-- Prop.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { parseSvgMetadata } from '../SvgManager/svgUtils';
	import SvgManager from '../SvgManager/SvgManager';
	import type { PropInterface } from './PropInterface';
	import type { SvgData } from '../SvgManager/svgData';
	import { rotateOffset } from './propRotationUtils';
	import PropRotAngleManager from './PropRotAngleManager';

	export let propData: PropInterface;
	export let svgManager: SvgManager;

	let transform = '';
	let svgData: SvgData | null = null;

	const loadSvg = async () => {
		try {
			const svgText = await svgManager.getColoredPropSvg(propData.propType, propData.color);

			const { viewBox, center } = parseSvgMetadata(svgText);

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

	const getPosition = (center: SvgData['center'], angle: number) =>
		rotateOffset({ x: -center.x, y: -center.y }, -angle);

	$: position = svgData ? getPosition(svgData.center, propData.rotAngle) : { x: 0, y: 0 };
	$: {
		if (propData.motion.endLoc || propData.motion.endOri) {
			const rotAngleManager = new PropRotAngleManager({
				loc: propData.motion.endLoc,
				ori: propData.motion.endOri
			});
			propData.rotAngle = rotAngleManager.getRotationAngle();
			transform = svgData
				? `
			translate(${propData.coords.x} ${propData.coords.y})
			rotate(${propData.rotAngle} ${svgData.center.x} ${svgData.center.y})
			`
				: '';
		}
	}

	$: {
		if (propData.propType || propData.color) {
			loadSvg();
		}
	}
</script>

{#if svgData}
	<g {transform}>
		<image
			href={svgData.imageSrc}
			width={svgData.viewBox.width}
			height={svgData.viewBox.height}
			x={position.x}
			y={position.y}
			preserveAspectRatio="xMidYMid meet"
		/>
	</g>
{/if}
