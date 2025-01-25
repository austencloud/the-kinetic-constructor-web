<!-- TkaLetter.svelte -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type { Letter } from '$lib/types/Letter';
	import { safeAsciiName } from '$lib/types/safeAsciiName';
	import { LetterType } from '$lib/types/LetterType';

	const dispatch = createEventDispatcher();

	export let letter: Letter | null = null;

	// We'll store the actual file URL
	let letterFilePath: string | null = null;

	// We'll keep track of the numeric width/height from the letter’s viewBox
	let svgWidth = 0;
	let svgHeight = 0;

	// We'll keep a reference to the <image> so we can do getBBox() if desired
	let imageElement: SVGImageElement | null = null;

	onMount(async () => {
		if (!letter) return;

		// Suppose Type1 is for ASCII letters, Type2 is for Greek, Type3 is for Greek-dash, etc.
		// We can figure out the folder by checking the letter’s type or do your own logic.
		// For example:
		//   import { LetterType } from './Letter';
		//   let letterType = LetterType.getLetterType(letter);
		//   let folderName = pickFolder(letterType); // "Type1"/"Type2"/...

		// For simplicity:
		let folderName = 'Type1'; // Default
		const letterType = LetterType.getLetterType(letter);
		if (letterType) {
			folderName = letterType.folderName;
		}
		// or you can do a function: folderName = getFolderByLetter(letter);
		// or store the folder in your renameMap.

		const asciiName = safeAsciiName(letter); // e.g. "OmegaDash"
		letterFilePath = `/images/letters_trimmed/${folderName}/${asciiName}.svg`;

		const resp = await fetch(letterFilePath);
		if (!resp.ok) {
			console.error(`Failed to load letter from ${letterFilePath}`);
			return;
		}
		const svgText = await resp.text();

		const viewBoxMatch = svgText.match(
			/viewBox\s*=\s*"([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)"/i
		);
		if (!viewBoxMatch) {
			console.warn('Could not parse viewBox, defaulting 100×100.');
			svgWidth = 100;
			svgHeight = 100;
		} else {
			const [, minX, minY, w, h] = viewBoxMatch;
			svgWidth = parseFloat(w);
			svgHeight = parseFloat(h);
		}
	});

	/**
	 * Once <image> is rendered with width=svgWidth, height=svgHeight,
	 * we can measure getBBox() if you want to dispatch that bounding box upward.
	 */
	function handleImageLoad() {
		if (!imageElement) return;
		const bbox = imageElement.getBBox();
		dispatch('letterBBox', {
			left: bbox.x,
			top: bbox.y,
			width: bbox.width,
			height: bbox.height,
			right: bbox.x + bbox.width,
			bottom: bbox.y + bbox.height
		});
	}
</script>

<g class="tka-letter">
	{#if letterFilePath}
		<!-- 
		Use svgWidth / svgHeight in user units for the <image>. 
		No "height: 100" or similar. Now it matches the letter’s viewBox dimension. 
	  -->
		<image
			bind:this={imageElement}
			href={letterFilePath}
			width={svgWidth}
			height={svgHeight}
			preserveAspectRatio="xMinYMin meet"
			on:load={handleImageLoad}
		/>
	{/if}
</g>
