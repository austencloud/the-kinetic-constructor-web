<script lang="ts">
	import ArrowUpdater from './ArrowUpdater';
	import ArrowLocationManager from './ArrowLocationManager';
	import type { ArrowInterface } from './ArrowInterface';
	import type { Motion } from '../Motion/Motion';
	import { onMount } from 'svelte';

	export let motion: Motion;

	let arrowData: ArrowInterface;
	let arrowUpdater: ArrowUpdater | null = null;
	let arrowLocationManager: ArrowLocationManager | null = null;
	let svgPath = '';
	let transform: string;

	// Initialize arrow data
	function initializeArrowData(): ArrowInterface {
		return {
			color: motion.color,
			position: { x: 0, y: 0 },
			rotation: 0,
			mirrored: false,
			motion
		};
	}

	onMount(() => {
		arrowData = initializeArrowData();
		arrowUpdater = new ArrowUpdater(arrowData);
		arrowLocationManager = new ArrowLocationManager({ arrowData });
	});

	// Reactive updates
	$: if (arrowUpdater) {
		const updateResult = arrowUpdater.updateArrow();
		svgPath = updateResult.svgPath || '';
		transform = `translate(${arrowData.position.x}px, ${arrowData.position.y}px) rotate(${arrowData.rotation}deg) scale(${
			arrowData.mirrored ? -1 : 1
		}, 1)`;
	}
</script>

<img src={svgPath} alt="Arrow" class="arrow" style="transform: {transform};" />

<style>
	.arrow {
		position: absolute;
		width: 50px;
		height: auto;
		transform-origin: center center;
		transition: all 0.3s ease;
	}
</style>
