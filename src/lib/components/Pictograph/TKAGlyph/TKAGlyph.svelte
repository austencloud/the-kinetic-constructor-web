<!-- TkaGlyph.svelte -->
<script lang="ts">
	import { parseTurnsTupleString } from './Turns/parseTurnsTuple';
	import TkaLetter from './Letter/TKALetter.svelte';
	import TkaDash from './Dash/TKADash.svelte';
	import TKADotHandler from './Dot/TKADotHandler.svelte';
	import TkaTurnsNumberGroup from './Turns/TKATurnsNumberGroup.svelte';
	import type { DirRelation, PropRotDir, TkaTurns } from '../types/Types';
	import type { Letter } from '$lib/types/Letter';

	export let letter: Letter | null = null;
	export let turnsTuple: string = '';

	/** The position in the main <svg> scene */
	export let x: number = 0;
	export let y: number = 0;

	/** If you want to globally scale the entire glyph (like 1.0 is default, 1.5 is bigger) */
	export let scale: number = 1.0;

	// store direction + top/bottom
	let firstTupleItem: DirRelation | PropRotDir;
	let topTurn: TkaTurns = 0;
	let bottomTurn: TkaTurns = 0;

	$: {
		if (turnsTuple) {
			const [dir, top, bottom] = parseTurnsTupleString(turnsTuple);
			firstTupleItem = dir;
			topTurn = top;
			bottomTurn = bottom;
		}
	}
</script>

<g class="tka-glyph" transform={`translate(${x}, ${y}) scale(${scale})`}>
	<!-- The sub-components are each positioned relative to (0,0) inside this group -->
	<TkaLetter {letter} />
	<TkaDash {letter} />
	{#if typeof firstTupleItem === 'object' && 'dir' in firstTupleItem}
		<TKADotHandler {firstTupleItem} />
	{/if}
	<TkaTurnsNumberGroup topValue={topTurn} bottomValue={bottomTurn} />
</g>

