<script lang="ts">
	import { popIn } from '$lib/transitions/popIn';

	// Define props using Svelte 5 runes syntax
	const { text, position = 'top-left', animationDuration = 200, fontSize = 100 } = $props();

	// Calculate position based on the option using $derived instead of $:
	const x = $derived(position === 'top-left' ? 50 : 900);
	const y = $derived(50); // Always at the top
	const textAnchor = $derived(position === 'top-left' ? 'start' : 'end');
</script>

<g in:popIn={{ duration: animationDuration, start: 0.85, opacity: 0.2 }}>
	<text
		{x}
		{y}
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
		{x}
		{y}
		dominant-baseline="hanging"
		text-anchor={textAnchor}
		font-size={fontSize}
		font-weight="bold"
		fill="#000"
	>
		{text}
	</text>
</g>
