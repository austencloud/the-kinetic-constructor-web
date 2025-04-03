<script lang="ts">
	import LoadingSpinner from './../../MainWidget/loading/LoadingSpinner.svelte';
	import ReversalFilter from './ReversalFilter.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import Option from './Option.svelte';
	import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';
	import { beatsStore } from '$lib/stores/sequence/beatsStore';
	import { setPictographLoaded } from '$lib/stores/ui/loadingStore';
	import optionPickerStore, {
		type OptionPickerState,
		type ReversalFilterType
	} from '$lib/stores/optionPicker/optionPickerStore';

	const { optionsByLetterType } = optionPickerStore;

	let isLoading = true;
	let selectedFilter: ReversalFilterType = 'all';
	let previewLoading = true;
	let containerHeight: number;
	let containerWidth: number;

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

	const unsubscribeOptionsByLetterType = optionsByLetterType.subscribe((grouped) => {
		console.log('Grouped Options:', grouped);
	});

	$: currentOptions = $optionsByLetterType[selectedTab] || [];
	$: gridColumns = getOptimalGridColumns(currentOptions.length);
	$: optionSize = getOptionSize(currentOptions.length, containerHeight, containerWidth);
	$: gridGap = getGridGap(currentOptions.length);
	$: gridClass = getGridClass(currentOptions.length);

	function getOptimalGridColumns(count: number): string {
		if (count <= 4) return 'repeat(4, 1fr)';
		if (count <= 8) return 'repeat(4, 1fr)';
		if (count <= 12) return 'repeat(6, 1fr)';
		if (count <= 16) return 'repeat(8, 1fr)';
		if (count <= 24) return 'repeat(8, 1fr)';
		return 'repeat(auto-fill, minmax(80px, 1fr))';
	}

	function getGridClass(count: number): string {
		if (count === 8) return 'exactly-eight';
		if (count <= 8) return 'small-count';
		return '';
	}

	function getGridGap(count: number): string {
		if (count === 8) return '0.5rem';
		return '0.75rem';
	}

	function getOptionSize(
		count: number,
		containerHeight: number = 0,
		containerWidth: number = 0
	): string {
		if (!containerHeight || !containerWidth) return 'auto';

		// Special case for exactly 8 pictographs (4×2 grid)
		if (count === 8) {
			// Calculate maximum size that fits both width and height constraints
			const availableHeight = containerHeight - 40; // Reduced padding for 8 items
			const availableWidth = containerWidth - 80 ; // Reduced container padding

			// For 8 items in 4×2 grid
			const maxHeightBasedOnContainer = Math.floor(availableHeight / 2 - 0); // 2 rows, smaller gap
			const maxWidthBasedOnContainer = Math.floor(availableWidth / 4 - 0); // 4 columns, smaller gap

			// Use the smaller of width or height to maintain square aspect ratio
			const size = Math.min(maxHeightBasedOnContainer, maxWidthBasedOnContainer);

			// Ensure reasonable minimum size
			return `${Math.max(100, size)}px`; // Increased minimum size
		}

		// For other small counts (1-7)
		if (count < 8) {
			const availableHeight = containerHeight - 140;
			const rowCount = count <= 4 ? 1 : 2;
			const rowGap = 12;
			const itemHeight = Math.floor(availableHeight / rowCount - rowGap);
			return `${Math.max(80, itemHeight)}px`;
		}

		// For larger counts
		if (count <= 24) {
			const availableHeight = containerHeight - 140; // Define availableHeight here
			const rowCount = count <= 16 ? 2 : 3;
			const rowGap = 12;
			const itemHeight = Math.floor(availableHeight / rowCount - rowGap);
			if (itemHeight >= 60) {
				return `${itemHeight}px`;
			}
		}

		return 'auto';
	}

	onDestroy(() => {
		unsubscribeOptionPicker();
		unsubscribeBeats();
		unsubscribeSelected();
		unsubscribeOptionsByLetterType();
	});

	const optionPickerId = 'option-picker-pictograph';

	onMount(() => {
		setPictographLoaded(optionPickerId, false);
	});

	let optionsContainer: HTMLElement;

	onMount(() => {
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
</script>

<div class="optionPicker">
	<div class="header">
		<div class="selectors">
			<ReversalFilter bind:selectedFilter disabled={isLoading} />
			<div class="tabs">
				{#each letterTypes as type}
					<button
						class="tab {selectedTab === type ? 'active' : ''}"
						on:click={() => (selectedTab = type)}
						aria-label={`Show ${type} options`}
					>
						{type}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="options-outer-container" bind:this={optionsContainer}>
		{#if isLoading}
			<div class="loading-container" in:fade={{ duration: 200 }}>
				<LoadingSpinner />
				<p class="loading-text">Loading options...</p>
			</div>
		{:else}
			<div class="options-container" in:fade={{ duration: 300 }}>
				{#if currentOptions.length === 0}
					<div class="empty-message">
						No options available for {selectedTab}
					</div>
				{:else}
					<div
						class="options-grid {gridClass}"
						style="grid-template-columns: {gridColumns}; gap: {gridGap};"
					>
						{#each currentOptions as option, i (`${option.letter || 'unknown'}-${i}`)}
							<div animate:flip={{ duration: 200 }}>
								<Option
									pictographData={option}
									selectedPictographStore={selectedPictograph}
									size={optionSize}
								/>
							</div>
						{/each}
					</div>
				{/if}
			</div>
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
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 1rem;
	}

	.selectors {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.tabs {
		display: flex;
		justify-content: center;
	}

	.tab {
		background: none;
		border: none;
		padding: 0.6rem 1.2rem;
		cursor: pointer;
		font-weight: bold;
		font-size: 1.1rem; /* Slightly increased font size */
		border-bottom: 2px solid transparent;
		transition:
			border-color 0.3s,
			color 0.3s;
	}

	.tab.active {
		border-color: #4299e1;
		color: #4299e1;
	}

	.tab:hover {
		border-color: #4299e1;
	}

	.options-outer-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.options-container {
		flex: 1;
		overflow-y: auto;
		background: transparent;
		border-radius: 8px;
		padding: 0.5rem;
	}

	.options-grid {
		display: grid;
		width: 100%;
	}

	.options-grid > div {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0.1rem;
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
</style>
