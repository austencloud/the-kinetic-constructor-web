<script lang="ts">
	import Pictograph from '../Pictograph/Pictograph.svelte';
	import pictographDataStore from '$lib/stores/pictographDataStore';
	import { writable } from 'svelte/store';

	// Store for selected start position
	export const selectedStartPos = writable<Record<string, any> | null>(null);

	let startPositions: Record<string, any>[] = [];
	let gridMode = 'diamond'; // Default grid mode (can be dynamic)

	// Filter pictographs for start positions based on grid mode
	pictographDataStore.subscribe((data) => {
		const startPosKeys =
			gridMode === 'diamond'
				? ['alpha1_alpha1', 'beta5_beta5', 'gamma11_gamma11']
				: ['alpha2_alpha2', 'beta4_beta4', 'gamma12_gamma12'];

		startPositions = data.filter((entry) =>
			startPosKeys.includes(`${entry.start_pos}_${entry.end_pos}`)
		);
	});

	// Handle user selection
	const handleSelect = (position: Record<string, any>) => {
		selectedStartPos.set(position);
	};
</script>

<div class="wrapper">
	<div class="label">Choose your start position!</div>
	<div class="pictograph-container">
		{#if startPositions.length > 0}
			{#each startPositions as position}
				<Pictograph
					pictographData={position}
					onClick={() => handleSelect(position)}
					isSelected={$selectedStartPos?.id === position.id}
					name={position.name}
					interactive={true} />
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
		font-size: 3vw; /* Font size relative to window width */
		font-family: 'Monotype Corsiva', cursive;
	}

	.pictograph-container {
		margin-bottom: 10%;
		display: flex;
		justify-content: center;
		width: 75%;
		height: 20%;
		flex-wrap: wrap;
		gap: 3%;
	}
</style>
