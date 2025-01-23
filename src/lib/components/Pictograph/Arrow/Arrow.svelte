<script lang="ts">
	import ArrowUpdater from './ArrowUpdater';
	import ArrowLocationManager from './ArrowLocationManager';
	import type { ArrowInterface } from './ArrowInterface';
	import type { Motion } from '../Motion/Motion';
	import { onMount } from 'svelte';
	import type { PropSvgData } from '../SvgManager/PropSvgData';
	import SvgManager from '../SvgManager/SvgManager';
	import { parseSvgMetadata } from '../SvgManager/svgUtils';
	import type { ArrowSvgData } from '../SvgManager/ArrowSvgData';

	export let arrowData: ArrowInterface;

	let transform = '';
	let arrowSvgData: ArrowSvgData | null = null;
	let coords = { x: 0, y: 0 };
	const svgManager = new SvgManager();

	let arrowUpdater = new ArrowUpdater(arrowData);
	let arrowLocationManager = new ArrowLocationManager({ arrowData });
	let svgPath = '';

	// Load SVG and update svgData
	const loadSvg = async () => {
		try {
			const svgText = await svgManager.getArrowSvg(
				arrowData.motion.motionType,
				arrowData.motion.startOri,
				arrowData.motion.turns
			);
			const { viewBox, center } = parseSvgMetadata(svgText);

			arrowSvgData = {
				imageSrc: `data:image/svg+xml;base64,${btoa(svgText)}`,
				viewBox,
			};

			arrowData.svgCenter = center;
		} catch (error) {
			console.error('Prop load failed:', error);
			arrowSvgData = null;
		}
	};

	// $: {
	// 	if (arrowData.motion.turns || arrowData.color) {
	// 		loadSvg();
	// 	}
	// }

	$: if (arrowUpdater) {
		const updateResult = arrowUpdater.updateArrow();
		svgPath = updateResult.svgPath || '';
		transform = `translate(${arrowData.coords.x}px, ${arrowData.coords.y}px) rotate(${arrowData.rotation}deg) scale(${
			arrowData.mirrored ? -1 : 1
		}, 1)`;
	}
</script>

<img src={svgPath} alt="Arrow" class="arrow" style="transform: {transform};" />

<style>
	.arrow {
		position: absolute;
		width: 50px;
		height: auto;
		transform-origin: center center;
		transition: all 0.3s ease;
	}
</style>
