
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
	import { beatsStore } from '$lib/stores/sequence/beatsStore';
	import { setPictographLoaded } from '$lib/stores/ui/loadingStore';
	import optionPickerStore, {
		type OptionPickerState,
		type ReversalFilterType
	} from '$lib/stores/optionPicker/optionPickerStore';
	// Destructure the derived store from the option picker store
	const { optionsByLetterType } = optionPickerStore;

	// Local state
	let isLoading = true;
	let selectedFilter: ReversalFilterType = 'all';
	let previewLoading = true;

	// New tab state – default to Type1
	let selectedTab: string = 'Type1';
	const letterTypes = ['Type1', 'Type2', 'Type3', 'Type4', 'Type5', 'Type6'];

	// Subscribe to stores
	const unsubscribeOptionPicker = optionPickerStore.subscribe((state) => {
		isLoading = state.isLoading;
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

	// Debug the optionsByLetterType store
	const unsubscribeOptionsByLetterType = optionsByLetterType.subscribe((grouped) => {
		console.log('Grouped Options:', grouped);
	});

	function handlePictographLoaded() {
		previewLoading = false;
		setPictographLoaded(optionPickerId, true);
	}

	// Clean up subscriptions when component is destroyed
	onDestroy(() => {
		unsubscribeOptionPicker();
		unsubscribeBeats();
		unsubscribeSelected();
		unsubscribeOptionsByLetterType();
	});

	const optionPickerId = 'option-picker-pictograph';

	onMount(() => {
		setPictographLoaded(optionPickerId, false);
	});
</script>

<div class="optionPicker">
	<div class="header">
		<h2 class="title">Next Options</h2>
		<ReversalFilter bind:selectedFilter disabled={isLoading} />
	</div>

	<!-- Tab Navigation -->
	<div class="tabs">
		{#each letterTypes as type}
			<button
				class="tab {selectedTab === type ? 'active' : ''}"
				on:click={() => (selectedTab = type)}
			>
				{type}
			</button>
		{/each}
	</div>

	{#if isLoading}
		<div class="loading-container">
			<LoadingSpinner />
			<p class="loading-text">Loading options...</p>
		</div>
	{:else}
		<div class="scrollArea">
			<!-- Display the section for the selected letter type -->
			<OptionSection
				title={selectedTab}
				options={$optionsByLetterType[selectedTab] || []}
				expanded={true}
			/>
		</div>
	{/if}
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

	/* Tab styles */
	.tabs {
		display: flex;
		justify-content: center;
		margin-bottom: 1rem;
	}
	.tab {
		background: none;
		border: none;
		padding: 0.5rem 1rem;
		cursor: pointer;
		font-weight: bold;
		border-bottom: 2px solid transparent;
		transition: border-color 0.3s;
	}
	.tab.active {
		border-color: #4299e1;
		color: #4299e1;
	}
	.tab:hover {
		border-color: #4299e1;
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

