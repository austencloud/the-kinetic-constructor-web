<script lang="ts">
	import { onMount } from 'svelte';
	import type { Letter } from '$lib/types/Letter';
	
	export let letter: Letter | null = null;
	export let letterRect: DOMRect;
  
	let dashPath = '/images/dash.svg';
	let dashVisible = false;
	let dashX = 0;
	let dashY = 0;
	let dashWidth = 0;
	let dashHeight = 0;
	const padding = 5;

	onMount(async () => {
		const response = await fetch(dashPath);
		const svgText = await response.text();
		const viewBoxMatch = svgText.match(/viewBox="\d+ \d+ (\d+) (\d+)"/);
		
		if (viewBoxMatch) {
			dashWidth = parseInt(viewBoxMatch[1]);
			dashHeight = parseInt(viewBoxMatch[2]);
		}
	});

	$: dashVisible = letter?.includes('-') ?? false;
	$: {
		if (letterRect) {
			const centerY = letterRect.top + letterRect.height / 2;
			dashX = letterRect.right + padding;
			dashY = centerY - dashHeight / 2;
		}
	}
</script>

<g class="tka-dash" opacity={dashVisible ? 1 : 0}>
	{#if dashWidth && dashHeight}
		<image
			href={dashPath}
			width={dashWidth}
			height={dashHeight}
			x={dashX}
			y={dashY}
		/>
	{/if}
</g>