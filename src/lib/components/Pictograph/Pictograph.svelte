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
		const { redMotionData, blueMotionData } = pictographData || {};
		if (redMotionData) {
			redMotion = new Motion(redMotionData);
		}
		if (blueMotionData) {
			blueMotion = new Motion(blueMotionData);
		}
	}

	function updateContainerSize(): void {
		if (pictographRef) {
			const { width, height } = pictographRef.getBoundingClientRect();
			containerWidth = width;
			containerHeight = height;
			sceneScaleFactor = Math.min(containerWidth / 950, containerHeight / 950);
		}
	}

	function setupPropPlacementManager(): void {
		if (pictographData && gridData) {
			propPlacementManager = new PropPlacementManager(
				pictographData,
				gridData,
				containerWidth,
				containerHeight
			);

			if (redPropData) {
				redPropData = propPlacementManager.updatePropPositions([redPropData])[0];
			}
			if (bluePropData) {
				bluePropData = propPlacementManager.updatePropPositions([bluePropData])[0];
			}
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
				loc: redMotion.endLoc,
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
				loc: blueMotion.endLoc,
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
		{sceneScaleFactor}
		onPointsReady={(gridData) => {
			gridData = gridData;
		}}
	/>
	{#if gridData}
		{#each [redPropData, bluePropData] as propData (propData?.color)}
			{#if propData}
				<Prop {propData} {sceneScaleFactor} />
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
	}

	.pictograph:hover {
		transform: scale(1.1);
		z-index: 1;
		border: 1px solid black;
	}

	.pictograph:active {
		transform: scale(1);
		border: none;
	}
</style>
