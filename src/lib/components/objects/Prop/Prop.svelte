<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
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
	let isLoaded = false;
	
	const dispatch = createEventDispatcher();
	
	// For tracking load state
	let loadTimeout: number;

	const svgManager = new SvgManager();

	// Load SVG and update svgData
	const loadSvg = async () => {
		try {
			// Set a timeout to ensure we don't get stuck in loading state
			loadTimeout = setTimeout(() => {
				isLoaded = true;
				dispatch('loaded');
			}, 3000);
			
			const svgText = await svgManager.getPropSvg(propData.propType, propData.color);
			const { viewBox, center } = parsePropSvg(svgText);

			svgData = {
				imageSrc: `data:image/svg+xml;base64,${btoa(svgText)}`,
				viewBox,
				center
			};

			propData.svgCenter = center;
			
			// Clear timeout as we've loaded successfully
			clearTimeout(loadTimeout);
			
			// Mark as loaded after a brief delay to ensure rendering completes
			setTimeout(() => {
				isLoaded = true;
				dispatch('loaded');
			}, 50);
		} catch (error) {
			console.error('Prop load failed:', error);
			svgData = null;
			
			// Even if we fail, mark as loaded so we don't block the UI
			clearTimeout(loadTimeout);
			isLoaded = true;
			dispatch('loaded', { error: true });
		}
	};

	onMount(() => {
		if (propData.propType) {
			loadSvg();
		}
		
		return () => {
			clearTimeout(loadTimeout);
		};
	});

	$: {
		if (propData.propType || propData.color) {
			loadSvg();
		}
	}

	$: coords = svgData
		? rotateOffset({ x: -svgData.center.x, y: -svgData.center.y }, -propData.rotAngle)
		: { x: 0, y: 0 };

	$: transform =
		svgData && (propData.loc || propData.ori) // ✅ Use stored values instead of motion reference
			? (() => {
					const rotAngleManager = new PropRotAngleManager({
						loc: propData.loc, // ✅ Use `propData.loc`
						ori: propData.ori  // ✅ Use `propData.ori`
					});
					propData.rotAngle = rotAngleManager.getRotationAngle();
					return `translate(${propData.coords.x} ${propData.coords.y})
					rotate(${propData.rotAngle} ${svgData.center.x} ${svgData.center.y})`;
				})()
			: '';
</script>

{#if svgData && isLoaded}
	<g {transform}>
		<image
			href={svgData.imageSrc}
			width={svgData.viewBox.width}
			height={svgData.viewBox.height}
			x={coords.x}
			y={coords.y}
			preserveAspectRatio="xMidYMid meet"
			on:load={() => dispatch('imageLoaded')}
		/>
	</g>
{/if}