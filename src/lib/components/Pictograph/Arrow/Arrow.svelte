<script lang="ts">
	import ArrowUpdater from './ArrowUpdater';
	import ArrowLocationManager from './ArrowLocationManager';
	import type { Motion } from '../Motion/Motion';

	// Props
	export let motion: Motion; // Associated motion instance
	export let color: 'blue' | 'red' = 'blue';
	export let position: { x: number; y: number } = { x: 0, y: 0 };
	export let rotation: number = 0;
	export let mirrored: boolean = false;

	let arrowUpdater: ArrowUpdater;
	let arrowLocationManager: ArrowLocationManager;

	// Explicitly type `svgStyles` to match 'blue' | 'red'
	let svgStyles: { backgroundColor: 'blue' | 'red' } = { backgroundColor: color };
	let svgPath = '';
	let transform: string;

	// Initialize managers
	arrowUpdater = new ArrowUpdater({ color, position, rotation, mirrored, motion });
	arrowLocationManager = new ArrowLocationManager({
		arrowProps: { color, position, rotation, mirrored },
		motion
	});

	// Reactive updates
	$: {
		const updateResult = arrowUpdater.updateArrow();
		// Safely cast or enforce that `backgroundColor` stays within 'blue' | 'red'
		svgStyles = {
			backgroundColor: (updateResult.svgStyles?.backgroundColor as 'blue' | 'red') || color
		};
		mirrored = updateResult.mirrored ?? mirrored;
		svgPath = updateResult.svgPath || '';
		transform = `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${
			mirrored ? -1 : 1
		}, 1)`;
	}
</script>

<img
	src={svgPath}
	alt="Arrow"
	class="arrow"
	style="transform: {transform}; background-color: {svgStyles.backgroundColor};"
/>

<style>
	.arrow {
		position: absolute;
		width: 50px;
		height: auto;
		transform-origin: center center;
		transition: all 0.3s ease;
	}
</style>
