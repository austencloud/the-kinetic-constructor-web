<script lang="ts">
	import Pictograph from '../../Pictograph/Pictograph.svelte';
	import { writable } from 'svelte/store';
	import type { PictographData } from '$lib/types/PictographData';
	import { optionPickerStore } from '$lib/components/OptionPicker/stores/optionPickerStore';
	import { isMobile } from '$lib/utils/deviceUtils';
	import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';
	import { onMount } from 'svelte';
	import { getPictographScaleFactor } from '../utils/layoutConfig/layoutUtils';

	// --- Props ---
	export let pictographData: PictographData;
	// 'size' prop might be redundant now if parent controls size via CSS var
	// export let size: string = 'auto';
	export let isSingleOption: boolean = false;
	export let isPartOfTwoItems: boolean = false;

	// --- State ---
	let isMobileDevice = false;
	let containerWidth = 0; // Still useful for scale factor calculation
	let containerElement: HTMLElement; // The root .option element

	// --- Reactive Computations ---
	$: isSelected = $selectedPictograph === pictographData;
	// Pass the container width to get the appropriate scale factor
	$: scaleFactor = calculateScaleFactor(isSingleOption, isPartOfTwoItems, isMobileDevice, containerWidth);
	$: ariaLabel = `Select option ${pictographData.letter || 'Unnamed'}`;

	// Simplified scale factor calculation - relies more on layoutUtils now
	function calculateScaleFactor(
		isSingle: boolean,
		isPartOfTwo: boolean,
		isMobile: boolean,
		width: number // Width of the .option container
	): number {
		// Potentially override scale for single/two items if needed,
		// but layoutUtils might already handle this via optionSize calculation.
		// if (isSingle) return 1.1; // Example override
		// if (isPartOfTwo) return 1.05; // Example override

		// Primarily rely on the scale factor determined by layoutUtils based on device/width
		return getPictographScaleFactor(width, isMobile);
	}

	onMount(() => {
		isMobileDevice = isMobile();

		// Observe the .option element to get its actual rendered width
		if (typeof ResizeObserver !== 'undefined' && containerElement) {
			const resizeObserver = new ResizeObserver((entries) => {
				const entry = entries[0];
				if (entry) {
					// Update containerWidth based on the observed size of the .option element
					containerWidth = entry.contentRect.width;
				}
			});

			resizeObserver.observe(containerElement);

			// Initial measurement
			containerWidth = containerElement.clientWidth;


			return () => {
				resizeObserver.disconnect();
			};
		} else {
			// Fallback for browsers without ResizeObserver
			containerWidth = containerElement?.clientWidth ?? 0;
		}
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
	class:single-option={isSingleOption}
	class:two-item-option={isPartOfTwoItems}
	bind:this={containerElement}
	role="button"
	tabindex="0"
	on:click={handleSelect}
	on:keydown={(e) => e.key === 'Enter' && handleSelect()}
	aria-label={ariaLabel}
	aria-pressed={isSelected}
	>
	<div
		class="pictograph-container"
		style="transform: scale({scaleFactor})"
	>
		<Pictograph {pictographDataStore} />
	</div>
</div>

<style>
	.option {
		/* --- Aspect Ratio Fix --- */
		/* Let the parent (.grid-item-wrapper) control the size and aspect ratio. */
		/* Remove width, height, and aspect-ratio here. */
		/* --- End Fix --- */

		position: relative; /* Keep for potential absolute positioning inside */
		display: flex; /* Use flex to center the pictograph container */
		justify-content: center;
		align-items: center;
		width: 100%; /* Fill the parent wrapper */
		height: 100%; /* Fill the parent wrapper */
		cursor: pointer;
		transition: transform 0.2s ease-in-out, background-color 0.2s ease;
		border-radius: 6px; /* Keep rounded corners */
		outline: none;
		overflow: hidden; /* Ensure content like hover effects don't spill */
	}

	.pictograph-container {
		display: flex; /* Still useful for centering if Pictograph isn't 100% */
		justify-content: center;
		align-items: center;
		width: 100%; /* Make container fill the option div */
		height: 100%; /* Make container fill the option div */
		transition: transform 0.2s ease-in-out;
		/* The Pictograph component inside should handle its own scaling (e.g., SVG viewBox) */
	}

	/* Hover effect: scale up slightly and add subtle background */
	/* Apply hover to the main .option div */
	.option:hover {
		transform: scale(1.05); /* Scale the whole option */
		background-color: rgba(243, 244, 246, 0.5); /* Subtle background */
	}

	/* Add a subtle press effect */
	.option:active {
		transform: scale(0.98);
	}

	/* Visual indication for the selected option */
	.option.selected {
		background-color: rgba(56, 161, 105, 0.1); /* Subtle green background */
		/* Add a border or stronger indicator if needed */
		/* box-shadow: inset 0 0 0 2px rgba(56, 161, 105, 0.5); */
	}

	/* Special styling for single/two options (optional, could be handled by layout) */
	.option.single-option,
	.option.two-item-option {
		/* Add subtle shadow or border if desired */
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.option.single-option:hover,
	.option.two-item-option:hover {
		/* Enhance shadow on hover */
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	/* Mobile optimizations */
	.option.mobile {
		transition: transform 0.15s ease-in-out;
	}

	.option.mobile:hover {
		transform: scale(1.03); /* Slightly less pronounced hover scale on mobile */
	}

	/* Accessibility: Clear focus indicator */
	.option:focus-visible {
		box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.6); /* Standard focus ring */
		/* Ensure z-index works with focus */
		z-index: 11;
	}
</style>
