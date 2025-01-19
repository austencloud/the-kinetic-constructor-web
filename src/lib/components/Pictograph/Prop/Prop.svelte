<script lang="ts">
	import { onMount } from 'svelte';
	import PropRotAngleManager from './PropRotAngleManager';
	import type { Motion } from '../Motion/Motion';

	export let propDict: { propType: string; color: 'red' | 'blue'; motion: Motion };
	export let gridPoints: Record<string, { x: number; y: number }>;

	let svgPath = '';
	let transform = '';
	let x = 0;
	let y = 0;
	let rotAngleManager: PropRotAngleManager | null = null;

	// Update position and rotation
	function updatePosition(): void {
		const { motion } = propDict;

		if (!motion || !motion.endLoc) {
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

	function getSvgPath(): string {
		const basePath = '/images/props/';
		return `${basePath}${propDict.propType}.svg`;
	}

	onMount(() => {
		rotAngleManager = new PropRotAngleManager({
			location: propDict.motion.endLoc,
			orientation: propDict.motion.endOri
		});
		updatePosition();
		svgPath = getSvgPath();
	});

	$: if (propDict.motion) {
		updatePosition();
	}
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
