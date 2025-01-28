<script lang="ts">
	import type { PictographData as PictographData } from '$lib/types/PictographData';
	import type { PropData } from './Prop/PropData';
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
	import ArrowLocationManager from './Arrow/ArrowLocationManager/ArrowLocationManager';
	import ArrowRotAngleManager from './Arrow/ArrowRotAngleManager/ArrowRotAngleManager';
	import type { GridData } from './Grid/GridData';
	import type { ArrowData } from './Arrow/ArrowData';

	export let pictographData: PictographData;
	export const onClick: () => void = () => {};

	let gridData: GridData | null = null;
	let checker = new PictographChecker(pictographData);
	let getter = new PictographGetter(pictographData);
	let propPlacementManager: PropPlacementManager | null = null;
	let arrowPlacementManager: ArrowPlacementManager | null = null;

	let redPropData: Writable<PropData> = writable();
	let bluePropData: Writable<PropData> = writable();

	let redArrowData: Writable<ArrowData> = writable();
	let blueArrowData: Writable<ArrowData> = writable();
	let initializationComplete = false;

	async function initializeAll() {
		try {
			if (!pictographData.letter) {
				return;
			}

			while (!gridData?.centerPoint?.coordinates) await tick();

			const redMotion = new Motion(pictographData, pictographData.redMotionData!);
			const blueMotion = new Motion(pictographData, pictographData.blueMotionData!);

			await Promise.all([redMotion.ready, blueMotion.ready]);

			const [redProp, blueProp] = await Promise.all([
				createPropData(redMotion),
				createPropData(blueMotion)
			]);

			const [redArrow, blueArrow] = await Promise.all([
				createArrowData(redMotion),
				createArrowData(blueMotion)
			]);

			redPropData.set(redProp);
			bluePropData.set(blueProp);
			redArrowData.set(redArrow);
			blueArrowData.set(blueArrow);

			redMotion.arrow = redArrow;
			blueMotion.arrow = blueArrow;

			const locationManager = new ArrowLocationManager(getter);
			redArrow.loc = locationManager.getArrowLocation(redMotion);
			blueArrow.loc = locationManager.getArrowLocation(blueMotion);

			const rotAngleManager = new ArrowRotAngleManager();
			redArrow.rotAngle = rotAngleManager.updateRotation(redMotion, redArrow.loc);
			blueArrow.rotAngle = rotAngleManager.updateRotation(blueMotion, blueArrow.loc);

			await tick();

			propPlacementManager = new PropPlacementManager(pictographData, gridData, checker);
			arrowPlacementManager = new ArrowPlacementManager(pictographData, gridData, checker);

			arrowPlacementManager?.updateArrowPlacements([$redArrowData, $blueArrowData]);
			propPlacementManager?.updatePropPlacement([$redPropData, $bluePropData]);

			initializationComplete = true;
		} catch (error) {
			console.error('Initialization failed:', error);
		}
	}
	onMount(() => {
		initializeAll();
	});
</script>

<svg class="pictograph" viewBox="0 0 950 950" xmlns="http://www.w3.org/2000/svg" role="img">
	<Grid
		gridMode={pictographData?.gridMode || 'diamond'}
		onPointsReady={(data) => {
			gridData = data;
		}}
	/>
	<TKAGlyph letter={pictographData.letter} turnsTuple="(s, 0, 0)" x={50} y={800} />

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
