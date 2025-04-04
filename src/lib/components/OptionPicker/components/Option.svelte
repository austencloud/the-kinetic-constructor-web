<script lang="ts">
	import Pictograph from '../../Pictograph/Pictograph.svelte';
	import { writable, type Writable } from 'svelte/store';
	import type { PictographData } from '$lib/types/PictographData';
	import { optionPickerStore } from '$lib/components/OptionPicker/optionPickerStore';
	import { isMobile } from '$lib/utils/deviceUtils';
	import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';
	import { onMount } from 'svelte';
	import { getPictographScaleFactor } from '$lib/components/OptionPicker/optionPickerLayoutUtils';

	export let pictographData: PictographData;
	export let selectedPictographStore: Writable<PictographData | null> | undefined = undefined;
	export let size: string = 'auto';
	export let isSingleOption: boolean = false; // Handle single option case

	// Create a writable store from the pictograph data
	const pictographDataStore = writable(pictographData);

	// Check if we're on mobile
	let isMobileDevice = false;

	// Track if this option is currently selected
	$: isSelected = $selectedPictograph === pictographData;

	// Get scale factor from utility
	$: scaleFactor = isSingleOption ? 1.2 : getPictographScaleFactor(isMobileDevice);

	// Set mobile state on mount
	onMount(() => {
		isMobileDevice = isMobile();
	});

	function handleSelect() {
		optionPickerStore.selectOption(pictographData);
		if (selectedPictographStore) {
			selectedPictographStore.set(pictographData);
		}
	}
</script>

<div
	class="option"
	class:mobile={isMobileDevice}
	class:selected={isSelected}
	style="height: {size}; width: {size};"
	role="button"
	tabindex="0"
	on:click={handleSelect}
	on:keydown={(e) => e.key === 'Enter' && handleSelect()}
	aria-label="Select option {pictographData.letter || 'Option'}"
>
	<div class="pictograph-container" style="transform: scale({scaleFactor});">
		<Pictograph {pictographDataStore} onClick={handleSelect} />
	</div>
</div>

<style>
	.option {
		position: relative;
		display: flex; /* Ensure it fills the parent div space for hover */
		justify-content: center; /* Center content */
		align-items: center; /* Center content */
		width: 100%; /* Fill parent width */
		height: 100%; /* Fill parent height */
		cursor: pointer;
		/*
			Removed z-index and transform from base style.
			Z-index is handled by the parent grid item.
			Transform is applied on hover.
		*/
		transition: transform 0.2s ease; /* Only transition transform */
	}

	/* Apply scaling and shadow on hover */
	.option:hover {
		/* z-index: 10; <-- Removed: z-index is controlled by the parent grid item hover */
		transform: scale(1.05); /* Apply scaling directly to the option container */
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.option.mobile:hover {
		transform: scale(1.02); /* Less dramatic hover on mobile */
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); /* Adjusted shadow for mobile */
	}

	.pictograph-container {
		/* Inherit position characteristics if needed, but mainly for centering */
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
		/* Removed transition: transform - parent handles transform now */
	}

	/* Keep focus style */
	.option:focus-visible {
		outline: 3px solid #4299e1;
		outline-offset: 2px;
		border-radius: 4px; /* Optional: makes focus ring look nicer */
	}

	/* Style for selected state if needed */

</style>
