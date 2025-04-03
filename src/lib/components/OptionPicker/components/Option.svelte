<script lang="ts">
	import Pictograph from '../../Pictograph/Pictograph.svelte';
	import { writable, type Writable } from 'svelte/store';
	import type { PictographData } from '$lib/types/PictographData';
	import { optionPickerStore } from '$lib/components/OptionPicker/optionPickerStore';
	import { isMobile } from '$lib/utils/deviceUtils';
	import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';

	export let pictographData: PictographData;
	export let selectedPictographStore: Writable<PictographData | null> | undefined = undefined;
	export let size: string = 'auto';

	// Create a writable store from the pictograph data
	const pictographDataStore = writable(pictographData);

	// Check if we're on mobile
	let isMobileDevice = false;

	// Track if this option is currently selected
	$: isSelected = $selectedPictograph === pictographData;

	// Set mobile state on mount
	import { onMount } from 'svelte';

	onMount(() => {
		isMobileDevice = isMobile();
	});

	function handleSelect() {
		optionPickerStore.selectOption(pictographData);
		if (selectedPictographStore) {
			selectedPictographStore.set(pictographData);
		}
	}

	import { getPictographScaleFactor } from '$lib/components/OptionPicker/optionPickerLayoutUtils';

	// Handle single option case
	export let isSingleOption: boolean = false;

	// Get scale factor from utility
	$: scaleFactor = isSingleOption ? 1.2 : getPictographScaleFactor(isMobileDevice);
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
		z-index: 1;
		transition:
			transform 0.2s ease,
			z-index 0.2s ease;
	}

	.option:hover {
		z-index: 10;
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}
	.pictograph-container {
		position: relative;
		z-index: inherit; /* This ensures the container follows the parent's z-index */
	}
	.option:not(:hover) {
		z-index: 1;
	}
	.option.mobile {
		border-radius: 6px;
	}

	.option.mobile:hover {
		transform: scale(1.02); /* Less dramatic hover on mobile */
	}

	.pictograph-container {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		transition: transform 0.2s ease;
	}

	.option:focus-visible {
		outline: 3px solid #4299e1;
		outline-offset: 2px;
	}
</style>
