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
	import { PictographManagers } from './PictographManagers';
	import { createPictographElements } from './PictographElements';

	export let pictographDataStore: Writable<PictographData>;
	export const onClick: () => void = () => {};

	let pictographManagers = new PictographManagers(pictographDataStore);

	let initializer = new PictographInitializer(pictographDataStore);
	let elements = initializer.elements;

	let redProp: PropData | null = null;
	let blueProp: PropData | null = null;
	let redArrow: ArrowData | null = null;
	let blueArrow: ArrowData | null = null;

	onMount(async () => {
		await initializer.initialize();
		console.log('🟢 Initialization Complete.');

		redProp = get(get(elements).redPropData);
		blueProp = get(get(elements).bluePropData);
		redArrow = get(get(elements).redArrowData);
		blueArrow = get(get(elements).blueArrowData);

		// ✅ Ensure initial placement
		updatePlacements();
	});

	$: {
		if (redProp && blueProp && redArrow && blueArrow) {
			console.log('🔄 Props & Arrows changed. Updating placements...');
			updatePlacements();
		}
	}

	function updatePlacements() {
		if (pictographManagers.propPlacementManager && pictographManagers.arrowPlacementManager) {
			pictographManagers.propPlacementManager.updatePropPlacement([redProp!, blueProp!]);
			pictographManagers.arrowPlacementManager.updateArrowPlacements([redArrow!, blueArrow!]);
			console.log('✅ Props & Arrows repositioned');
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
