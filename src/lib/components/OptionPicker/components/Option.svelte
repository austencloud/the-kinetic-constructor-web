<script lang="ts">
	import Pictograph from '../../Pictograph/Pictograph.svelte';
	import { writable } from 'svelte/store';
	import type { PictographData } from '$lib/types/PictographData';
	import { optionPickerStore } from '$lib/components/OptionPicker/optionPickerStore';
	import { isMobile } from '$lib/utils/deviceUtils';
	import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';
	import { onMount } from 'svelte';
	import { getPictographScaleFactor } from '$lib/components/OptionPicker/optionPickerLayoutUtils';

	// --- Props ---
	export let pictographData: PictographData;
	export let size: string = 'auto'; // Controlled by parent layout
	export let isSingleOption: boolean = false; // Special styling/scaling for single option

	// --- State ---
	let isMobileDevice = false;

	// --- Reactive Computations ---
	// Determine if this option is the currently selected one globally
	$: isSelected = $selectedPictograph === pictographData;

	// Calculate the scale factor based on context
	$: scaleFactor = isSingleOption ? 1.2 : getPictographScaleFactor(isMobileDevice);

	// --- Lifecycle ---
	onMount(() => {
		// Detect mobile status once the component mounts
		isMobileDevice = isMobile();
	});

	// --- Event Handlers ---
	function handleSelect() {
		// Use the central store action to handle selection
		optionPickerStore.selectOption(pictographData);
	}

	// Create a store *only* for the Pictograph component if it requires a store prop
	// If Pictograph can accept pictographData directly, this is unnecessary.
	const pictographDataStore = writable(pictographData);
	$: pictographDataStore.set(pictographData); // Keep store updated if prop changes
</script>

<div
	class="option"
	class:mobile={isMobileDevice}
	class:selected={isSelected}
	style:height={size}
	style:width={size}
	role="button"
	tabindex="0"
	on:click={handleSelect}
	on:keydown={(e) => e.key === 'Enter' && handleSelect()}
	aria-label="Select option {pictographData.letter || 'Unnamed'}"
	aria-pressed={isSelected}
>
	<div class="pictograph-container" style:transform="scale({scaleFactor})">
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
		transition: transform 0.2s ease-in-out; /* Smooth scaling transition */
		border-radius: 6px; /* Added for visual consistency */
		outline: none; /* Remove default outline, handled by focus-visible */
	}

	/* Hover effect: scale up and add shadow */
	.option:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		/* z-index is handled by parent grid item hover */
	}

	/* Subtle hover effect for mobile */
	.option.mobile:hover {
		transform: scale(1.02);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	/* Visual indication for the selected option */
	.option.selected {
		/* Example: Add a distinct border or background */
		/* box-shadow: 0 0 0 3px rgba(56, 161, 105, 0.5); */
        /* border: 2px solid #38a169; */
        background-color: rgba(56, 161, 105, 0.1);
	}

	/* Container for the pictograph itself, handles scaling */
	.pictograph-container {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
		transition: transform 0.2s ease-in-out; /* Ensure smooth scaling */
	}

	/* Accessibility: Clear focus indicator */
	.option:focus-visible {
		box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.6); /* Tailwind's focus blue */
	}
</style>
