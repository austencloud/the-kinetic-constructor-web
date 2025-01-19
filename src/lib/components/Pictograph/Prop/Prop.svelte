<script lang="ts">
	import { onMount } from 'svelte';
	import type { PropType, Orientation, Location } from './PropTypes';
	import type { Motion } from '../Motion/Motion';
	import PropRotAngleManager from './PropRotAngleManager';

	export let propType: PropType = 'staff';
	export let color: 'red' | 'blue' = 'blue';
	export let loc: Location = 'n';
	export let ori: Orientation = 'in';
	export let size: { width: number; height: number } = { width: 50, height: 50 };
	export let motion: Motion | null = null;

	let svgPath = '';
	let transform = '';

	let rotAngleManager: PropRotAngleManager | null = null;

	function updateAttributes(attributes: Partial<{ loc: Location; ori: Orientation }>): void {
		if (attributes.loc) loc = attributes.loc;
		if (attributes.ori) ori = attributes.ori;
	}

	function getAttributes(): Record<string, any> {
		return { propType, color, loc, ori, size };
	}

	function swapOrientation(): void {
		const orientationMap: Record<Orientation, Orientation> = {
			in: 'out',
			out: 'in',
			clock: 'counter',
			counter: 'clock',
		};
		ori = orientationMap[ori];
	}

	function setZValueBasedOnColor(): number {
		return color === 'red' ? 5 : 4;
	}

	function getSvgPath(propType: string, color: 'red' | 'blue'): string {
		const basePath = '/images/props/';
		return `${basePath}${propType}.svg`;
	}

	function update(attributes: Partial<{ loc: Location; ori: Orientation; propType: PropType; color: string }>): void {
		updateAttributes(attributes);
		transform = `translate(${size.width / 2}px, ${size.height / 2}px) rotate(${rotAngleManager?.getRotationAngle() || 0}deg)`;
		svgPath = getSvgPath(propType, color);
	}

	onMount(() => {
		rotAngleManager = new PropRotAngleManager({ location: loc, orientation: ori });
		update({ propType, color, loc, ori });
	});

	$: if (motion) {
		update({ loc: motion.endLoc, ori: motion.endOri });
	}

	$: transform = `translate(${size.width / 2}px, ${size.height / 2}px) rotate(${rotAngleManager?.getRotationAngle() || 0}deg)`;
	$: svgPath = getSvgPath(propType, color);
</script>

<svg
	class="prop"
	style="transform: {transform}; width: {size.width}px; height: {size.height}px;"
	xmlns="http://www.w3.org/2000/svg"
>
	<use href={svgPath}></use>
</svg>

<style>
	.prop {
		transition: all 0.3s ease;
		position: absolute;
	}
</style>
