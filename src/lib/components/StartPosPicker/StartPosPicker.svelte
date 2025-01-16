<script lang="ts">
	import Pictograph from '../Pictograph/Pictograph.svelte';
	import pictographDataStore from '$lib/stores/pictographDataStore';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';

	// Store for selected start position
	export const selectedStartPos = writable<Record<string, any> | null>(null);

	let startPositions: Record<string, any>[] = [];
	let gridMode = 'diamond'; // Default grid mode (can be dynamic)

	// Store for container width
	const containerWidth = writable<number>(0);

	// Filter pictographs for start positions based on grid mode
	pictographDataStore.subscribe((data) => {
		const defaultStartPosKeys =
			gridMode === 'diamond'
				? ['alpha1_alpha1', 'beta5_beta5', 'gamma11_gamma11']
				: ['alpha2_alpha2', 'beta4_beta4', 'gamma12_gamma12'];

		startPositions = data.filter((entry) =>
			defaultStartPosKeys.includes(`${entry.start_pos}_${entry.end_pos}`)
		);
	});

	// Handle user selection
	const handleSelect = (position: Record<string, any>) => {
		selectedStartPos.set(position);
	};

	// Update container width on mount and resize
	let container: HTMLDivElement;
	const updateWidth = () => {
		if (container) {
			containerWidth.set(container.clientWidth);
		}
	};

	onMount(() => {
		updateWidth();
		window.addEventListener('resize', updateWidth);
		return () => {
			window.removeEventListener('resize', updateWidth);
		};
	});
</script>

<div class="wrapper">
	<div class="label">Choose your start position!</div>
	<div class="pictograph-container" bind:this={container}>
		{#if startPositions.length > 0}
			{#each startPositions as position}
				<Pictograph
					pictographData={position}
					onClick={() => handleSelect(position)}
					isSelected={$selectedStartPos?.id === position.id}
					name={position.name}
					interactive={true}
				/>
			{/each}
		{:else}
			<p>No start positions available.</p>
		{/if}
	</div>
</div>

<style>
	.wrapper {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
	}

	.label {
		margin-bottom: 10%;
		font-size: 4vh;
		font-family: 'Monotype Corsiva', cursive;
		background-color: rgba(255, 255, 255, 0.5);
		border-radius: 40px;
		padding: 10px 20px;
		text-align: center;
	}

	.pictograph-container {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		align-items: center;
		width: 70%;
		height: auto;
		gap: 3%;
	}
</style>
