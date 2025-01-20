<script lang="ts">
	import { onMount } from 'svelte';
	import PropRotAngleManager from './PropRotAngleManager';
	import type { Motion } from '../Motion/Motion';

	export let motion: Motion;

	let x = 0;
	let y = 0;
	let transform = '';
	let svgPath = '';
	let rotAngleManager: PropRotAngleManager | null = null;

	function getSvgPath(): string {
		const basePath = '/images/props/';
		return motion.prop ? `${basePath}${motion.prop.propType}.svg` : '';
	}


	onMount(() => {
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
