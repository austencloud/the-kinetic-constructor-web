<script lang="ts">
	import { writable } from 'svelte/store';
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
	import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';

	export let pictograph: any = null;

	// Create a writable store for the pictograph data
	const pictographDataStore = writable(pictograph || defaultPictographData);

	// Update the store when pictograph changes
	$: if (pictograph) {
		pictographDataStore.set(pictograph);
	}
</script>

<div class="pictograph-question">
	{#if pictograph}
		<div class="pictograph-container">
			<Pictograph {pictographDataStore} showLoadingIndicator={false} />
		</div>
	{:else}
		<div class="placeholder">No pictograph data</div>
	{/if}
</div>

<style>
	.pictograph-question {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.pictograph-container {
		width: 200px;
		height: 200px;
	}

	.placeholder {
		border: 2px dashed #555;
		border-radius: 8px;
		padding: 2rem;
		color: #777;
		background-color: rgba(0, 0, 0, 0.1);
	}
</style>
