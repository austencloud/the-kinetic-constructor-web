<script lang="ts">
	import Pictograph from '../Pictograph/Pictograph.svelte';
	import pictographDataStore from '$lib/stores/pictographDataStore'; // Default export
	import { writable, get } from 'svelte/store';

	// Store for selected start position
	export const selectedStartPos = writable<Record<string, any> | null>(null);

	let startPositions: Record<string, any>[] = [];
	let isLoading = true;

	// Subscribe to pictographDataStore and filter start positions
	pictographDataStore.subscribe((data) => {
		if (data.length > 0) {
			startPositions = data.filter((entry) => entry.type === 'start');
			isLoading = false;
		}
	});

	const handleSelect = (position: Record<string, any>) => {
		selectedStartPos.set(position);
	};
</script>

<div class="wrapper">
	<div class="label">Choose your start position!</div>
	{#if isLoading}
		<div class="loading-message">Loading start positions...</div>
	{:else if startPositions.length === 0}
		<div class="no-data-message">No start positions available</div>
	{:else}
		<div class="pictograph-container">
			{#each startPositions as position}
				<button
					class="base-pictograph"
					aria-pressed={$selectedStartPos?.id === position.id}
					on:click={() => handleSelect(position)}
				>
					<Pictograph pictographData={position} />
					<span>{position.name}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.label {
		font-size: 1.5rem;
		margin-bottom: 1em;
	}
	.pictograph-container {
		display: flex;
		gap: 1em;
	}
	.loading-message,
	.no-data-message {
		font-size: 1rem;
		color: gray;
		margin-top: 1em;
	}
</style>
