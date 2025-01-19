<script lang="ts">
	import { onMount } from 'svelte';
	import PropRotAngleManager from './PropRotAngleManager';
	import type { PropInterface } from './PropInterface';

	export let propDict: PropInterface;
	export let gridPoints: Record<string, { x: number; y: number }> = {};

	let svgPath = '';
	let transform = '';
	let x = 0;
	let y = 0;
	let rotAngleManager: PropRotAngleManager | null = null;

	function getSvgPath(): string {
		const basePath = '/images/props/';
		return `${basePath}${propDict.propType}.svg`;
	}

	function updatePosition(): void {
		const { motion } = propDict;

		if (!motion?.endLoc || !motion?.endOri) {
			console.warn('Motion data is incomplete:', motion);
			x = 0;
			y = 0;
			transform = `translate(${x}px, ${y}px)`;
			return;
		}

		const position = gridPoints[motion.endLoc] || { x: 0, y: 0 };
		x = position.x;
		y = position.y;

		transform = `translate(${x}px, ${y}px) rotate(${rotAngleManager?.getRotationAngle() || 0}deg)`;
	}

	onMount(() => {
		const { motion } = propDict;

		if (motion?.endLoc && motion?.endOri) {
			rotAngleManager = new PropRotAngleManager({
				location: motion.endLoc,
				orientation: motion.endOri
			});
			updatePosition();
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
