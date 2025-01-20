<script lang="ts">
	import { onMount } from 'svelte';
	import PropRotAngleManager from './PropRotAngleManager';
	import type { PropInterface, RadialMode } from './PropInterface';
	import type { Motion } from '../Motion/Motion';

	export let motion: Motion;

	let x = 0;
	let y = 0;
	let transform = '';
	let svgPath = '';
	let rotAngleManager: PropRotAngleManager | null = null;
	let propData: PropInterface;

	function getSvgPath(): string {
		const basePath = '/images/props/';
		return `${basePath}${propData.propType}.svg`;
	}

	function determineRadialMode(endOri: string | null): RadialMode {
		return endOri === 'in' || endOri === 'out' ? 'radial' : 'nonradial';
	}

	onMount(() => {
		propData = {
			motion: motion,
			propType: 'staff',
			color: motion.color,
			radialMode: determineRadialMode(motion.endOri),
			ori: motion.endOri,
			coords: { x: 0, y: 0 },
			loc: motion.endLoc,
		};

		if (motion.endLoc && motion.endOri) {
			rotAngleManager = new PropRotAngleManager({
				location: motion.endLoc,
				orientation: motion.endOri
			});
			svgPath = getSvgPath();
		} else {
			console.error('Invalid motion data:', motion);
		}
	});
</script>

<svg
	class="prop"
	style="left: {x}px; top: {y}px; transform: {transform};"
	xmlns="http://www.w3.org/2000/svg"
>
	<use href={svgPath}></use>
</svg>

<style>
	.prop {
		position: absolute;
		transition: all 0.3s ease;
		width: 50px;
		height: 50px;
	}
</style>
