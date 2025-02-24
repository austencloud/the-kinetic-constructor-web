<script lang="ts">
	import { parseTurnsTupleString } from './Turns/parseTurnsTuple';
	import type { Letter } from '$lib/types/Letter';
	import type { DirRelation, PropRotDir, TKATurns } from '../../../types/Types';
	import TKADash from './Dash/TKADash.svelte';
	import TKALetter from './Letter/TKALetter.svelte';
	import TKADotHandler from './Dot/TKADotHandler.svelte';
	import TKATurnsNumberGroup from './Turns/TKATurnsNumberGroup.svelte';


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
	}

</script>

<g class="tka-glyph" bind:this={glyphEl} transform={`translate(${x}, ${y})`}>
	<rect
		fill="none"
		stroke="red"
		stroke-width="1"
		x={glyphBBox.x}
		y={glyphBBox.y}
		width={glyphBBox.width}
		height={glyphBBox.height}
	/>
	<TKALetter {letter} on:letterBBox={handleLetterBBox} />
	<TKADash {letter} {letterRect} />
	<TKADotHandler dir={firstTupleItem} {letterRect} {letter} />
	<TKATurnsNumberGroup topValue={topTurn} bottomValue={bottomTurn} {letterRect} />
</g>
