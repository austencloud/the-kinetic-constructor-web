<script lang="ts">
	// Using modern Svelte 5 runes approach
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
	import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';
	import type { PictographData } from '$lib/types/PictographData';
	import { PictographService } from '$lib/components/Pictograph/PictographService';

	// Props using Svelte 5 runes
	const { pictograph = null } = $props<{
		pictograph?: PictographData | null;
	}>();

	// Process the pictograph data to ensure it has all required properties
	function processData(data: PictographData): PictographData {
		if (!data) return defaultPictographData;

		// Make a deep copy to avoid modifying the original data
		const processingData = JSON.parse(JSON.stringify(data));

		// Add a unique ID to ensure components remount
		processingData.id = crypto.randomUUID();

		// Ensure grid is set if gridMode is present
		if (processingData.gridMode && !processingData.grid) {
			processingData.grid = processingData.gridMode;
		}

		// Initialize service to generate missing components if needed
		try {
			new PictographService(processingData);
			return processingData;
		} catch (err) {
			console.error('Error processing pictograph data:', err);
			return processingData;
		}
	}

	// Process pictograph data when it changes using $derived
	const processedPictographData = $derived(
		pictograph ? processData(pictograph) : defaultPictographData
	);

	// Track a unique ID for the pictograph that changes with each new pictograph using $derived
	const pictographId = $derived(crypto.randomUUID());
</script>

<div class="pictograph-question">
	{#if pictograph}
		{#key pictographId}
			<div class="pictograph-container">
				<Pictograph pictographData={processedPictographData} showLoadingIndicator={false} />
			</div>
		{/key}
	{:else}
		<div class="placeholder">No pictograph data</div>
	{/if}
</div>

<style>
	.pictograph-question {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		padding: 1rem;
	}

	.pictograph-container {
		width: 300px;
		height: 300px;
		max-width: 90vw;
		max-height: 90vw;
	}

	.placeholder {
		border: 2px dashed #555;
		border-radius: 8px;
		padding: 2rem;
		color: #777;
		background-color: rgba(0, 0, 0, 0.1);
	}
</style>
