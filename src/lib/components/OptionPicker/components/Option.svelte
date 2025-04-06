<!-- src/lib/components/OptionPicker/components/Option.svelte -->
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
	export let size: string = 'auto'; // Controlled by parent layout
	export let isSingleOption: boolean = false; // Special styling/scaling for single option
	export let isPartOfTwoItems: boolean = false; // Special handling for two-item layouts

	// --- State ---
	let isMobileDevice = false;
	let containerWidth = 0;
	let containerElement: HTMLElement;

	// --- Reactive Computations ---
	$: isSelected = $selectedPictograph === pictographData;
	$: scaleFactor = calculateScaleFactor(isSingleOption, isPartOfTwoItems, isMobileDevice, containerWidth);
	$: ariaLabel = `Select option ${pictographData.letter || 'Unnamed'}`;

	function calculateScaleFactor(
		isSingle: boolean, 
		isPartOfTwo: boolean, 
		isMobile: boolean,
		width: number
	): number {
		if (isSingle) return 1;
		if (isPartOfTwo) return isMobile ? 1 : 1;
		return getPictographScaleFactor(width, isMobile);
	}

	onMount(() => {
		isMobileDevice = isMobile();
		
		// Set up resize observer to track container width for responsive scaling
		if (typeof ResizeObserver !== 'undefined' && containerElement) {
			const resizeObserver = new ResizeObserver(entries => {
				const entry = entries[0];
				if (entry) {
					containerWidth = entry.contentRect.width;
				}
			});
			
			resizeObserver.observe(containerElement);
			
			return () => {
				resizeObserver.disconnect();
			};
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
	style:width={size}
	style:height={size}
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
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
		cursor: pointer;
		transition: transform 0.2s ease-in-out, background-color 0.2s ease;
		border-radius: 6px;
		outline: none;
		aspect-ratio: 1/1; /* Force square aspect ratio */
		overflow: hidden;
	}

	.pictograph-container {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
		transition: transform 0.2s ease-in-out;
	}

	/* Hover effect: scale up slightly and add subtle background */
	.option:hover {
		transform: scale(1.05);
		background-color: rgba(243, 244, 246, 0.5);
	}

	/* Add a subtle press effect */
	.option:active {
		transform: scale(0.98);
	}

	/* Visual indication for the selected option */
	.option.selected {
		background-color: rgba(56, 161, 105, 0.1);
	}

	/* Special styling for single option */
	.option.single-option {
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
	}

	.option.single-option:hover {
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
	}

	/* Special styling for options in two-item layout */
	.option.two-item-option {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.option.two-item-option:hover {
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	/* Mobile optimizations */
	.option.mobile {
		transition: transform 0.15s ease-in-out;
	}

	.option.mobile:hover {
		transform: scale(1.03);
	}

	/* Accessibility: Clear focus indicator */
	.option:focus-visible {
		box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.6);
	}
</style>