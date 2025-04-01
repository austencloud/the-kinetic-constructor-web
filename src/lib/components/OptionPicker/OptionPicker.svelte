<script lang="ts">
	import { selectedPictograph } from '$lib/stores/selectedPictographStore';
	import Pictograph from '../Pictograph/Pictograph.svelte';
	import Option from './Option.svelte';
	import LoadingSpinner from '../MainWidget/loading/LoadingSpinner.svelte';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { writable } from 'svelte/store';
	import { setPictographLoaded } from '$lib/stores/ui/loadingStore';

	export let options: { name: string; pictographData: any }[] = [];
	let isLoading = true;
	let individualPictographLoading = true;
	
	// Track loaded pictographs
	let loadedPictographs = 0;
	let totalPictographs = 1; // For selected pictograph
	
	// Create a unique ID for the option picker's pictograph
	const optionPickerId = 'option-picker-pictograph';

	onMount(() => {
		// Initialize the pictograph as not loaded
		setPictographLoaded(optionPickerId, false);
		
		// Simulate options loading if needed
		setTimeout(() => {
			isLoading = false;
		}, 500);
	});

	// Create a function to handle when pictograph is fully loaded
	function handlePictographLoaded() {
		individualPictographLoading = false;
		loadedPictographs++;
		
		// Mark this pictograph as loaded in the global store
		setPictographLoaded(optionPickerId, true);
		
	}
</script>

<div class="optionPicker">
	<h2 class="title">Options:</h2>
	
	{#if isLoading}
		<div class="loading-container">
			<LoadingSpinner />
			<p class="loading-text">Loading options...</p>
		</div>
	{:else}
		<div class="scrollArea">
			{#each options as { name, pictographData }}
				<Option {name} {pictographData} selectedPictographStore={selectedPictograph} />
			{/each}
		</div>

		<div class="pictograph-container">
			{#if $selectedPictograph}
				{#if individualPictographLoading}
					<div class="pictograph-loading">
						<LoadingSpinner />
						<p class="loading-text">Loading pictograph details...</p>
					</div>
				{/if}
				<div class={individualPictographLoading ? 'hidden' : 'visible'}>
					<Pictograph 
						pictographDataStore={writable($selectedPictograph)} 
						onClick={() => {}} 
						on:loaded={handlePictographLoaded}
					/>
				</div>
			{:else}
				<div class="no-selection">
					<p>Select an option to view the pictograph</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.optionPicker {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 700px;
		margin: auto;
		background: #f0f0f0;
		padding: 20px;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
		height: 100%;
	}

	.title {
		font-size: 1.5rem;
		font-weight: bold;
		margin-bottom: 10px;
	}

	.scrollArea {
		max-height: 200px;
		overflow-y: auto;
		margin-bottom: 20px;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 300px;
	}

	.loading-text {
		margin-top: 20px;
		font-size: 1.2rem;
		color: #555;
	}

	.pictograph-container {
		margin-top: 20px;
		display: flex;
		justify-content: center;
		align-items: center;
		border: 1px solid #ccc;
		border-radius: 8px;
		padding: 10px;
		background: #fff;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
		position: relative;
		min-height: 300px;
	}

	.pictograph-loading {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		background: rgba(255, 255, 255, 0.9);
		z-index: 5;
	}

	.visible {
		opacity: 1;
		transition: opacity 0.3s ease-in;
	}

	.hidden {
		opacity: 0;
	}
	
	.no-selection {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
		color: #888;
		font-style: italic;
	}
</style>