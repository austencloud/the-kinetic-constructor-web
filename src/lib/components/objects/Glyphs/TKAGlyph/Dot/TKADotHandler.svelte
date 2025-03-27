<script lang="ts">
	import { type Letter } from '$lib/types/Letter';
	import TKADot from './TKADot.svelte';
	import { LetterType } from '$lib/types/LetterType';
	import { onMount } from 'svelte';
	import type { DirRelation, PropRotDir } from '$lib/types/Types';

	export let dir: DirRelation | PropRotDir | null = null;

	export let letterRect = {
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		width: 0,
		height: 0
	};

	export let letter: Letter | null = null;

	// Dot placement configuration
	const padding = 20;
	let sameX = 0, sameY = 0;
	let oppX = 0, oppY = 0;
	let dotHeight = 20;  // Default height until actual is loaded
	let dotWidth = 20;   // Default width
	let dotsReady = false;
	
	// Load the dot dimensions as early as possible
	onMount(async () => {
		try {
			const response = await fetch('/images/same_opp_dot.svg');
			const svgText = await response.text();
			// More robust regex that handles whitespace variations
			const viewBoxMatch = svgText.match(/viewBox="\s*[\d\.]+\s+[\d\.]+\s+([\d\.]+)\s+([\d\.]+)\s*"/i);
			
			if (viewBoxMatch) {
				dotWidth = parseFloat(viewBoxMatch[1]);
				dotHeight = parseFloat(viewBoxMatch[2]);
				// Recalculate positions with the correct height
				updatePositions();
				dotsReady = true;
			}
		} catch (error) {
			console.error('Error loading dot dimensions:', error);
		}
	});
	
	// Function to calculate positions
	function updatePositions() {
		if (letterRect && letterRect.width > 0 && letterRect.height > 0) {
			// The center X position is relative to the letter's left edge
			const centerX = letterRect.left + letterRect.width / 2;
			
			// Position the dots - these positions are in the same coordinate system as the letter
			// The TKADot will apply its own transform, so we don't need to adjust for the glyph position
			sameX = centerX;
			sameY = letterRect.top - padding - (dotHeight / 2);
			
			oppX = centerX;
			oppY = letterRect.bottom + padding + (dotHeight / 2);

		}
	}
	
	// Update positions when letterRect changes
	$: if (letterRect && letterRect.width > 0) {
		updatePositions();
		dotsReady = true;
	}

	function handleDotLoaded(e: CustomEvent) {
		// Update dimensions if dot reports different size than expected
		if (e.detail && e.detail.width && e.detail.height) {
			if (dotWidth !== e.detail.width || dotHeight !== e.detail.height) {
				dotWidth = e.detail.width;
				dotHeight = e.detail.height;
				updatePositions();
			}
		}
	}

	$: canPlaceDot = letter && LetterType.getLetterType(letter) !== LetterType.Type1;
</script>

<g class="dot-handler">
	{#if canPlaceDot && dotsReady}
		<TKADot 
			visible={dir === 's'} 
			x={sameX} 
			y={sameY} 
			on:dotLoaded={handleDotLoaded} 
		/>
		<TKADot 
			visible={dir === 'o'} 
			x={oppX} 
			y={oppY} 
			on:dotLoaded={handleDotLoaded} 
		/>
	{/if}
</g>