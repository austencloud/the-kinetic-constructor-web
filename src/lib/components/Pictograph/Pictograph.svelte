<script lang="ts">
	import Grid from './Grid/Grid.svelte';
	import Prop from './Prop/Prop.svelte';
	import Arrow from './Arrow/Arrow.svelte';
	import { PictographManager } from './PictographManager';
	import type { PictographInterface } from '$lib/types/PictographInterface';
	import type { GridData } from './Grid/GridInterface';

	export let pictographData: PictographInterface | null;
	export let onClick: () => void;

	let pictographManager: PictographManager | null = null;

	function handleGridDataReady(data: GridData): void {
		if (pictographData) {
			pictographManager = new PictographManager(pictographData, data);
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
	{#if pictographManager}
		{#each pictographManager.getMotions() as motion}
			<Prop {motion} />
		{/each}
		{#each pictographManager.getMotions() as motion}
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
