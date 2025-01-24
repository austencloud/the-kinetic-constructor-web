<!-- TkaLetter.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { LetterUtils } from '$lib/types/Letter';
	import type { Letter } from '$lib/types/Letter';
  
	export let letter: Letter | null = null;
  
	let letterSvgPath: string | null = null;
	let letterWidth = 50;  // if you want to control size
	let letterHeight = 50;
  
	onMount(() => {
	  if (letter) {
		// pick a path
		const type = LetterUtils.getLetterType(letter);
		letterSvgPath = computeLetterPath(letter, type);
	  }
	});
  
	function computeLetterPath(l: Letter, t: any): string {
	  // e.g. if Type1 => "Type1/A.svg"; else Type2 => "Type2/W.svg"
	  // For now, just return Type1
	  return `/images/letters_trimmed/Type1/${l}.svg`;
	}
  </script>
  
  <g class="tka-letter">
	{#if letterSvgPath}
	  <image
		class="letter-image"
		href={letterSvgPath}
		width={letterWidth}
		height={letterHeight}
		x={0}
		y={0}
	  />
	{/if}
  </g>
  
  <style>
  .tka-letter {
	/* If you want to shift the letter within the glyph local coords, do: transform="translate(10, 30)" here or in the parent. */
  }
  </style>
  