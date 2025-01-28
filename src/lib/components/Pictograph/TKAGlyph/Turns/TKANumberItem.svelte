<script lang="ts">
	import { onMount } from 'svelte';
	import type { TKATurns } from '../../../../types/Types';

	export let value: TKATurns = 0;
	export let x: number = 0;
	export let y: number = 0;

	let numberPath = '';
	let numberWidth = 0;
	let numberHeight = 0;

	$: {
		numberPath = getNumberPath(value);
		if (numberPath) loadNumberDimensions();
	}

	function getNumberPath(turns: TKATurns): string {
		if (turns === 'fl') return '/images/numbers/float.svg';
		if (typeof turns === 'number' && turns > 0) return `/images/numbers/${turns}.svg`;
		return '';
	}

	async function loadNumberDimensions() {
		const response = await fetch(numberPath);
		const svgText = await response.text();
		const viewBoxMatch = svgText.match(/viewBox="\d+ \d+ (\d+) (\d+)"/);
		
		if (viewBoxMatch) {
			numberWidth = parseInt(viewBoxMatch[1]);
			numberHeight = parseInt(viewBoxMatch[2]);
		}
	}
</script>

<g transform={`translate(${x}, ${y})`} opacity={numberPath ? 1 : 0}>
	{#if numberWidth && numberHeight}
		<image
			href={numberPath}
			width={numberWidth}
			height={numberHeight}
		/>
	{/if}
</g>