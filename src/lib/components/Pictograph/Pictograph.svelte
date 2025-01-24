<script lang="ts">
	import type { PictographInterface } from '$lib/types/PictographInterface';
	import type { GridData } from './Grid/GridInterface';
	import type { PropInterface } from './Prop/PropInterface';
	import type { ArrowInterface } from './Arrow/ArrowInterface';
	import { Motion } from './Motion/Motion';
	import { createPropData } from './PropFactory';
	import { get, writable, type Writable } from 'svelte/store';
	import { onMount, tick } from 'svelte';
	import { PictographChecker } from './PictographChecker';
	import { PropPlacementManager } from './Prop/PropPlacementManager/PropPlacementManager';
	import { createArrowData } from './Arrow/ArrowFactory';
	import { ArrowPlacementManager } from './Arrow/ArrowPlacementManager/ArrowPlacementManager';
	import Grid from './Grid/Grid.svelte';
	import Arrow from './Arrow/Arrow.svelte';
	import Prop from './Prop/Prop.svelte';
	import { PictographGetter } from './PictographGetter';
	import TKAGlyph from './TKAGlyph/TKAGlyph.svelte';

	export let pictographData: PictographInterface;
	export const onClick: () => void = () => {};

	let gridData: GridData | null = null;
	let checker = new PictographChecker(pictographData);
	let getter = new PictographGetter(pictographData);
	let propPlacementManager: PropPlacementManager | null = null;
	let arrowPlacementManager: ArrowPlacementManager | null = null;

	let redPropData: Writable<PropInterface> = writable();
	let bluePropData: Writable<PropInterface> = writable();

	let redArrowData: Writable<ArrowInterface> = writable();
	let blueArrowData: Writable<ArrowInterface> = writable();

	$: if (
		gridData?.centerPoint?.coordinates &&
		pictographData?.redMotionData &&
		pictographData?.blueMotionData
	) {
		(async () => {
			try {
				propPlacementManager = new PropPlacementManager(pictographData, gridData, checker);
				arrowPlacementManager = new ArrowPlacementManager(pictographData, gridData, checker);

				await tick();

				if (pictographData.redMotionData && pictographData.blueMotionData) {
					const redMotion = new Motion(pictographData, pictographData.redMotionData);
					const blueMotion = new Motion(pictographData, pictographData.blueMotionData);
					const redProp = createPropData(redMotion);
					const blueProp = createPropData(blueMotion);
					const redArrow = createArrowData(redMotion, getter);
					const blueArrow = createArrowData(blueMotion, getter);

					redPropData.set(redProp);
					bluePropData.set(blueProp);
					redArrowData.set(redArrow);
					blueArrowData.set(blueArrow);
				} else {
					throw new Error('Motion data is null');
				}
			} catch (error) {
				console.error('Prop initialization error:', error);
			}
		})();
	}
	$: if (propPlacementManager && $redPropData && $bluePropData) {
		const props: PropInterface[] = [$redPropData, $bluePropData];
		propPlacementManager.updatePropPlacement(props);
	}

	$: if (arrowPlacementManager && $redArrowData && $blueArrowData) {
		arrowPlacementManager.updateArrowPlacements([$redArrowData, $blueArrowData]);
	}
</script>

<svg class="pictograph" viewBox="0 0 950 950" xmlns="http://www.w3.org/2000/svg" role="img">
	<Grid
		gridMode={pictographData?.gridMode || 'diamond'}
		onPointsReady={(data) => {
			gridData = data;
		}}
	/>
	<TKAGlyph letter={pictographData.letter} turnsTuple="(s, 0, 0)" x={50} y={850} />

	{#if $redPropData?.coords?.x !== undefined && $bluePropData?.coords?.x !== undefined}
		<Prop propData={$redPropData} />
		<Prop propData={$bluePropData} />
	{/if}
	{#if $redArrowData?.coords?.x !== undefined && $blueArrowData?.coords?.x !== undefined}
		<Arrow arrowData={$redArrowData} />
		<Arrow arrowData={$blueArrowData} />
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
		outline: 1px solid black;
		aspect-ratio: 1;
		margin: auto;
		overflow: visible;
		transform-origin: center center;
	}

	.pictograph:hover {
		transform: scale(1.1);
		z-index: 4;
		outline: 4px solid gold;
	}

	.pictograph:active {
		transform: scale(1);
	}
</style>
