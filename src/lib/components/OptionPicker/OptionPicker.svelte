<!-- src/lib/components/OptionPicker/OptionPicker.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { fade } from 'svelte/transition';

	// Components
	import Pictograph from '../Pictograph/Pictograph.svelte';
	import LoadingSpinner from '../MainWidget/loading/LoadingSpinner.svelte';
	import ReversalFilter from './components/ReversalFilter.svelte';
	import OptionSection from './components/OptionSection.svelte';

	// Stores and services
	import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';
	import {
		optionPickerStore,
		optionsByLetterType,
		type ReversalFilterType
	} from '$lib/stores/optionPicker/optionPickerStore';
	import { beatsStore } from '$lib/stores/sequence/beatsStore';
	import { setPictographLoaded } from '$lib/stores/ui/loadingStore';

	// Local state
	let isLoading = true;
	let selectedFilter: ReversalFilterType = 'all';
	let previewLoading = true;
	let expandedSections: Record<string, boolean> = {
		alpha: true,
		beta: true,
		gamma: true,
		other: true
	};

	// Create a unique ID for the option picker's pictograph
	const optionPickerId = 'option-picker-pictograph';

	// Subscribe to stores
	const unsubscribeOptionPicker = optionPickerStore.subscribe((state) => {
		isLoading = state.isLoading;
	});

	const unsubscribeOptionsByLetter = optionsByLetterType.subscribe((grouped) => {
		Object.keys(grouped).forEach((letterType) => {
			if (grouped[letterType]?.length > 0 && expandedSections[letterType] === undefined) {
				expandedSections[letterType] = true;
			}
		});
	});

	const unsubscribeBeats = beatsStore.subscribe((beats) => {
		if (beats.length > 0) {
			const sequence = beats.map((beat) => beat.pictographData);
			optionPickerStore.loadOptions(sequence);
		}
	});

	const unsubscribeSelected = selectedPictograph.subscribe((selected) => {
		if (selected) {
			previewLoading = true;
		}
	});

	// Handle when pictograph is loaded
	function handlePictographLoaded() {
		previewLoading = false;
		setPictographLoaded(optionPickerId, true);
	}

	// Clean up subscriptions when component is destroyed
	onDestroy(() => {
		unsubscribeOptionPicker();
		unsubscribeOptionsByLetter();
		unsubscribeBeats();
		unsubscribeSelected();
	});

	onMount(() => {
		setPictographLoaded(optionPickerId, false);
	});
</script>

<div class="optionPicker">
	<div class="header">
		<h2 class="title">Next Options</h2>
		<ReversalFilter bind:selectedFilter disabled={isLoading} />
	</div>

	{#if isLoading}
		<div class="loading-container">
			<LoadingSpinner />
			<p class="loading-text">Loading options...</p>
		</div>
	{:else}
		<div class="scrollArea">
			{#if $optionsByLetterType && Object.keys($optionsByLetterType).length > 0}
				{#each Object.entries($optionsByLetterType) as [letterType, options]}
					<OptionSection
						title={letterType}
						{options}
						expanded={expandedSections[letterType] || false}
					/>
				{/each}
			{:else}
				<div class="no-options">
					<p>No options available for the current sequence.</p>
					<p class="hint">Try selecting a different reversal filter or start a new sequence.</p>
				</div>
			{/if}
		</div>
	{/if}

	<div class="pictograph-container">
		{#if $selectedPictograph}
			{#if previewLoading}
				<div class="pictograph-loading">
					<LoadingSpinner />
					<p class="loading-text">Loading pictograph details...</p>
				</div>
			{/if}
			<div class={previewLoading ? 'hidden' : 'visible'}>
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
</div>

<style>
	.optionPicker {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		background: transparent;
		padding: 20px;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.title {
		font-size: 1.5rem;
		font-weight: bold;
		margin: 0;
	}

	.scrollArea {
		flex: 1;
		overflow-y: auto;
		margin-bottom: 20px;
		max-height: calc(100% - 300px);
		background: transparent;
		border-radius: 8px;
		padding: 1rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 200px;
	}

	.loading-text {
		margin-top: 20px;
		font-size: 1.2rem;
		color: #555;
	}

	.no-options {
		text-align: center;
		padding: 2rem;
		color: #666;
	}

	.hint {
		font-size: 0.9rem;
		color: #888;
		font-style: italic;
	}

	.pictograph-container {
		margin-top: 20px;
		display: flex;
		justify-content: center;
		align-items: center;
		border: 1px solid #ccc;
		border-radius: 8px;
		padding: 10px;
		background: transparent;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
		position: relative;
		min-height: 300px;
		height: 300px;
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
		background: transparent;
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

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.scrollArea {
			max-height: calc(100% - 350px);
		}
	}
</style>
