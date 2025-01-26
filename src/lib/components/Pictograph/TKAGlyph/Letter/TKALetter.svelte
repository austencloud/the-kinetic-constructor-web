<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type { Letter } from '$lib/types/Letter';
	import { safeAsciiName } from '$lib/types/safeAsciiName';
	import { LetterType } from '$lib/types/LetterType';

	const dispatch = createEventDispatcher();

	export let letter: Letter | null = null;

	let letterFilePath: string | null = null;
	let svgWidth = 0;
	let svgHeight = 0;
	let imageElement: SVGImageElement | null = null;

	onMount(async () => {
		if (!letter) return;

		let folderName = 'Type1';
		const letterType = LetterType.getLetterType(letter);
		if (letterType) {
			folderName = letterType.folderName;
		}
		if (letterType) {
			// Special case: Use Type2 folder for dashed variants
			folderName = letterType === LetterType.Type3 ? 'Type2' : letterType.folderName;
			folderName = letterType === LetterType.Type5 ? 'Type4' : letterType.folderName;
		}
		if (letter?.toString().match(/[ΩθΣΔ]-/)) {
			folderName = 'Type2';
		}

		const asciiName = safeAsciiName(letter);
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
			svgWidth = 100;
			svgHeight = 100;
		} else {
			const [, minX, minY, w, h] = viewBoxMatch;
			svgWidth = parseFloat(w);
			svgHeight = parseFloat(h);
		}
	});

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
