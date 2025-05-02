<script lang="ts">
	import { fade } from 'svelte/transition';
	
	export let text: string;
	export let position: 'top-left' | 'top-right' = 'top-left';
	export let animationDuration = 300;
	export let fontSize = 100; // Default font size, will be scaled relative to SVG viewBox
	
	// Calculate position based on the option
	$: x = position === 'top-left' ? 50 : 900;
	$: y = 50; // Always at the top
	$: textAnchor = position === 'top-left' ? 'start' : 'end';
</script>

<g transition:fade={{ duration: animationDuration }}>
	<text
		x={x}
		y={y}
		dominant-baseline="hanging"
		text-anchor={textAnchor}
		font-size={fontSize}
		font-weight="bold"
		fill="#000"
		stroke="#fff"
		stroke-width="6"
		paint-order="stroke"
	>
		{text}
	</text>
	<text
		x={x}
		y={y}
		dominant-baseline="hanging"
		text-anchor={textAnchor}
		font-size={fontSize}
		font-weight="bold"
		fill="#000"
	>
		{text}
	</text>
</g>
