<!-- TkaDash.svelte -->
<script lang="ts">
	import type { Letter } from '$lib/types/Letter';
	export let letter: Letter | null = null;
	export let letterRect: {left: number, right: number, top: number, bottom: number, width: number, height: number};
  
	let dashPath = '/images/dash.svg';
	let dashVisible = false;
	let dashX = 0;
	let dashY = 0;
	let dashWidth = 20;
	let dashHeight = 20;
	const padding = 5;
  
	$: dashVisible = letter ? letter.includes('-') : false;
  
	// replicate python logic: x = letterRect.right + 5, y = letterRect.centerY - dashHeight/2
	$: {
	  let centerY = letterRect.top + letterRect.height / 2;
	  dashX = letterRect.right + padding;
	  dashY = centerY - dashHeight / 2;
	}
  </script>
  
  <g class="tka-dash" opacity={dashVisible ? 1 : 0} transform={`translate(${dashX}, ${dashY})`}>
	<image href={dashPath} width={dashWidth} height={dashHeight} />
  </g>
  