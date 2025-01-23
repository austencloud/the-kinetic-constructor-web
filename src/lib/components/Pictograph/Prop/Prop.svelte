<script lang="ts">
	import { onMount } from 'svelte';
	import { parseSvgMetadata } from '../SvgManager/svgUtils';
	import SvgManager from '../SvgManager/SvgManager';
	import type { PropInterface } from './PropInterface';
	import type { PropSvgData as PropSvgData } from '../SvgManager/PropSvgData';
	import { rotateOffset } from './propRotationUtils';
	import PropRotAngleManager from './PropRotAngleManager';

	export let propData: PropInterface;

	let transform = '';
	let propSvgData: PropSvgData | null = null;
	let coords = { x: 0, y: 0 };
	const svgManager = new SvgManager();

	// Load SVG and update svgData
	const loadSvg = async () => {
		try {
			const svgText = await svgManager.getPropSvg(propData.propType, propData.color);
			const { viewBox, center } = parseSvgMetadata(svgText);

			propSvgData = {
				imageSrc: `data:image/svg+xml;base64,${btoa(svgText)}`,
				viewBox,
				center
			};

		} catch (error) {
			console.error('Prop load failed:', error);
			propSvgData = null;
		}
	};

	$: {
		if (propData.propType || propData.color) {
			loadSvg();
		}
	}

	$: coords = propSvgData
		? rotateOffset({ x: -propSvgData.center.x, y: -propSvgData.center.y }, -propData.rotAngle)
		: { x: 0, y: 0 };

	$: transform =
		propSvgData && (propData.motion.endLoc || propData.motion.endOri)
			? (() => {
					const rotAngleManager = new PropRotAngleManager({
						loc: propData.motion.endLoc,
						ori: propData.motion.endOri
					});
					propData.rotAngle = rotAngleManager.getRotationAngle();
					return `translate(${propData.coords.x} ${propData.coords.y})
					rotate(${propData.rotAngle} ${propSvgData.center.x} ${propSvgData.center.y})`;
				})()
			: '';
</script>

{#if propSvgData}
	<g {transform}>
		<image
			href={propSvgData.imageSrc}
			width={propSvgData.viewBox.width}
			height={propSvgData.viewBox.height}
			x={coords.x}
			y={coords.y}
			preserveAspectRatio="xMidYMid meet"
		/>
	</g>
{/if}
