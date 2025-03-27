<script lang="ts">
	import { selectedPictograph } from '$lib/stores/selectedPictographStore';
	import Pictograph from '../Pictograph/Pictograph.svelte';
	import Option from './Option.svelte';
	import LoadingSpinner from '../MainWidget/LoadingSpinner.svelte';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';

	export let options: { name: string; pictographData: any }[] = [];
	let isLoading = true;

	onMount(() => {
		// Simulate options loading
		// In real scenario, this could depend on API fetch or other async operations
		setTimeout(() => {
			isLoading = false;
		}, 500);
	});

	// Track if selected pictograph is fully loaded
	let isPictographLoaded = false;
	
	function handlePictographLoaded() {
		isPictographLoaded = true;
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
				{#if !isPictographLoaded}
					<div class="pictograph-loading">
						<LoadingSpinner />
					</div>
				{/if}
				<div class={isPictographLoaded ? 'visible' : 'hidden'}>
					<Pictograph 
						pictographDataStore={$selectedPictograph} 
						onClick={() => {}} 
						on:loaded={handlePictographLoaded}
					/>
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
		justify-content: center;
		align-items: center;
		background: rgba(255, 255, 255, 0.8);
		z-index: 5;
	}

	.visible {
		opacity: 1;
		transition: opacity 0.3s ease-in;
	}

	.hidden {
		opacity: 0;
	}
</style>