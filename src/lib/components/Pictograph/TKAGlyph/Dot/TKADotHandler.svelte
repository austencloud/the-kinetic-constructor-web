<!-- TkaDotHandler.svelte -->
<script lang="ts">
	import TkaDot from './TkaDot.svelte';
	import type { DirRelation, PropRotDir } from '../../types/Types';
	import {type Letter } from '$lib/types/Letter';
	import { createEventDispatcher } from 'svelte';

	export let direction: DirRelation | PropRotDir | null = null;
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
	let imageElement: SVGImageElement | null = null;
	const dispatch = createEventDispatcher();

	const padding = 10;
	let sameX = 0,
		sameY = 0;
	let oppX = 0,
		oppY = 0;
	let dotWidth = 12,
		dotHeight = 12;

	$: {
		// replicate python
		let centerX = letterRect.left + letterRect.width / 2;
		let top = letterRect.top;
		let bottom = letterRect.bottom;

		// same => top - padding
		sameX = centerX - dotWidth / 2;
		sameY = top - padding - dotHeight / 2;

		// opp => bottom + padding
		oppX = centerX - dotWidth / 2;
		oppY = bottom + padding - dotHeight / 2;
	}
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
	// $: canPlaceDot = letter && LetterType.getLetterType(letter) !== LetterType.Type1;
</script>

<g class="dot-handler">
	<!-- {#if canPlaceDot} -->
		<TkaDot visible={direction === 's'} x={sameX} y={sameY} />
		<TkaDot visible={direction === 'o'} x={oppX} y={oppY} />
	<!-- {/if} -->
</g>
