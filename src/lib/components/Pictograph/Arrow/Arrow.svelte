<script lang="ts">
	import ArrowUpdater from './ArrowUpdater';
	import ArrowLocationManager from './ArrowLocationManager';
	// Props
	export let color: string = 'blue';
	export let position: { x: number; y: number } = { x: 0, y: 0 };
	export let rotation: number = 0;
	export let mirrored: boolean = false;
	export let motion: {
		startLoc: string;
		endLoc: string;
		type: 'pro' | 'anti' | 'dash' | 'static';
		propRotDir?: string;
	} = { startLoc: '', endLoc: '', type: 'static' };
	export let pictograph: any;
	let arrowProps = { color, position, rotation, mirrored, motion };
	// Managers
	let arrowUpdater = new ArrowUpdater({ color, position, rotation, mirrored, motion });

	// Reactive Properties
	let svgStyles = { backgroundColor: color };
	let svgPath = '';
	$: {
		const updateResult = arrowUpdater.updateArrow();
		svgStyles = updateResult.svgStyles || svgStyles;
		mirrored = updateResult.mirrored ?? mirrored;
		svgPath = updateResult.svgPath; // Centralized SVG path
	}

	let transform: string;
	$: {
		transform = `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${mirrored ? -1 : 1}, 1)`;
	}
	let arrowLocationManager = new ArrowLocationManager({ arrowProps, pictograph });
	$: {
		arrowLocationManager.updateLocation();
		const updateResult = arrowUpdater.updateArrow();
		svgStyles = updateResult.svgStyles || svgStyles;
		mirrored = updateResult.mirrored ?? mirrored;
		svgPath = updateResult.svgPath; // Use SVG path from ArrowUpdater
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
	}
</style>
