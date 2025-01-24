<!-- TkaDash.svelte -->
<script lang="ts">
	import type { Letter } from '$lib/types/Letter';
	export let letter: Letter | null = null;
  
	// Show if letter includes '-'
	const hasDash = letter ? letter.includes('-') : false;
  
	let dashPath = '/images/dash.svg';
  
	// We'll place it at x=60 if letter is 50 wide
	let dashX = 60;
	let dashY = 10;
  </script>
  
  <g class="tka-dash" opacity={hasDash ? 1 : 0}>
	<image href={dashPath} width="20" height="20" x={dashX} y={dashY} />
  </g>
  