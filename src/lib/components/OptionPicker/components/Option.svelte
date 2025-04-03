<script lang="ts">
	import Pictograph from '../../Pictograph/Pictograph.svelte';
	import { writable, type Writable } from 'svelte/store';
	import type { PictographData } from '$lib/types/PictographData';
	import { optionPickerStore } from '$lib/components/OptionPicker/optionPickerStore';
	import { isMobile } from '$lib/utils/deviceUtils';

	export let pictographData: PictographData;
	export let selectedPictographStore: Writable<PictographData | null> | undefined = undefined;
	export let size: string = 'auto';

	// Create a writable store from the pictograph data
	const pictographDataStore = writable(pictographData);
	
	// Check if we're on mobile
	let isMobileDevice = false;
	
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
		position: relative;
		transition: transform 0.2s ease, opacity 0.5s ease-in-out;
		opacity: 1;
	}
	
	.option:hover {
		transform: scale(1.05);
	}
	
	.option.mobile {
		border-radius: 6px;
	}
	
	.option.mobile:hover {
		transform: scale(1.02); /* Less dramatic hover on mobile */
	}

	.pictograph-container {
		position: relative;
		width: 95%;
		height: 95%;
		display: flex;
		justify-content: center;
		align-items: center;
		max-width: 95%;
		max-height: 95%;
		transition: transform 0.2s ease;
	}

	.option:focus-visible {
		outline: 3px solid #4299e1;
		outline-offset: 2px;
	}
</style>