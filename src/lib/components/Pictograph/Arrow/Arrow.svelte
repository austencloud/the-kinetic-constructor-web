<script lang="ts">
	// Imports
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

	// Reactive Props
	let arrowProps = { color, position, rotation, mirrored, motion };

	// Managers
	let attrHandler = new ArrowAttrHandler(arrowProps); // Handles attributes
	let mirrorManager = new ArrowMirrorManager(arrowProps); // Handles mirroring
	let arrowUpdater = new ArrowUpdater(arrowProps); // Manages the full arrow update lifecycle
	let arrowLocationManager: ArrowLocationManager; // Manages location logic

	// Declare and initialize `svgStyles`
	let svgStyles = { backgroundColor: color }; // Fallback for background color

	// Reactive Logic
	$: {
		// Ensure attributes are updated when props change
		attrHandler.updateAttributes({ color, motion });
	}

	$: {
		// Update location whenever arrowProps or pictograph changes
		arrowLocationManager = new ArrowLocationManager({ arrowProps, pictograph });
		arrowLocationManager.updateLocation();
	}

	$: {
		// Update arrow appearance and other properties
		const updateResult = arrowUpdater.updateArrow();
		svgStyles = updateResult.svgStyles || svgStyles;
		mirrored = updateResult.mirrored ?? mirrored;
	}

	let transform: string;

	$: {
		// Compute the transform dynamically
		transform = `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${mirrored ? -1 : 1}, 1)`;
	}
</script>

<!-- Template -->
<div
	class="arrow"
	style="width: 50px; height: 10px; transform: {transform}; background-color: {svgStyles.backgroundColor};"
></div>

<style>
	.arrow {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: center center;
		border-radius: 5px;
	}
</style>
