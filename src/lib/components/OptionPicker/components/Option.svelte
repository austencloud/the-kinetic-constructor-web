<!-- src/lib/components/OptionPicker/Option.svelte -->
<script lang="ts">
	import Pictograph from './../../Pictograph/Pictograph.svelte';
	import { writable, type Writable } from 'svelte/store';
	import { fly } from 'svelte/transition';
	import type { PictographData } from '$lib/types/PictographData';
	import { optionPickerStore } from '$lib/stores/optionPicker/optionPickerStore';

	export let pictographData: PictographData;
	export let selectedPictographStore: Writable<PictographData | null> | undefined = undefined;
	export let size: string = 'auto';

	// Create a writable store from the pictograph data
	const pictographDataStore = writable(pictographData);

	function handleSelect() {
		optionPickerStore.selectOption(pictographData);
		if (selectedPictographStore) {
			selectedPictographStore.set(pictographData);
		}
	}
</script>

<div
	class="option"
	style="height: {size}; width: {size};"
	transition:fly={{ y: 10, duration: 200 }}
	role="button"
	tabindex="0"
	on:click={handleSelect}
	on:keydown={(e) => e.key === 'Enter' && handleSelect()}
	aria-label="Select option {pictographData.letter || 'Option'}"
>
	<div class="pictograph-container">
		<Pictograph {pictographDataStore} onClick={handleSelect} />
	</div>
</div>

<style>
	.option {
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: transparent;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		overflow: visible;
		padding: 0;
		margin: 0;
		/* Add space for hover scaling */
		position: relative;
	}

	.pictograph-container {
		position: relative;
		width: 95%;
		height: 95%;
		display: flex;
		justify-content: center;
		align-items: center;
		/* This ensures the pictograph has room to scale on hover */
		max-width: 95%;
		max-height: 95%;
	}

	.option:focus-visible {
		outline: 3px solid #4299e1;
		outline-offset: 2px;
	}
</style>