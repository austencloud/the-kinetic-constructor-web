<script lang="ts">
	import Grid from './Grid/Grid.svelte';
	import Prop from './Prop/Prop.svelte';
	import { Motion } from './Motion/Motion';
	import type { PictographInterface } from '$lib/types/PictographInterface';
	import type { GridData } from './Grid/GridInterface';
	import { PropPlacementManager } from './Prop/PropPlacementManager/PropPlacementManager';
	import type { PropInterface } from './Prop/PropInterface';
	import { onMount } from 'svelte';

	export let pictographData: PictographInterface;
	export let onClick: () => void;

	let motions: Motion[] = [];
	let containerWidth = 1;
	let containerHeight = 1;
	let gridData: GridData | null = null;
	let propPlacementManager: PropPlacementManager | null = null;
	let updatedProps: PropInterface[] = [];

	let pictographRef: HTMLDivElement | null = null;

	function initializeMotions(): void {
		const { redMotionData, blueMotionData } = pictographData || {};
		console.debug('Red Motion Data:', redMotionData);
		// log the data
		if (redMotionData && blueMotionData) {
			motions = [new Motion(redMotionData), new Motion(blueMotionData)];
			console.debug('Initialized motions:', motions);
		}
	}

	function updateContainerSize(): void {
		if (pictographRef) {
			const { width, height } = pictographRef.getBoundingClientRect();
			containerWidth = width;
			containerHeight = height;
			console.debug('Updated container size:', { containerWidth, containerHeight });
		}
	}

	function setupPropPlacementManager(): void {
		if (pictographData && gridData) {
			console.debug('Pictograph Data:', pictographData);
			console.debug('Grid Data:', gridData);

			propPlacementManager = new PropPlacementManager(
				pictographData,
				gridData,
				containerWidth,
				containerHeight
			);

			// Map motions to props and update positions
			const props: PropInterface[] = motions.map((motion) => ({
				propType: 'staff',
				color: motion.color,
				motion,
				radialMode:
					motion.endOri === 'in' || motion.endOri === 'out'
						? (motion.endOri as 'radial' | null)
						: null,
				ori: motion.endOri,
				coords: { x: 0, y: 0 },
				loc: motion.endLoc
			}));

			updatedProps = propPlacementManager.updatePropPositions(props);
			console.debug('Updated Props:', updatedProps);
		} else {
			console.warn('Pictograph data or grid data is missing.');
		}
	}

	onMount(() => {
		initializeMotions();
		updateContainerSize();
		setupPropPlacementManager();
	});

	$: if (pictographRef) {
		updateContainerSize();
		setupPropPlacementManager();
	}
</script>

<div
	class="pictograph"
	bind:this={pictographRef}
	role="button"
	tabindex="0"
	on:click|stopPropagation={onClick}
	on:keydown={(e) => e.key === 'Enter' && onClick()}
>
	<Grid
		gridMode={pictographData?.gridMode || 'diamond'}
		onPointsReady={(data) => {
			gridData = data;
			console.debug('Received gridData:', gridData);
		}}
	/>

	{#if gridData && updatedProps}
		{#each updatedProps as prop}
			<Prop {prop} />
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
