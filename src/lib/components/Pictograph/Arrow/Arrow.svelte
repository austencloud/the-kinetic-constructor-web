<!-- Arrow.svelte -->
<script lang="ts">
	import type { ArrowInterface } from './ArrowInterface';
	import type { ArrowSvgData } from '../SvgManager/ArrowSvgData';
	import { onMount } from 'svelte';
	import { parseArrowSvg } from '../SvgManager/ArrowSvgParser';
	import ArrowUpdater from './ArrowUpdater';
	import ArrowLocationManager from './ArrowLocationManager';
	import SvgManager from '../SvgManager/SvgManager';

	export let arrowData: ArrowInterface;

	let arrowUpdater: ArrowUpdater;
	let arrowLocationManager: ArrowLocationManager;
	let svgPath = '';
	let transform = '';
	let svgData: ArrowSvgData | null = null;
	const svgManager = new SvgManager();

	let isLoading = false;
	const loadSvg = async () => {
		try {
			const svgText = await svgManager.getArrowSvg(
				arrowData.motion.motionType,
				arrowData.motion.startOri,
				arrowData.motion.turns
			);

			console.debug('Raw SVG text from svgManager:', svgText);

			// Validate the SVG content
			if (!svgText?.includes('<svg')) {
				throw new Error('Invalid SVG content: Missing <svg> element');
			}

			// Parse the SVG
			const { viewBox, center } = parseArrowSvg(svgText);
			console.debug('Parsed SVG viewBox:', viewBox);
			console.debug('Parsed SVG center:', center);

			svgData = {
				imageSrc: `data:image/svg+xml;base64,${btoa(svgText)}`,
				viewBox,
				center
			};
			arrowData.svgCenter = center;
		} catch (error) {
			console.error('SVG load failed:', error);

			// Fallback to a default SVG
			svgData = {
				imageSrc: '/fallback-arrow.svg',
				viewBox: { width: 100, height: 100 },
				center: { x: 50, y: 50 }
			};
		}
	};

	onMount(async () => {
		arrowUpdater = new ArrowUpdater(arrowData);
		arrowLocationManager = new ArrowLocationManager({ arrowData });
		updateArrow();
	});
	$: if (arrowData?.loc && arrowData?.color && !svgData) {
		loadSvg();
	}
	$: coords = svgData ? { x: -svgData.center.x, y: -svgData.center.y } : { x: 0, y: 0 };

	function updateArrow() {
		arrowData.loc = arrowLocationManager.getArrowLocation(arrowData.loc);
		console.log('Arrow data:', arrowData);
		const result = arrowUpdater.updateArrow();
		svgPath = result.svgPath;

		transform = `translate(${arrowData.coords.x}, ${arrowData.coords.y}) 
			rotate(${arrowData.rotAngle}) 
			scale(${arrowData.mirrored ? -1 : 1}, 1)`;
	}
</script>

{#if svgData}
	<g {transform}>
		<image
			href={svgData.imageSrc}
			width={svgData.viewBox.width}
			height={svgData.viewBox.height}
			x={coords.x}
			y={coords.y}
			transform-origin="center"
		/>
	</g>
{/if}
