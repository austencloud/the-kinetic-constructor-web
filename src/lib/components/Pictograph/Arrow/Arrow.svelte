<!-- Arrow.svelte -->
<script lang="ts">
	import ArrowUpdater from './ArrowUpdater';
	import ArrowLocationManager from './ArrowLocationManager';
	import type { ArrowInterface } from './ArrowInterface';
	import { onMount } from 'svelte';

	export let arrowData: ArrowInterface;

	let arrowUpdater: ArrowUpdater;
	let arrowLocationManager: ArrowLocationManager;
	let svgPath = '';
	let transform = '';

	onMount(() => {
		arrowUpdater = new ArrowUpdater(arrowData);
		arrowLocationManager = new ArrowLocationManager({ arrowData });
		updateArrow();
	});

	function updateArrow() {
		// First update location
		arrowLocationManager.updateLocation(arrowData.loc);
		
		const result = arrowUpdater.updateArrow();
		svgPath = result.svgPath;
		
		transform = `translate(${arrowData.coords.x}, ${arrowData.coords.y}) 
			rotate(${arrowData.rotation}) 
			scale(${arrowData.mirrored ? -1 : 1}, 1)`;
	}
</script>

{#if svgPath}
	<image
		href={svgPath}
		class="arrow"
		transform={transform}
		transform-origin="center"
	/>
{/if}

