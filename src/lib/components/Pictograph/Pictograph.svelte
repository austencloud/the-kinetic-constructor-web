<script lang="ts">
	import Grid from './Grid/Grid.svelte';
	import Prop from './Prop/Prop.svelte';
	import Arrow from './Arrow/Arrow.svelte';
	import { Motion } from './Motion/Motion';
	import { PropPlacementManager } from './Prop/PropPlacementManager/PropPlacementManager';
	import type { PictographInterface } from '$lib/types/PictographInterface';
	import type { GridData } from './Grid/GridInterface';

	export let pictographData: PictographInterface | null;
	export let onClick: () => void;

	let motions: Motion[] = [];
	let propPlacementManager: PropPlacementManager | null = null;

	function handleGridDataReady(data: GridData): void {
		if (pictographData) {
			propPlacementManager = new PropPlacementManager(pictographData, data);
			initializeMotions();
		}
	}

	function initializeMotions(): void {
		const { redMotionData, blueMotionData } = pictographData || {};

		if (redMotionData && blueMotionData) {
			motions = [
				new Motion(redMotionData),
				new Motion(blueMotionData),
			];
		}
	}

</script>

<div
	class="pictograph"
	role="button"
	tabindex="0"
	on:click|stopPropagation={onClick}
	on:keydown={(e) => e.key === 'Enter' && onClick()}
>
	<Grid gridMode={pictographData?.gridMode || 'diamond'} onPointsReady={handleGridDataReady} />
	{#if propPlacementManager}
		{#each motions as motion}
			<Prop {motion} />
		{/each}
		{#each motions as motion}
			<Arrow {motion} />
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
