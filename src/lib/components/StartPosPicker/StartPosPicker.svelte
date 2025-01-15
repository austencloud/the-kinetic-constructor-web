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
		font-size: 5vh; /* Font size relative to window width */
		font-family: 'Monotype Corsiva', cursive;
		background-color: rgba(255, 255, 255, 0.5); /* Translucent background */
		border-radius: 40px; /* Adjust as needed */
		padding: 10px 20px; /* Adjust as needed */
		text-align: center;
	}

	.pictograph-container {
		display: flex;
		flex-direction: row; /* force a row layout */
		justify-content: space-around;
		align-items: center;

		/* The container’s width is 70% (already in your code).
     If you want them to be all in one row, make sure the container is wide enough. */
		width: 70%;
		/* If you always want them to fit horizontally, let height be auto. */
		height: auto;

		/* If you also want them to wrap on smaller screens, keep flex-wrap. 
     But if you want EXACTLY one row, remove flex-wrap or set it to nowrap. */
		flex-wrap: nowrap; /* or remove 'wrap' entirely */
		gap: 3%;
	}
</style>
