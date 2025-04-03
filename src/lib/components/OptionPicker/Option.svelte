<script lang="ts">
	import { writable, type Writable } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import Pictograph from '../Pictograph/Pictograph.svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import { optionPickerStore } from '$lib/stores/optionPicker/optionPickerStore';

	export let name: string;
	export let pictographData: PictographData; // Changed from 'option' to 'pictographData'
	export let selectedPictographStore: Writable<PictographData | null>;

	// Create a local writable store for this pictograph
	const localPictographStore = writable(pictographData);

	// Track if this option is selected
	$: isSelected = $selectedPictographStore?.letter === pictographData.letter;

	// Track if the pictograph is loading
	let isLoading = true;

	// Handle selection
	function handleSelect() {
		optionPickerStore.selectOption(pictographData);
	}

	// Handle pictograph loaded
	function handlePictographLoaded() {
		isLoading = false;
	}
</script>

<div
	class="option"
	class:selected={isSelected}
	role="option"
	aria-selected={isSelected}
	tabindex="0"
	on:click={handleSelect}
	on:keydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') handleSelect();
	}}
	transition:fade={{ duration: 200 }}
>
	<div class="pictograph-preview" class:loading={isLoading}>
		<Pictograph
			pictographDataStore={localPictographStore}
			onClick={handleSelect}
			showLoadingIndicator={false}
			on:loaded={handlePictographLoaded}
		/>

		{#if isLoading}
			<div class="loading-indicator"></div>
		{/if}
	</div>

	<div class="option-details">
		<span class="letter-label">{name}</span>
	</div>
</div>

<style>
	.option {
		display: flex;
		flex-direction: column;
		background-color: white;
		border: 2px solid #ddd;
		border-radius: 6px;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.2s ease;
		height: 100%;
	}

	.option:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		border-color: #b3d4fc;
	}

	.option.selected {
		border-color: #4299e1;
		background-color: #ebf8ff;
		box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.3);
	}

	.pictograph-preview {
		height: 100px;
		width: 100%;
		background-color: #f9f9f9;
		position: relative;
		overflow: hidden;
	}

	.loading-indicator {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(255, 255, 255, 0.7);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.loading-indicator::after {
		content: '';
		width: 24px;
		height: 24px;
		border: 3px solid #ddd;
		border-top-color: #4299e1;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.option-details {
		padding: 8px;
		text-align: center;
		border-top: 1px solid #eee;
	}

	.letter-label {
		font-weight: 600;
		font-size: 0.9rem;
	}

	.option:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.4);
	}
</style>
