<script lang="ts">
	import LoadingSpinner from './../../MainWidget/loading/LoadingSpinner.svelte';
	import ReversalFilter from './ReversalFilter.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { fade, crossfade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Option from './Option.svelte';
	import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';
	import { beatsStore } from '$lib/stores/sequence/beatsStore';
	import { setPictographLoaded } from '$lib/stores/ui/loadingStore';
	import optionPickerStore, {
		type OptionPickerState,
		type ReversalFilterType
	} from '$lib/stores/optionPicker/optionPickerStore';
	import { isMobile, isPortrait } from '$lib/utils/deviceUtils';

	const { optionsByLetterType } = optionPickerStore;

	// Setup crossfade transition
	const [send, receive] = crossfade({
		duration: 600,
		easing: cubicOut,
		fallback(node, params) {
			return fade(node, {
				duration: 600,
				easing: cubicOut
			});
		}
	});

	let isLoading = true;
	let selectedFilter: ReversalFilterType = 'all';
	let previewLoading = true;
	let containerHeight: number;
	let containerWidth: number;

	// Device detection
	let isMobileDevice = false;
	let isPortraitMode = false;

	let selectedTab: string = 'Type1';
	const letterTypes = ['Type1', 'Type2', 'Type3', 'Type4', 'Type5', 'Type6'];

	const unsubscribeOptionPicker = optionPickerStore.subscribe((state) => {
		isLoading = state.isLoading;
	});

	const unsubscribeBeats = beatsStore.subscribe((beats) => {
		if (beats.length > 0) {
			const sequence = beats.map((beat) => beat.pictographData);
			optionPickerStore.loadOptions(sequence);
		}
	});

	const unsubscribeSelected = selectedPictograph.subscribe((selected) => {
		if (selected) {
			previewLoading = true;
		}
	});

	// Update device detection
	const updateDeviceDetection = () => {
		isMobileDevice = isMobile();
		isPortraitMode = isPortrait();
	};

	import {
		getResponsiveLayout,
		getOptimalGridColumns,
		getOptionSize,
		getGridGap,
		getGridClass
	} from '$lib/utils/optionPickerLayoutUtils';

	$: currentOptions = $optionsByLetterType[selectedTab] || [];
	$: layout = getResponsiveLayout(
		currentOptions.length,
		containerHeight,
		containerWidth,
		isMobileDevice,
		isPortraitMode
	);
	$: ({ gridColumns, optionSize, gridGap, gridClass, scaleFactor } = layout);

	onDestroy(() => {
		unsubscribeOptionPicker();
		unsubscribeBeats();
		unsubscribeSelected();
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', updateDeviceDetection);
		}
	});

	const optionPickerId = 'option-picker-pictograph';

	onMount(() => {
		setPictographLoaded(optionPickerId, false);
		updateDeviceDetection();

		if (typeof window !== 'undefined') {
			window.addEventListener('resize', updateDeviceDetection);
		}

		if (typeof ResizeObserver !== 'undefined') {
			const resizeObserver = new ResizeObserver((entries) => {
				for (let entry of entries) {
					containerHeight = entry.contentRect.height;
					containerWidth = entry.contentRect.width;
				}
			});
			resizeObserver.observe(optionsContainer);
			return () => {
				resizeObserver.disconnect();
			};
		}
	});

	let optionsContainer: HTMLElement;
</script>

<div class="optionPicker">
	<div class="header" class:mobile={isMobileDevice}>
		<div class="title">Next Options</div>
		<div class="tabs-container">
			<div class="tabs" class:mobile-tabs={isMobileDevice}>
				{#each letterTypes as type}
					<button
						class="tab {selectedTab === type ? 'active' : ''} {isMobileDevice ? 'mobile' : ''}"
						on:click={() => (selectedTab = type)}
						aria-label={`Show ${type} options`}
					>
						{type}
					</button>
				{/each}
			</div>
		</div>
		<div class="filter-container">
			<ReversalFilter bind:selectedFilter disabled={isLoading} isMobile={isMobileDevice} />
		</div>
	</div>

	<div class="options-outer-container" bind:this={optionsContainer}>
		{#if isLoading}
			<div class="loading-container" in:fade={{ duration: 200 }}>
				<LoadingSpinner />
				<p class="loading-text">Loading options...</p>
			</div>
		{:else}
			{#key selectedTab}
				<div
					class="options-container"
					in:receive={{ key: selectedTab }}
					out:send={{ key: selectedTab }}
				>
					{#if currentOptions.length === 0}
						<div class="empty-message">
							No options available for {selectedTab}
						</div>
					{:else}
						<div
							class="options-grid {gridClass} {isMobileDevice
								? 'mobile-grid'
								: ''} {currentOptions.length === 1 ? 'single-item-grid' : ''}"
							style="grid-template-columns: {gridColumns}; gap: {gridGap};"
						>
							{#each currentOptions as option, i (`${option.letter || 'unknown'}-${i}`)}
								<div
									class:single-item={currentOptions.length === 1}
									in:fade={{ duration: 400, delay: 200 }}
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
	.optionPicker {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		background: transparent;
		padding: 20px;
	}

	.header {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		margin-bottom: 1rem;
		width: 100%;
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
		visibility: hidden; /* Hidden but preserves space */
	}

	.tabs-container {
		grid-column: 2;
		justify-self: center;
	}

	.header.mobile .tabs-container {
		grid-column: 1;
		grid-row: 1;
		width: 100%;
	}

	.filter-container {
		grid-column: 3;
		justify-self: end;
	}

	.header.mobile .filter-container {
		grid-column: 1;
		grid-row: 2;
		justify-self: center;
	}

	.tabs {
		display: flex;
		justify-content: center;
	}

	.mobile-tabs {
		flex-wrap: wrap;
		justify-content: center;
	}

	.tab {
		background: none;
		border: none;
		padding: 0.6rem 1.2rem;
		cursor: pointer;
		font-weight: bold;
		font-size: 1.35rem;
		border-bottom: 2px solid transparent;
		transition:
			border-color 0.3s,
			color 0.3s;
	}

	.tab.mobile {
		padding: 0.4rem 0.8rem;
		font-size: 1rem;
	}

	.tab.active {
		border-color: #38a169;
		color: #38a169;
	}

	.tab:hover {
		border-color: #38a169;
	}

	.options-outer-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
	}

	.options-container {
		flex: 1;
		overflow: hidden;
		background: transparent;
		border-radius: 8px;
		padding: 0.5rem;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1;
	}

	.options-grid {
		display: grid;
		width: 100%;
		min-height: 100px;
		position: relative;
		overflow: hidden;
	}

	.mobile-grid {
		width: 100%;
		max-width: 100%;
		padding: 0.2rem;
	}

	.options-grid > div {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0.1rem;
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
		min-height: 260px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.single-item {
		margin: auto;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 200px;
	}

	.loading-text {
		margin-top: 20px;
		font-size: 1.2rem;
		color: #555;
	}

	.empty-message {
		padding: 2rem;
		text-align: center;
		color: #666;
		font-style: italic;
	}

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
	}
</style>
