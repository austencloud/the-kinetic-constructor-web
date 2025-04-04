<script lang="ts">
	import Pictograph from '../../Pictograph/Pictograph.svelte';
	import { writable } from 'svelte/store';
	import type { PictographData } from '$lib/types/PictographData';
	import { optionPickerStore } from '$lib/components/OptionPicker/stores/optionPickerStore';
	import { isMobile } from '$lib/utils/deviceUtils';
	import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';
	import { onMount } from 'svelte';
	import { getPictographScaleFactor } from '../utils/layoutUtils';

	// --- Props ---
	export let pictographData: PictographData;
	export let size: string = 'auto'; // Controlled by parent layout
	export let isSingleOption: boolean = false; // Special styling/scaling for single option
	export let isPartOfTwoItems: boolean = false; // Add this prop

	// --- State ---
	let isMobileDevice = false;

	// --- Reactive Computations ---
	$: isSelected = $selectedPictograph === pictographData;
	$: scaleFactor = isSingleOption ? 1.2 : getPictographScaleFactor(isMobileDevice);

	onMount(() => {
		isMobileDevice = isMobile();
	});

	function handleSelect() {
		optionPickerStore.selectOption(pictographData);
	}

	const pictographDataStore = writable(pictographData);
	$: pictographDataStore.set(pictographData);
</script>

<div
	class="option"
	class:mobile={isMobileDevice}
	class:selected={isSelected}
	class:two-item-special={isPartOfTwoItems}
	style:height={size}
	style:width={size}
	role="button"
	tabindex="0"
	on:click={handleSelect}
	on:keydown={(e) => e.key === 'Enter' && handleSelect()}
	aria-label="Select option {pictographData.letter || 'Unnamed'}"
	aria-pressed={isSelected}
>
	<div class="pictograph-container" style:transform="scale({scaleFactor})" style:aspect-ratio="1/1">
		<Pictograph {pictographDataStore} />
	</div>
</div>

<style>
	.option {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
		cursor: pointer;
		transition: transform 0.2s ease-in-out;
		border-radius: 6px;
		outline: none;
		aspect-ratio: 1/1; /* Force square aspect ratio */
	}

	.pictograph-container {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
		aspect-ratio: 1/1; /* Ensure perfect square */
		transition: transform 0.2s ease-in-out;
	}

	/* Hover effect: scale up and add shadow */
	.option:hover {
		transform: scale(1.05);
		/* z-index is handled by parent grid item hover */
	}



	/* Visual indication for the selected option */
	.option.selected {
		/* Example: Add a distinct border or background */
		/* box-shadow: 0 0 0 3px rgba(56, 161, 105, 0.5); */
		/* border: 2px solid #38a169; */
		background-color: rgba(56, 161, 105, 0.1);
	}

	/* Container for the pictograph itself, handles scaling */

	/* Accessibility: Clear focus indicator */
	.option:focus-visible {
		box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.6); /* Tailwind's focus blue */
	}
</style>
