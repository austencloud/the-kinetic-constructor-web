<script lang="ts">
	import Grid from './Grid/Grid.svelte';
	import Prop from './Prop/Prop.svelte';
	import { Motion } from './Motion/Motion';
	import type { PictographInterface } from '$lib/types/PictographInterface';
	import type { GridData } from './Grid/GridInterface';
	import { onMount } from 'svelte';

	export let pictographData: PictographInterface | null;
	export let onClick: () => void;

	let motions: Motion[] = [];
	let containerWidth = 1;
	let containerHeight = 1;
	let gridData: GridData | null = null;

	let pictographRef: HTMLDivElement | null = null;

	// Initialize motions when the component mounts
	function initializeMotions(): void {
		const { redMotionData, blueMotionData } = pictographData || {};

		if (redMotionData && blueMotionData) {
			motions = [
				new Motion(redMotionData),
				new Motion(blueMotionData),
			];
		}
	}

	// Update container size
	function updateContainerSize(): void {
		if (pictographRef) {
			const { width, height } = pictographRef.getBoundingClientRect();
			containerWidth = width;
			containerHeight = height;
		}
	}

	// Initialize motions and ensure size is updated on mount
	onMount(() => {
		initializeMotions();
		updateContainerSize();
	});

	// Monitor size changes reactively
	$: if (pictographRef) {
		updateContainerSize();
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
	<!-- Listen for grid data being ready -->
	<Grid 
		gridMode={pictographData?.gridMode || 'diamond'} 
		onPointsReady={(gridData) => (gridData = gridData)} 
	/>

	{#if gridData}
		{#each motions as motion}
			<Prop 
				{motion} 
				{gridData} 
				gridWidth={containerWidth} 
				gridHeight={containerHeight} 
			/>
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
