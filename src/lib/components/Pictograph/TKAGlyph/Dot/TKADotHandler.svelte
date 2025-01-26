<!-- TkaDotHandler.svelte -->
<script lang="ts">
	import type { DirRelation, PropRotDir } from '../../types/Types';
	import { type Letter } from '$lib/types/Letter';
	import { createEventDispatcher } from 'svelte';
	import TKADot from './TKADot.svelte';
	import { LetterType } from '$lib/types/LetterType';

	export let dir: DirRelation | PropRotDir | null = null;
	// TkaDotHandler.svelte
	export let letterRect = {
		left: 0,
		right: 0,
		top: 0, // Add this
		bottom: 0, // And this
		width: 0,
		height: 0
	};

	export let letter: Letter | null = null;

	const padding = 20;
	let sameX = 0,
		sameY = 0;
	let oppX = 0,
		oppY = 0;
	let dotHeight = 0;

	$: {
		if (letterRect) {
			// Calculate positions relative to parent translation
			const centerX = letterRect.left + letterRect.width / 2;
			
			// Same dot positioning
			sameX = centerX;
			sameY = letterRect.top - padding - (dotHeight / 2);
			
			// Opp dot positioning
			oppX = centerX;
			oppY = letterRect.bottom + padding - (dotHeight / 2);
		}
	}

	$: canPlaceDot = letter && LetterType.getLetterType(letter) !== LetterType.Type1;
</script>

<g class="dot-handler">
	{#if canPlaceDot}
		<TKADot visible={dir === 's'} x={sameX} y={sameY} />
		<TKADot visible={dir === 'o'} x={oppX} y={oppY} />
	{/if}
</g>
