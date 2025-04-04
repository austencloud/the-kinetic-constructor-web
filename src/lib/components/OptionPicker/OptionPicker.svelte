<script lang="ts">
	// Import statements...
	import LoadingSpinner from '../MainWidget/loading/LoadingSpinner.svelte';
	import SortOptions from './components/SortOptions.svelte';
	import Option from './components/Option.svelte';
	import { onMount, onDestroy } from 'svelte';
	// *** Re-added crossfade and cubicOut ***
	import { fade, crossfade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';
	import { beatsStore } from '$lib/stores/sequence/beatsStore';
	import { setPictographLoaded } from '$lib/stores/ui/loadingStore';
	import optionPickerStore, {
		type ReversalFilterType,
		type SortMethodType
	} from '$lib/components/OptionPicker/optionPickerStore';
	import { isMobile, isPortrait } from '$lib/utils/deviceUtils';
	import {
		getResponsiveLayout,
		type GridConfiguration
	} from '$lib/components/OptionPicker/optionPickerLayoutUtils';

	// --- State and Store Subscriptions ---
	const { optionsByLetterType, loadOptions } = optionPickerStore;

	let isLoading = true;
	let selectedSortMethod: SortMethodType = 'type';
	let previewLoading = true;
	let containerHeight: number = 0;
	let containerWidth: number = 0;
	let isMobileDevice = false;
	let isPortraitMode = false;
	let selectedTab: string = 'Type1';
	let categoryTypes: string[] = [];
	let headerHeight: number = 0;

	// Refs for element binding
	let headerRef: HTMLElement;
	let optionsOuterContainerRef: HTMLElement;

	// --- Transitions ---
	// *** Reinstated crossfade definition ***
	const [send, receive] = crossfade({
		duration: 600, // Adjust duration as needed
		easing: cubicOut,
		fallback(node, params) {
			// Fallback to fade if crossfade fails
			return fade(node, { duration: 600, easing: cubicOut });
		}
	});

	// --- Store Subscriptions (Simplified) ---
	const unsubscribeOptionPicker = optionPickerStore.subscribe((state) => {
		isLoading = state.isLoading;
		selectedSortMethod = state.sortMethod;
	});

	const unsubscribeBeats = beatsStore.subscribe((beats) => {
		if (beats && beats.length > 0) {
			const sequence = beats.map((beat) => beat.pictographData);
			loadOptions(sequence);
		} else {
			loadOptions([]);
		}
	});

	const unsubscribeSelected = selectedPictograph.subscribe((selected) => {
		if (selected) {
			previewLoading = true;
		}
	});

	// --- Reactive Declarations ---
	$: {
		const groupedOptions = $optionsByLetterType;
		if (groupedOptions) {
			const newCategoryTypes = Object.keys(groupedOptions).sort();
			if (JSON.stringify(categoryTypes) !== JSON.stringify(newCategoryTypes)) {
				categoryTypes = newCategoryTypes;
				if (!categoryTypes.includes(selectedTab) && categoryTypes.length > 0) {
					selectedTab = categoryTypes[0];
				} else if (categoryTypes.length === 0) {
					selectedTab = '';
				}
			}
		} else {
			if (categoryTypes.length > 0) {
				categoryTypes = [];
				selectedTab = '';
			}
		}
	}

	$: currentOptions = $optionsByLetterType[selectedTab] || [];

	$: layout = getResponsiveLayout(
		currentOptions.length,
		containerHeight,
		containerWidth,
		isMobileDevice,
		isPortraitMode
	);

	$: ({ gridColumns, optionSize, gridGap, gridClass } = layout);

	// --- Lifecycle Hooks ---
	let headerResizeObserver: ResizeObserver | null = null;
	let containerResizeObserver: ResizeObserver | null = null;

	const updateDeviceDetection = () => {
		isMobileDevice = isMobile();
		isPortraitMode = isPortrait();
	};

	onMount(() => {
		setPictographLoaded('option-picker-pictograph', false);
		updateDeviceDetection();

		if (typeof window !== 'undefined') {
			window.addEventListener('resize', updateDeviceDetection);
		}

		// --- Corrected ResizeObserver Setup ---
		if (typeof ResizeObserver !== 'undefined') {
			// Observer for Header Height (if still needed for calculations)
			headerResizeObserver = new ResizeObserver(() => {
				if (headerRef) {
					const newHeight = headerRef.offsetHeight;
					if (newHeight !== headerHeight) {
						headerHeight = newHeight;
					}
				}
			});
			if (headerRef) {
				headerResizeObserver.observe(headerRef);
				headerHeight = headerRef.offsetHeight;
			}

			// Observer for Container Dimensions
			containerResizeObserver = new ResizeObserver((entries) => {
				for (let entry of entries) {
					const newHeight = entry.contentRect.height;
					const newWidth = entry.contentRect.width;
					if (newHeight !== containerHeight) {
						containerHeight = newHeight;
					}
					if (newWidth !== containerWidth) {
						containerWidth = newWidth;
					}
				}
			});
			if (optionsOuterContainerRef) {
				containerResizeObserver.observe(optionsOuterContainerRef);
				containerHeight = optionsOuterContainerRef.clientHeight;
				containerWidth = optionsOuterContainerRef.clientWidth;
			}
		} else {
			// Fallback
			const updateDimensions = () => {
				if (headerRef) headerHeight = headerRef.offsetHeight;
				if (optionsOuterContainerRef) {
					containerHeight = optionsOuterContainerRef.clientHeight;
					containerWidth = optionsOuterContainerRef.clientWidth;
				}
			};
			window.addEventListener('resize', updateDimensions);
			updateDimensions();
		}

		// Cleanup function
		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('resize', updateDeviceDetection);
			}
			if (headerResizeObserver) headerResizeObserver.disconnect();
			if (containerResizeObserver) containerResizeObserver.disconnect();
			unsubscribeOptionPicker();
			unsubscribeBeats();
			unsubscribeSelected();
		};
	});
