<script lang="ts">
	import { onMount, createEventDispatcher, tick } from 'svelte';
	import type { Letter } from '$lib/types/Letter';
	import { safeAsciiName } from '$lib/types/safeAsciiName';
	import { LetterType } from '$lib/types/LetterType';

	const dispatch = createEventDispatcher();

	export let letter: Letter | null = null;

	let letterFilePath: string | null = null;
	let svgWidth = 0;
	let svgHeight = 0;
	let imageElement: SVGImageElement | null = null;
	let letterLoaded = false;

	onMount(async () => {
		if (!letter) return;

		let folderName = 'Type1';
		const letterType = LetterType.getLetterType(letter);

		if (letterType) {
			folderName = letterType.folderName;
			// Special case handling
			if (letterType === LetterType.Type3) folderName = 'Type2';
			if (letterType === LetterType.Type5) folderName = 'Type4';
		}
		
		// Another special case for dash letters
		if (letter?.toString().match(/[WXYZΩθΣΔ]-/)) {
			folderName = 'Type2';
		}

		const asciiName = safeAsciiName(letter);
		letterFilePath = `/images/letters_trimmed/${folderName}/${asciiName}.svg`;

		try {
			const resp = await fetch(letterFilePath);
			if (!resp.ok) {
				console.error(`Failed to load letter from ${letterFilePath}`, resp.status);
				return;
			}
			
			const svgText = await resp.text();
			// More robust regex for viewBox
			const viewBoxMatch = svgText.match(
				/viewBox\s*=\s*"([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)"/i
			);
			
			if (!viewBoxMatch) {
				console.warn('Could not parse letter SVG viewBox, using defaults');
				svgWidth = 100;
				svgHeight = 100;
			} else {
				const [, minX, minY, w, h] = viewBoxMatch;
				svgWidth = parseFloat(w);
				svgHeight = parseFloat(h);

			}
			
			letterLoaded = true;
		} catch (error) {
			console.error(`Error loading letter SVG:`, error);
		}
	});

	// Handle image onload to get actual rendered dimensions
	async function handleImageLoad() {
		if (!imageElement) {
			console.warn('Image element not available for getBBox');
			return;
		}
		
		// Wait a tick to ensure the SVG is rendered
		await tick();
		
		try {
			const bbox = imageElement.getBBox();
			const rect = {
				left: bbox.x,
				top: bbox.y,
				width: bbox.width,
				height: bbox.height,
				right: bbox.x + bbox.width,
				bottom: bbox.y + bbox.height
			};
			
			dispatch('letterBBox', rect);
		} catch (error) {
			console.error('Error getting letter bounding box:', error);
		}
	}
</script>

<g class="tka-letter">
	{#if letterFilePath && letterLoaded}
		<image
			bind:this={imageElement}
			href={letterFilePath}
			width={svgWidth}
			height={svgHeight}
			preserveAspectRatio="xMinYMin meet"
			on:load={handleImageLoad}
		/>
		
		<!-- Uncomment for debugging -->
		<!-- {#if imageElement}
			<rect 
				fill="none" 
				stroke="purple" 
				stroke-width="1" 
				x={imageElement.getBBox?.().x || 0}
				y={imageElement.getBBox?.().y || 0}
				width={imageElement.getBBox?.().width || svgWidth}
				height={imageElement.getBBox?.().height || svgHeight}
			/>
		{/if} -->
	{/if}
</g>