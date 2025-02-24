<script lang="ts">
	import { onMount } from 'svelte';
	import { get, writable, type Writable } from 'svelte/store';
	import type { PictographData } from '$lib/types/PictographData.js';
	import { PictographInitializer } from './PictographInitializer';
	import type { PropData } from '../objects/Prop/PropData';
	import type { ArrowData } from '../objects/Arrow/ArrowData';
	import Prop from '../objects/Prop/Prop.svelte';
	import Arrow from '../objects/Arrow/Arrow.svelte';
	import Grid from '../objects/Grid/Grid.svelte';
	import TKAGlyph from './../objects/Glyphs/TKAGlyph/TKAGlyph.svelte';

	export let pictographData: PictographData | Writable<PictographData>;
	export const onClick: () => void = () => {};

	let redProp: PropData | null = null;
	let blueProp: PropData | null = null;
	let redArrow: ArrowData | null = null;
	let blueArrow: ArrowData | null = null;

	let pictographDataStore: Writable<PictographData>;

	if ('subscribe' in pictographData) {
		pictographDataStore = pictographData as Writable<PictographData>;
	} else {
		pictographDataStore = writable(pictographData);
	}

	let initializer = new PictographInitializer(pictographDataStore);
	let elements = initializer.elements;

	// Ensure we wait for initialization
	onMount(async () => {
		await initializer.initialize(); // ✅ Wait until it's done
		console.log('🟢 Initialization Complete. Now retrieving props and arrows.');

		// ✅ Ensure we get the updated store values
		redProp = get(get(elements).redPropData);
		blueProp = get(get(elements).bluePropData);
		redArrow = get(get(elements).redArrowData);
		blueArrow = get(get(elements).blueArrowData);

		console.log('🧐 Props:', { redProp, blueProp });
		console.log('🧐 Arrows:', { redArrow, blueArrow });
	});
	$: {
		if (get(elements)) {
			redProp = get(get(elements).redPropData);
			blueProp = get(get(elements).bluePropData);
			redArrow = get(get(elements).redArrowData);
			blueArrow = get(get(elements).blueArrowData);
		}
	}
</script>

<svg class="pictograph" viewBox="0 0 950 950" xmlns="http://www.w3.org/2000/svg" role="img">
	<Grid
		gridMode={get(pictographDataStore)?.gridMode || 'diamond'}
		onPointsReady={(data) => {
			elements.update((els) => {
				els.gridData.set(data);
				return els;
			});
		}}
	/>
	<TKAGlyph letter={get(pictographDataStore).letter} turnsTuple="(s, 0, 0)" x={50} y={800} />

	{#if redProp}
		<Prop propData={redProp} />
	{/if}
	{#if blueProp}
		<Prop propData={blueProp} />
	{/if}

	{#if redArrow}
		<Arrow arrowData={redArrow} />
	{/if}
	{#if blueArrow}
		<Arrow arrowData={blueArrow} />
	{/if}
</svg>

<style>
	.pictograph {
		width: 100%;
		height: 100%;
		max-width: 100%;
		max-height: 100%;
		display: flex;
		flex: 1;
		background-color: white;
		cursor: pointer;
		transition: transform 0.1s;
		transform: scale(1);
		z-index: 1;
		position: relative;
		border: 1px solid black;
		aspect-ratio: 1;
		margin: auto;
		overflow: visible;
		transform-origin: center center;
	}

	.pictograph:hover {
		transform: scale(1.1);
		z-index: 4;
		border: 4px solid gold;
	}

	.pictograph:active {
		transform: scale(1);
	}
</style>
