<script lang="ts">
	import { parseTurnsTupleString } from './Turns/parseTurnsTuple';
	import type { Letter } from '$lib/types/Letter';
	import TKADash from './Dash/TKADash.svelte';
import TKALetter from './Letter/TKALetter.svelte';
	import TKADotHandler from './Dot/TKADotHandler.svelte';
	import TKATurnsNumberGroup from './Turns/TKATurnsNumberGroup.svelte';
	import type { DirRelation, PropRotDir, TKATurns } from '$lib/types/Types';

	export let letter: Letter | null = null;
	export let turnsTuple: string = '';

	export let x: number = 0;
	export let y: number = 0;

	let letterRect = new DOMRect();
	let firstTupleItem: DirRelation | PropRotDir | null = null;
	let topTurn: TKATurns = 0;
	let bottomTurn: TKATurns = 0;
	let glyphBBox = { x: 0, y: 0, width: 0, height: 0 };
	let glyphEl: SVGGElement | null = null;
	let letterLoaded = false; // Track when letter is loaded

	$: {
		if (turnsTuple) {
			const [dir, top, bottom] = parseTurnsTupleString(turnsTuple);
			firstTupleItem = dir ?? null;
			topTurn = top ?? 0;
			bottomTurn = bottom ?? 0;
		}
	}

	function handleLetterBBox(e: CustomEvent) {
		letterRect = e.detail;
		letterLoaded = true;
	}
</script>

<g class="tka-glyph" bind:this={glyphEl} transform={`translate(${x}, ${y})`}>
	<!-- Uncomment for debugging -->
	<!-- <rect
		fill="none"
		stroke="red"
		stroke-width="1"
		x={glyphBBox.x}
		y={glyphBBox.y}
		width={glyphBBox.width}
		height={glyphBBox.height}
	/> -->

	<TKALetter {letter} on:letterBBox={handleLetterBBox} />

	<!-- Only show dash and dots after letter is loaded with proper dimensions -->
	{#if letterLoaded}
		<TKADash {letter} {letterRect} />
		<TKADotHandler dir={firstTupleItem} {letterRect} {letter} />
		<TKATurnsNumberGroup topValue={topTurn} bottomValue={bottomTurn} {letterRect} />
	{/if}
</g>
