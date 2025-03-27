<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';

	export let visible: boolean = false;
	export let x: number = 0;
	export let y: number = 0;

	const dispatch = createEventDispatcher();
	let dotPath = '/images/same_opp_dot.svg';
	let dotWidth = 0;
	let dotHeight = 0;
	let dotLoaded = false;
	let transform = `translate(${x}, ${y})`;
	
	// Update transform when position changes
	$: transform = `translate(${x}, ${y})`;
	
	// Log position for debugging
	$: {
		if (visible && x && y) {
			console.log(`Dot positioned at (${x}, ${y}), visible: ${visible}`);
		}
	}
	
	onMount(async () => {
		try {
			const response = await fetch(dotPath);
			const svgText = await response.text();
			
			// More robust regex pattern
			const viewBoxMatch = svgText.match(/viewBox="\s*[\d\.]+\s+[\d\.]+\s+([\d\.]+)\s+([\d\.]+)\s*"/i);

			if (viewBoxMatch) {
				dotWidth = parseFloat(viewBoxMatch[1]);
				dotHeight = parseFloat(viewBoxMatch[2]);
				console.log('Dot SVG loaded with dimensions:', { dotWidth, dotHeight });
				
				// Notify parent that dot is loaded with dimensions
				dispatch('dotLoaded', { width: dotWidth, height: dotHeight });
				dotLoaded = true;
			} else {
				console.warn('Could not parse dot SVG viewBox', svgText);
			}
		} catch (error) {
			console.error('Error loading dot SVG:', error);
		}
	});

	// Handle when dot image is loaded in the DOM
	function handleImageLoaded() {
		console.log('Dot image loaded in DOM');
	}
</script>

<g class="tka-dot" {transform} opacity={visible ? 1 : 0}>
	{#if dotWidth && dotHeight && dotLoaded}
		<image
			href={dotPath}
			width={dotWidth}
			height={dotHeight}
			x={-dotWidth / 2}
			y={-dotHeight / 2}
			on:load={handleImageLoaded}
		/>
		
		<!-- Uncomment for debugging -->
		<!-- <rect 
			fill="none" 
			stroke="blue" 
			stroke-width="1" 
			x={-dotWidth / 2} 
			y={-dotHeight / 2} 
			width={dotWidth} 
			height={dotHeight} 
		/> -->
	{/if}
</g>

<style>
	.tka-dot image {
		transform-box: fill-box;
		transform-origin: center;
	}
</style>