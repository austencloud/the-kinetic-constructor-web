<script lang="ts">
	import { onMount } from 'svelte';
	import type { Letter } from '$lib/types/Letter';
	
	export let letter: Letter | null = null;
	export let letterRect: any;
  
	let dashPath = '/images/dash.svg';
	let dashVisible = false;
	let dashX = 0;
	let dashY = 0;
	let dashWidth = 0;
	let dashHeight = 0;
	let dashLoaded = false;
	const padding = 5;

	onMount(async () => {
		try {
			const response = await fetch(dashPath);
			const svgText = await response.text();
			// More robust regex
			const viewBoxMatch = svgText.match(/viewBox="\s*[\d\.]+\s+[\d\.]+\s+([\d\.]+)\s+([\d\.]+)\s*"/i);
			
			if (viewBoxMatch) {
				dashWidth = parseFloat(viewBoxMatch[1]);
				dashHeight = parseFloat(viewBoxMatch[2]);
				dashLoaded = true;
				console.log('Dash SVG loaded with dimensions:', { dashWidth, dashHeight });
				updateDashPosition();
			} else {
				console.warn('Could not parse dash SVG viewBox');
			}
		} catch (error) {
			console.error('Error loading dash SVG:', error);
		}
	});

	// Whether to show the dash
	$: dashVisible = letter?.toString().includes('-') ?? false;
	
	// Update position when letterRect changes
	function updateDashPosition() {
		if (letterRect && dashWidth && dashHeight) {
			// Position dash vertically centered relative to the letter
			const centerY = letterRect.top + letterRect.height / 2;
			dashX = letterRect.right + padding;
			dashY = centerY - dashHeight / 2;
			
			console.log('Updated dash position:', {
				letterRect,
				dashPosition: { x: dashX, y: dashY }
			});
		}
	}
	
	// Reactive statement to update dash position when letterRect changes
	$: if (letterRect && dashLoaded) {
		updateDashPosition();
	}

	// Handle when dash image is loaded in the DOM
	function handleImageLoaded() {
		console.log('Dash image loaded in DOM');
	}
</script>

<g class="tka-dash" opacity={dashVisible ? 1 : 0}>
	{#if dashWidth && dashHeight && dashLoaded}
		<image
			href={dashPath}
			width={dashWidth}
			height={dashHeight}
			x={dashX}
			y={dashY}
			on:load={handleImageLoaded}
		/>
		
		<!-- Uncomment for debugging -->
		<!-- <rect 
			fill="none" 
			stroke="green" 
			stroke-width="1" 
			x={dashX} 
			y={dashY} 
			width={dashWidth} 
			height={dashHeight} 
		/> -->
	{/if}
</g>