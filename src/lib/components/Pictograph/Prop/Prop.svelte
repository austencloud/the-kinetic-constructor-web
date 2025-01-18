<script lang="ts">
	import { onMount } from 'svelte';
	import type { PropType, Orientation, Location } from './PropTypes';
	import PropAttrManager from './PropAttrManager';
	import PropChecker from './PropChecker';
	import PropRotAngleManager from './PropRotAngleManager';
	import PropUpdater from './PropUpdater';
	import PropSvgManager from './PropSvgManager';
	import type { Motion } from '../Motion/Motion';

	export let propType: PropType = 'hand';
	export let color: 'red' | 'blue' = 'blue';
	export let loc: Location = 'n';
	export let ori: Orientation = 'in';
	export let size: { width: number; height: number } = { width: 50, height: 50 };
	export let motion: Motion | null = null; // Add motion as a prop

	let svgPath = '';
	let transform = '';

	let attrManager: PropAttrManager;
	let checker: PropChecker;
	let rotAngleManager: PropRotAngleManager;
	let updater: PropUpdater;
	let svgManager: PropSvgManager;

	onMount(() => {
		attrManager = new PropAttrManager({
			propType,
			color,
			loc: loc,
			ori: ori,
			size
		});
		checker = new PropChecker(attrManager);
		rotAngleManager = new PropRotAngleManager(attrManager);
		updater = new PropUpdater(attrManager, rotAngleManager, svgManager);
		svgManager = new PropSvgManager();
	});

	$: {
		transform = `translate(${size.width / 2}px, ${size.height / 2}px) rotate(${rotAngleManager.getRotationAngle()}deg)`;
		svgPath = svgManager.getSvgPath(propType, color);
	}
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
