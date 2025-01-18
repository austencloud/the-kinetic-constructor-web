<script lang="ts">
	import { onMount } from 'svelte';
	import type { PropType, Orientation, Location } from './PropTypes';
	import type { Motion } from '../Motion/Motion';
	import PropAttrManager from './PropAttrManager';
	import PropChecker from './PropChecker';
	import PropRotAngleManager from './PropRotAngleManager';
	import PropUpdater from './PropUpdater';
	import PropSvgManager from './PropSvgManager';

	export let propType: PropType = 'hand';
	export let color: 'red' | 'blue' = 'blue';
	export let loc: Location = 'n';
	export let ori: Orientation = 'in';
	export let size: { width: number; height: number } = { width: 50, height: 50 };
	export let motion: Motion | null = null; // Motion instance bound to this Prop

	let svgPath = '';
	let transform = '';

	let attrManager: PropAttrManager | null = null;
	let checker: PropChecker | null = null;
	let rotAngleManager: PropRotAngleManager | null = null;
	let updater: PropUpdater | null = null;
	let svgManager: PropSvgManager | null = null;

	// Ensure all managers are initialized
	onMount(() => {
		attrManager = new PropAttrManager({
			propType,
			color,
			loc,
			ori,
			size
		});
		checker = new PropChecker(attrManager);
		rotAngleManager = new PropRotAngleManager(attrManager);
		svgManager = new PropSvgManager();
		updater = new PropUpdater(attrManager, rotAngleManager, svgManager);
	});

	// Reactive transform update with nullish checks
	$: {
		transform =
			rotAngleManager && typeof rotAngleManager.getRotationAngle === 'function'
				? `translate(${size.width / 2}px, ${size.height / 2}px) rotate(${rotAngleManager.getRotationAngle()}deg)`
				: `translate(${size.width / 2}px, ${size.height / 2}px)`;
	}

	// Reactive SVG path update with nullish checks
	$: {
		svgPath = svgManager?.getSvgPath(propType, color) || '';
	}

	// React to motion updates if motion is bound
	$: {
		if (motion) {
			loc = motion.endLoc; // Update the location based on the motion
			ori = motion.endOri; // Update the orientation based on the motion
		}
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
