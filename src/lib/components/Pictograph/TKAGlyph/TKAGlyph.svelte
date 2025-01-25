<script lang="ts">
	import TkaLetter from './Letter/TkaLetter.svelte';
	import TkaDash from './Dash/TkaDash.svelte';
	import TkaDotHandler from './Dot/TkaDotHandler.svelte';
	import TkaTurnsNumberGroup from './Turns/TkaTurnsNumberGroup.svelte';

	import { parseTurnsTupleString } from './Turns/parseTurnsTuple';
	import type { Letter } from '$lib/types/Letter';
	import type { DirRelation, PropRotDir, TkaTurns } from '../types/Types';
	import { afterUpdate, onMount } from 'svelte';

	export let letter: Letter | null = null;
	export let turnsTuple: string = '';

	export let x: number = 0;
	export let y: number = 0;

	let letterRect = { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };

	let firstTupleItem: DirRelation | PropRotDir | null = null;
	let topTurn: TkaTurns = 0;
	let bottomTurn: TkaTurns = 0;
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
		letterRect = e.detail; // store the real bounding rect
	}
	// 2) We'll measure the <g> using getBBox() after each update
	onMount(() => {
		measureGlyph();
	});
	afterUpdate(() => {
		measureGlyph();
	});

	function measureGlyph() {
		if (!glyphEl) return;
		const bbox = glyphEl.getBBox(); // entire group bounding box
		glyphBBox = {
			x: bbox.x,
			y: bbox.y,
			width: bbox.width,
			height: bbox.height
		};
	}
</script>

<g class="tka-glyph" bind:this={glyphEl} transform={`translate(${x}, ${y})`}>
	<!-- The dynamic red rectangle follows the bounding box of the entire <g> -->
	<rect
		fill="none"
		stroke="red"
		stroke-width="1"
		x={glyphBBox.x}
		y={glyphBBox.y}
		width={glyphBBox.width}
		height={glyphBBox.height}
	/>
	<TkaLetter {letter} on:letterBBox={handleLetterBBox} />
	<TkaDash {letter} {letterRect} />
	<TkaDotHandler direction={firstTupleItem} {letterRect} {letter} />
	<TkaTurnsNumberGroup topValue={topTurn} bottomValue={bottomTurn} {letterRect} />
</g>

<style>
	.tka-glyph {
		border: 1px solid red;
	}
</style>
