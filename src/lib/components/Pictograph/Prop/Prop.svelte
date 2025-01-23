<!-- Prop.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { rotateOffset } from './rotationUtils';
	import PropSvgLoader from './PropSvgLoader';
	import type { SvgData } from './svgData';
	import type { PropInterface } from './PropInterface';

	export let propData: PropInterface;

	let svgData: SvgData | null = null;

	const loadSvg = async () => {
		try {
			svgData = await PropSvgLoader.load(propData.propType);
			propData.svgCenter = svgData.center;
		} catch (error) {
			console.error('Prop loading failed:', error);
			svgData = null;
		}
	};

	const getPosition = (center: SvgData['center'], angle: number) =>
		rotateOffset({ x: -center.x, y: -center.y }, -angle);

	$: position = svgData ? getPosition(svgData.center, propData.rotAngle) : { x: 0, y: 0 };
	$: transform = svgData
		? `
	  translate(${propData.coords.x} ${propData.coords.y})
	  rotate(${propData.rotAngle} ${svgData.center.x} ${svgData.center.y})
	`
		: '';

	onMount(loadSvg);
	$: propData.propType && loadSvg();
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
