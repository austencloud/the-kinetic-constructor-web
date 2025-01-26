<script lang="ts">
	import { onMount } from 'svelte';

	export let visible: boolean = false;
	export let x: number = 0;
	export let y: number = 0;

	let dotPath = '/images/same_opp_dot.svg';
	let dotWidth = 0;
	let dotHeight = 0;
	let transform = `translate(${x}, ${y})`;
	$: transform = `translate(${x}, ${y})`;
	onMount(async () => {
		const response = await fetch(dotPath);
		const svgText = await response.text();
		const viewBoxMatch = svgText.match(/viewBox="\d+ \d+ (\d+) (\d+)"/);

		if (viewBoxMatch) {
			dotWidth = parseInt(viewBoxMatch[1]);
			dotHeight = parseInt(viewBoxMatch[2]);
		}
	});
</script>

<g class="tka-dot" {transform} opacity={visible ? 1 : 0}>
	{#if dotWidth && dotHeight}
		<image
			href={dotPath}
			width={dotWidth}
			height={dotHeight}
			x={-dotWidth / 2}
			y={-dotHeight / 2}
		/>
	{/if}
</g>

<style>
	.tka-dot image {
		transform-box: fill-box;
		transform-origin: center;
	}
</style>
