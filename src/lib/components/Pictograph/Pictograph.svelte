<script lang="ts">
	import Grid from './Grid/Grid.svelte';
	import Prop from './Prop/Prop.svelte';
	import { Motion } from './Motion/Motion';
	import type { PictographInterface } from '$lib/types/PictographInterface';
	import type { GridData } from './Grid/GridInterface';
	import { PropPlacementManager } from './Prop/PropPlacementManager/PropPlacementManager';
	import type { PropInterface } from './Prop/PropInterface';
	import { onMount, onDestroy } from 'svelte';

	export let pictographData: PictographInterface;
	export const onClick: () => void = () => {};
	export let isSelected = false;

	let redMotion: Motion | null = null;
	let blueMotion: Motion | null = null;
	let containerWidth = 1;
	let containerHeight = 1;
	let gridData: GridData | null = null;
	let propPlacementManager: PropPlacementManager | null = null;
	let redPropData: PropInterface | null = null;
	let bluePropData: PropInterface | null = null;
	let sceneScaleFactor = 1;

	let pictographRef: HTMLDivElement | null = null;
	let resizeObserver: ResizeObserver;

	function initializeMotions(): void {
		let { redMotionData, blueMotionData } = pictographData || {};
		if (redMotionData) {
			redMotion = new Motion(redMotionData);
		}
		if (blueMotionData) {
			blueMotion = new Motion(blueMotionData);
		}
	}
	let gridScaleFactor = 1;
	let propScaleFactor = 1;

	function updateContainerSize(): void {
		if (pictographRef) {
			const { width, height } = pictographRef.getBoundingClientRect();

			// Grid scale factor (based on 950x950 logical size)
			gridScaleFactor = Math.min(width / 950, height / 950);

			// Prop scale factor (based on 650x650 logical size)
			propScaleFactor = Math.min(width / 650, height / 650);

			console.debug('Grid Scale Factor:', gridScaleFactor);
			console.debug('Prop Scale Factor:', propScaleFactor);
		}
	}

	function setupPropPlacementManager(): void {
		if (pictographData && gridData) {
			console.debug('Setting up Prop Placement Manager');
			console.debug('Grid Data:', gridData);
			console.debug('Pictograph Data:', pictographData);

			propPlacementManager = new PropPlacementManager(
				pictographData,
				gridData,
				containerWidth,
				containerHeight
			);

			if (redPropData) {
				console.debug('Before updating redPropData:', redPropData);
				redPropData = propPlacementManager.updatePropPositions([redPropData])[0];
				console.debug('After updating redPropData:', redPropData);
			}
			if (bluePropData) {
				console.debug('Before updating bluePropData:', bluePropData);
				bluePropData = propPlacementManager.updatePropPositions([bluePropData])[0];
				console.debug('After updating bluePropData:', bluePropData);
			}
		} else {
			console.warn('Missing gridData or pictographData during setup.');
		}
	}

	function createProps(): void {
		if (redMotion) {
			redPropData = {
				propType: 'staff',
				color: redMotion.color,
				motion: redMotion,
				radialMode:
					redMotion.endOri === 'in' || redMotion.endOri === 'out'
						? (redMotion.endOri as 'radial' | null)
						: null,
				ori: redMotion.endOri,
				coords: { x: 0, y: 0 },
				loc: redMotion.endLoc
			};
		}

		if (blueMotion) {
			bluePropData = {
				propType: 'staff',
				color: blueMotion.color,
				motion: blueMotion,
				radialMode:
					blueMotion.endOri === 'in' || blueMotion.endOri === 'out'
						? (blueMotion.endOri as 'radial' | null)
						: null,
				ori: blueMotion.endOri,
				coords: { x: 0, y: 0 },
				loc: blueMotion.endLoc
			};
		}
	}

	onMount(() => {
		initializeMotions();
		updateContainerSize();
		createProps();
		setupPropPlacementManager();

		// Observe container resizing
		resizeObserver = new ResizeObserver(() => {
			updateContainerSize();
		});

		if (pictographRef) {
			resizeObserver.observe(pictographRef);
		}
	});

	onDestroy(() => {
		if (resizeObserver && pictographRef) {
			resizeObserver.unobserve(pictographRef);
		}
	});

	function handleClick(event: Event) {
		isSelected = !isSelected;
		onClick();
	}
	$: if (gridData && pictographData) {
		console.debug('Setting up Prop Placement Manager');
		setupPropPlacementManager();
	}
</script>

<div
	class="pictograph"
	bind:this={pictographRef}
	on:click={handleClick}
	on:keydown={(e) => e.key === 'Enter' && handleClick(e)}
	role="button"
	tabindex="0"
>
	<Grid
		gridMode={pictographData?.gridMode || 'diamond'}
		{gridScaleFactor}
		onPointsReady={(data) => {
			console.debug('Grid Data Ready:', data);
			gridData = data;
		}}
	/>
	{#if gridData}
		{#each [redPropData, bluePropData] as propData (propData?.color)}
			{#if propData}
				<Prop {propData} {propScaleFactor} />
			{/if}
		{/each}
	{/if}
</div>

<style>
	.pictograph {
		width: 100%;
		height: 100%;
		display: flex;
		flex: 1;
		background-color: white;
		margin: 0;
		padding: 0;
		border: none;
		cursor: pointer;
		transition: transform 0.1s;
		box-sizing: border-box;
		transform: scale(1);
		z-index: 1;
		position: relative; /* Add this */
	}

	.pictograph:hover {
		transform: scale(1.1);
		z-index: 4;
		outline: 4px solid gold; /* Use outline for hover effect */
	}

	.pictograph:active {
		transform: scale(1);
		border: none;
		z-index: 1;
	}
</style>