</script>

<div class="optionPicker">
	<SortOptions isMobile={isMobile()} />
	<div class="header" bind:this={headerRef} class:mobile={isMobileDevice}>
		<div class="title">Next Options</div>
		<div class="tabs-container">
			<div class="tabs" class:mobile-tabs={isMobileDevice}>
				{#if categoryTypes.length > 0}
					{#each categoryTypes as type}
						<button
							class="tab"
							class:active={selectedTab === type}
							class:mobile={isMobileDevice}
							on:click={() => (selectedTab = type)}
							aria-label={`Show ${type} options`}
						>
							{type}
						</button>
					{/each}
				{:else if !isLoading}
					<span class="no-categories-message">No categories available</span>
				{/if}
			</div>
		</div>
	</div>

	<div class="options-outer-container" bind:this={optionsOuterContainerRef}>
		{#if isLoading}
			<div class="loading-container" transition:fade={{ duration: 200 }}>
				<LoadingSpinner />
				<p class="loading-text">Loading options...</p>
			</div>
		{:else}
			{#key selectedTab}
				<div
					class="options-container"
					out:send={{ key: selectedTab }}
					in:receive={{ key: selectedTab }}
				>
					{#if currentOptions.length === 0}
						<div class="empty-message">No options available for {selectedTab}</div>
					{:else}
						<div
							class="options-grid {gridClass}"
							class:mobile-grid={isMobileDevice}
							class:single-item-grid={currentOptions.length === 1}
							class:eight-item-grid={currentOptions.length === 8}
							style="grid-template-columns: {gridColumns}; gap: {gridGap};"
						>
							{#each currentOptions as option, i (`${option.letter || 'unknown'}-${i}-${option.startPos}-${option.endPos}`)}
								<div
									class="grid-item-wrapper"
									class:single-item={currentOptions.length === 1}
									transition:fade={{ duration: 300, delay: 50 * i }}
								>
									<Option
										pictographData={option}
										selectedPictographStore={selectedPictograph}
										size={optionSize}
										isSingleOption={currentOptions.length === 1}
									/>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/key}
		{/if}
	</div>
</div>

<style>
	/* Styles remain the same as option_picker_svelte_update_06 */
	.optionPicker {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		background: transparent;
		padding: 20px;
		position: relative;
		box-sizing: border-box;
		overflow: hidden;
	}

	.header {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		margin-bottom: 1rem;
		width: 100%;
		position: relative;
		flex-shrink: 0;
	}

	.header.mobile {
		grid-template-columns: 1fr;
		grid-template-rows: auto auto;
		gap: 0.5rem;
	}

	.title {
		font-size: 1.25rem;
		font-weight: bold;
		grid-column: 1;
		justify-self: start;
		visibility: hidden; /* Keep hidden title */
	}
	.tabs-container {
		grid-column: 2; /* Original positioning */
		justify-self: center;
	}
	.header.mobile .tabs-container {
		grid-column: 1; /* Original mobile positioning */
		grid-row: 1;
		width: 100%;
	}
	.tabs {
		display: flex;
		justify-content: center;
		flex-wrap: nowrap;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}
	.tabs::-webkit-scrollbar {
		display: none;
	}
	.mobile-tabs {
		flex-wrap: wrap; /* Original mobile wrapping */
		overflow-x: hidden;
	}
	.tab {
		background: none;
		border: none;
		padding: 0.6rem 1.2rem; /* Original padding */
		cursor: pointer;
		font-weight: bold; /* Original font-weight */
		font-size: 1.35rem; /* Original font-size */
		color: #555;
		border-bottom: 2px solid transparent; /* Original border */
		transition:
			border-color 0.3s,
			color 0.3s;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.tab.mobile {
		padding: 0.4rem 0.8rem; /* Original mobile padding */
		font-size: 1rem; /* Original mobile font-size */
	}
	.tab.active {
		border-color: #38a169; /* Original active style */
		color: #38a169;
	}
	.tab:hover:not(.active) {
		border-color: #aaa; /* Adjusted hover border for non-active */
		color: #333;
	}
	.no-categories-message {
		color: #888;
		font-style: italic;
		padding: 0.5rem 1rem;
	}

	/* --- Layout Changes Start --- */

	.options-outer-container {
		flex: 1; /* Takes up remaining vertical space */
		display: flex; /* Still use flex to define space */
		overflow: hidden;
		position: relative; /* *** Added: Needed for absolute child positioning *** */
		border: 1px solid #eee;
		border-radius: 8px;
	}

	.options-container {
		/* *** Changed: Use absolute positioning to fill parent *** */
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		/* Removed flex: 1 */
		overflow: auto; /* Allow this container to scroll if grid overflows */
		background: transparent;
		border-radius: 8px;
		padding: 0.5rem;
		display: flex; /* Keep flex for centering content */
		justify-content: center;
		align-items: flex-start; /* Align grid to top */
		box-sizing: border-box;
		/* z-index might be needed if other positioned elements overlap */
		/* z-index: 1; */
	}

	/* --- Layout Changes End --- */

	.options-grid {
		display: grid;
		max-width: 100%;
		position: relative;
		justify-content: center;
		align-content: flex-start;
	}

	.grid-item-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0.1rem;
		position: relative;
		z-index: 1;
		transition: z-index 0s 0.2s;
	}

	.grid-item-wrapper:hover {
		z-index: 10;
		transition-delay: 0s;
	}

	.mobile-grid {
		width: 100%;
		max-width: 100%;
		padding: 0.2rem;
		justify-content: center;
		align-content: center;
	}
	.option-container-selected {
		z-index: 10;
	}
	.options-grid.option-selected > div:not(.option-container-selected) {
		opacity: 0.6;
	}
	.small-count {
		align-content: center;
		justify-content: center;
	}
	.exactly-eight {
		align-content: center;
		justify-content: center;
		margin: 0 auto;
		max-width: 95%;
	}
	.single-option {

		align-content: center;
		justify-content: center;
		height: 100%;
		display: flex;
		margin: 0 auto;
	}
	.single-item-grid {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
	}
	.single-item {
		margin: auto;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.loading-container,
	.empty-message {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
		padding: 2rem;
		text-align: center;
		color: #666;
		box-sizing: border-box;
	}
	.loading-text {
		margin-top: 1rem;
		font-size: 1.1rem;
	}
	.empty-message {
		font-style: italic;
	}

	/* Media Queries remain the same */
	@media (max-width: 768px) {
		.optionPicker {
			padding: 10px;
		}
		.options-grid:not(.mobile-grid):not(.exactly-eight) {
			grid-template-columns: repeat(4, 1fr) !important;
		}
	}
	@media (max-width: 480px) {
		.optionPicker {
			padding: 8px;
		}
		.options-grid:not(.mobile-grid):not(.exactly-eight) {
			grid-template-columns: repeat(3, 1fr) !important;
			gap: 0.5rem;
		}
		.tab {
			/* Adjust mobile tab styles if needed */
			font-size: 0.9rem;
			padding: 0.4rem 0.6rem;
		}
	}
</style>
