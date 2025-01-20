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

	function initializeMotions(): void {
		const { redMotionData, blueMotionData } = pictographData || {};

		if (redMotionData && blueMotionData) {
			motions = [
				new Motion(redMotionData),
				new Motion(blueMotionData),
			];
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

	onMount(() => {
		initializeMotions();
		updateContainerSize();
	});

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
	<Grid 
		gridMode={pictographData?.gridMode || 'diamond'} 
		onPointsReady={(data) => {
			gridData = data;
			console.debug('Received gridData:', gridData);
		}} 
	/>

	{#if gridData}
		{#each motions as motion}
			<Prop 
				{motion} 
				{gridData} 
				gridWidth={containerWidth} 
				gridHeight={containerHeight} 
				gridMode = {pictographData?.gridMode || 'diamond'}
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
