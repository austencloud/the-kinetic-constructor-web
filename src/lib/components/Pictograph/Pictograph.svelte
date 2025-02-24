<script lang="ts">
	import { get, writable, type Writable } from 'svelte/store';
	import Grid from './Grid/Grid.svelte';
	import TKAGlyph from './TKAGlyph/TKAGlyph.svelte';
	import { ArrowPlacementManager } from './Arrow/ArrowPlacementManager/ArrowPlacementManager.js';
	import type { PictographData } from '$lib/types/PictographData.js';
	import type { GridData } from './Grid/GridData.js';
	import { PictographChecker } from './PictographChecker.js';
	import { PictographGetter } from './PictographGetter.js';
	import { PropPlacementManager } from './Prop/PropPlacementManager/PropPlacementManager.js';
	import Arrow from './Arrow/Arrow.svelte';
	import Prop from './Prop/Prop.svelte';
	import { onMount, tick } from 'svelte';
	import type { PropData } from './Prop/PropData.js';
	import type { ArrowData } from './Arrow/ArrowData.js';
	import { Motion } from './Motion/Motion.js';
	import { createPropData } from './PropFactory.js';
	import ArrowLocationManager from './Arrow/ArrowLocationManager/ArrowLocationManager.js';
	import ArrowRotAngleManager from './Arrow/ArrowRotAngleManager/ArrowRotAngleManager.js';
	import { createArrowData } from './Arrow/ArrowFactory';

	export let pictographData: PictographData | Writable<PictographData>;
	export const onClick: () => void = () => {};

	// Ensure pictographData is reactive whether it's a store or a normal object
	let pictographDataStore: Writable<PictographData>;

	if ('subscribe' in pictographData) {
		// pictographData is already a store
		pictographDataStore = pictographData as Writable<PictographData>;
	} else {
		// Convert pictographData to a store
		pictographDataStore = writable(pictographData);
	}

	let gridData: GridData | null = null;
	let checker = new PictographChecker(get(pictographDataStore));
	let getter = new PictographGetter(get(pictographDataStore));
	let propPlacementManager: PropPlacementManager | null = null;
	let arrowPlacementManager: ArrowPlacementManager | null = null;

	let redPropData: Writable<PropData> = writable();
	let bluePropData: Writable<PropData> = writable();
	let redArrowData: Writable<ArrowData> = writable();
	let blueArrowData: Writable<ArrowData> = writable();
	let initializationComplete = false;

	async function initializeAll() {
		try {
			const pictograph = get(pictographDataStore);

			if (!pictograph.letter) {
				return;
			}

			while (!gridData?.centerPoint?.coordinates) await tick();

			const redMotion = new Motion(pictograph, pictograph.redMotionData!);
			const blueMotion = new Motion(pictograph, pictograph.blueMotionData!);

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

			propPlacementManager = new PropPlacementManager(pictograph, gridData, checker);
			arrowPlacementManager = new ArrowPlacementManager(pictograph, gridData, checker);

			arrowPlacementManager?.updateArrowPlacements([$redArrowData, $blueArrowData]);
			propPlacementManager?.updatePropPlacement([$redPropData, $bluePropData]);

			initializationComplete = true;
		} catch (error) {
			console.error('Initialization failed:', error);
		}
	}

	// Reactively update when pictographData changes
	$: {
		initializeAll();
	}

	onMount(() => {
		initializeAll();
	});
</script>

<svg class="pictograph" viewBox="0 0 950 950" xmlns="http://www.w3.org/2000/svg" role="img">
	<Grid
		gridMode={get(pictographDataStore)?.gridMode || 'diamond'}
		onPointsReady={(data) => {
			gridData = data;
		}}
	/>
	<TKAGlyph letter={get(pictographDataStore).letter} turnsTuple="(s, 0, 0)" x={50} y={800} />

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
