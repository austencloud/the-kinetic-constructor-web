<!-- src/lib/components/OptionPicker/Option.svelte -->
<script lang="ts">
	import { writable, type Writable } from 'svelte/store';
	import { fly } from 'svelte/transition';
	import Pictograph from '../Pictograph/Pictograph.svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import { optionPickerStore } from '$lib/stores/optionPicker/optionPickerStore';
	import { OptionDataService } from '$lib/services/OptionDataService';

	export let pictographData: PictographData;
	export let selectedPictographStore: Writable<PictographData | null> | undefined = undefined;

	// Create a writable store from the pictograph data
	const pictographDataStore = writable(pictographData);

	// Derive the display number from the letter
	$: displayNumber = pictographData.letter
		? OptionDataService.getLetterNumber(pictographData.letter)
		: 1;

	function handleSelect() {
		optionPickerStore.selectOption(pictographData);
		if (selectedPictographStore) {
			selectedPictographStore.set(pictographData);
		}
	}
</script>

<button
	type="button"
	class="option"
	on:click={handleSelect}
	transition:fly={{ y: 20, duration: 300 }}
	aria-label="Select option"
>
	<div class="pictograph-container">
		<Pictograph {pictographDataStore} />
	</div>
</button>
<div class="option-details">
	<span class="number-badge">{displayNumber}</span>
	<span class="letter-label">{pictographData.letter || 'Option'}</span>
</div>

<style>
	.option {
		display: flex;
		flex-direction: column;
		background-color: white;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s ease;
		overflow: hidden;
		height: 100%;
		width: 100%;
		padding: 0;
		margin: 0;
	}

	.option:hover {
		border-color: #4299e1;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.pictograph-container {
		flex-grow: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0.5rem;
	}

	.option-details {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		border-top: 1px solid #eee;
		background-color: #f9f9f9;
	}

	.number-badge {
		background-color: #4299e1;
		color: white;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		font-weight: bold;
		font-size: 0.8rem;
	}

	.letter-label {
		font-weight: 600;
		color: #333;
	}
</style>
