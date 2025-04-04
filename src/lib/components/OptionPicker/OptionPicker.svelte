<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { fade, crossfade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	// Components
	import LoadingSpinner from '../MainWidget/loading/LoadingSpinner.svelte';
	import SortOptions from './components/SortOptions.svelte';
	import Option from './components/Option.svelte'; // Expects pictographData, size, isSingleOption

	// Stores & Types
	import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore'; // Used directly by Option component
	import { beatsStore } from '$lib/stores/sequence/beatsStore';
	import type { PictographData } from '$lib/types/PictographData';

	// Utilities & Layout
	import { isMobile, isPortrait } from '$lib/utils/deviceUtils';
	import { getResponsiveLayout, type ResponsiveLayoutConfig } from './optionPickerLayoutUtils';
	import { optionPickerStore } from './optionPickerStore';

	// --- Transitions ---
	const [send, receive] = crossfade({
		duration: 500,
		easing: cubicOut,
		fallback: (node, params) => fade(node, { duration: 300, easing: cubicOut })
	});

	// --- State ---
	let containerHeight: number = 0;
	let containerWidth: number = 0;
	let isMobileDevice = isMobile();
	let isPortraitMode = false;
	let selectedTab: string | null = null;
	let headerHeight: number = 0;

	// Refs
	let headerRef: HTMLElement;
	let optionsOuterContainerRef: HTMLElement;

	// --- Store Access ---
	const { groupedOptions, loadOptions } = optionPickerStore;

	// Subscribe to beat changes
	const unsubscribeBeats = beatsStore.subscribe((beats) => {
		const sequence = beats?.map((beat) => beat.pictographData) ?? [];
		loadOptions(sequence);
	});

	// --- Reactive Declarations ---
	$: categoryKeys = $groupedOptions ? Object.keys($groupedOptions).sort() : [];
	$: currentOptions = (selectedTab && $groupedOptions?.[selectedTab]) || [];
	$: {
		if (categoryKeys.length > 0) {
			if (!selectedTab || !categoryKeys.includes(selectedTab)) {
				selectedTab = categoryKeys[0];
			}
		} else {
			selectedTab = null;
		}
	}
	$: layout = getResponsiveLayout(
		currentOptions.length,
		containerHeight,
		containerWidth,
		isMobileDevice,
		isPortraitMode
	);

	$: ({ gridColumns, optionSize, gridGap, gridClass } = layout);

	// --- Lifecycle & Observers ---
	let headerResizeObserver: ResizeObserver | null = null;
	let containerResizeObserver: ResizeObserver | null = null;

	const updateDeviceDetection = () => {
		isMobileDevice = isMobile();
		isPortraitMode = isPortrait();
	};

	onMount(() => {
		updateDeviceDetection();
		window.addEventListener('resize', updateDeviceDetection);

		if (typeof ResizeObserver !== 'undefined') {
			// Observe header
			headerResizeObserver = new ResizeObserver(() => {
				if (headerRef) headerHeight = headerRef.offsetHeight;
			});
			if (headerRef) {
				headerResizeObserver.observe(headerRef);
				headerHeight = headerRef.offsetHeight;
			}

			// Observe the main options container
			containerResizeObserver = new ResizeObserver((entries) => {
				const entry = entries[0];
				if (entry) {
					const { width, height } = entry.contentRect;
					if (width !== containerWidth) {
						containerWidth = width;
					}
					if (height !== containerHeight) {
						containerHeight = height;
					}
				}
			});
			if (optionsOuterContainerRef) {
				containerResizeObserver.observe(optionsOuterContainerRef);
				tick().then(() => {
					if (optionsOuterContainerRef) {
						containerWidth = optionsOuterContainerRef.clientWidth;
						containerHeight = optionsOuterContainerRef.clientHeight;
					}
				});
			}
		} else {
			// Fallback
			const updateDimensionsFallback = () => {
				if (headerRef) headerHeight = headerRef.offsetHeight;
				if (optionsOuterContainerRef) {
					containerWidth = optionsOuterContainerRef.clientWidth;
					containerHeight = optionsOuterContainerRef.clientHeight;
				}
			};
			window.addEventListener('resize', updateDimensionsFallback);
			tick().then(updateDimensionsFallback);
		}

		// Cleanup
		return () => {
			window.removeEventListener('resize', updateDeviceDetection);
			headerResizeObserver?.disconnect();
			containerResizeObserver?.disconnect();
			unsubscribeBeats();
		};
	});
</script>

<div class="option-picker">
	<SortOptions {isMobileDevice} />

	<div class="header" bind:this={headerRef} class:mobile={isMobileDevice}>
		<div class="title" aria-hidden="true">Next Options</div>

		<div class="tabs-container">
			<div
				class="tabs"
				class:mobile-tabs={isMobileDevice}
				role="tablist"
				aria-label="Option Categories"
			>
				{#if categoryKeys.length > 0}
					{#each categoryKeys as categoryKey (categoryKey)}
						<button
							class="tab"
							class:active={selectedTab === categoryKey}
							class:mobile={isMobileDevice}
							on:click={() => (selectedTab = categoryKey)}
							role="tab"
							aria-selected={selectedTab === categoryKey}
							aria-controls="options-panel-{categoryKey}"
							id="tab-{categoryKey}"
						>
							{categoryKey}
						</button>
					{/each}
				{:else if !$optionPickerStore.isLoading}
					<span class="no-categories-message">No categories available</span>
				{/if}
			</div>
		</div>
	</div>

	<div class="options-outer-container" bind:this={optionsOuterContainerRef}>
		{#if $optionPickerStore.isLoading}
			<div class="message-container loading" transition:fade={{ duration: 200 }}>
				<LoadingSpinner />
				<p>Loading options...</p>
			</div>
		{:else if selectedTab && currentOptions}
			{#key selectedTab}
				<div
					class="options-panel"
					role="tabpanel"
					aria-labelledby="tab-{selectedTab}"
					id="options-panel-{selectedTab}"
					out:send={{ key: selectedTab }}
					in:receive={{ key: selectedTab }}
				>
					{#if currentOptions.length === 0}
						<div class="message-container empty">
							No options available for {selectedTab}
						</div>
					{:else}
						<div
							class="options-grid {gridClass}"
							class:mobile-grid={isMobileDevice}
							class:single-item-grid={currentOptions.length === 1}
							style:grid-template-columns={gridColumns}
							style:gap={gridGap}
						>
							{#each currentOptions as option, i (`${option.letter}-${option.startPos}-${option.endPos}-${i}`)}
								<div
									class="grid-item-wrapper"
									class:single-item={currentOptions.length === 1}
									transition:fade={{ duration: 250, delay: 30 * i, easing: cubicOut }}
								>
									<Option
										pictographData={option}
										size={optionSize}
										isSingleOption={currentOptions.length === 1}
									/>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/key}
		{:else if !selectedTab && categoryKeys.length > 0}
			<div class="message-container initial">Select a category above.</div>
		{:else if categoryKeys.length === 0}
			<div class="message-container empty">No options generated.</div>
		{/if}
	</div>
</div>

<style>
	.option-picker {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%; /* Ensure it fills parent */
		padding: clamp(10px, 2vw, 20px); /* Responsive padding */
		position: relative;
		box-sizing: border-box;
		overflow: hidden; /* Prevent content spillover */
		background-color: var(--background-color, transparent); /* Use CSS var or default */
	}

	.header {
		display: grid;
		grid-template-columns: auto 1fr auto; /* Allow space for sort button, center tabs */
		align-items: center;
		margin-bottom: clamp(0.8rem, 1.5vw, 1.2rem); /* Responsive margin */
		width: 100%;
		position: relative; /* For absolute positioning of SortOptions */
		flex-shrink: 0; /* Prevent header from shrinking */
		gap: 1rem;
	}

	.header.mobile {
		grid-template-columns: 1fr; /* Stack elements */
		grid-template-rows: auto auto;
		gap: 0.5rem;
		margin-bottom: 0.8rem;
	}

	/* Keep title in DOM for structure but hide visually */
	.title {
		font-size: 1.25rem;
		font-weight: 600;
		grid-column: 1; /* Position left */
		justify-self: start;
		visibility: hidden; /* Hide but maintain layout space */
		pointer-events: none; /* Prevent interaction */
		width: 0; /* Collapse width */
		opacity: 0;
	}

	.tabs-container {
		grid-column: 2; /* Center column */
		justify-self: center; /* Center within the column */
		overflow: hidden; /* Prevent tabs overflowing container */
	}

	.header.mobile .tabs-container {
		grid-column: 1;
		grid-row: 1; /* Tabs appear first on mobile */
		width: 100%;
		justify-self: stretch; /* Take full width */
	}

	.tabs {
		display: flex;
		justify-content: center;
		flex-wrap: nowrap; /* Prevent wrapping by default */
		overflow-x: auto; /* Allow horizontal scrolling if needed */
		-webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
		scrollbar-width: none; /* Hide scrollbar (Firefox) */
		padding-bottom: 4px; /* Space for focus ring */
		margin-bottom: -4px; /* Counteract padding */
	}
	.tabs::-webkit-scrollbar {
		display: none; /* Hide scrollbar (Chrome, Safari) */
	}

	.mobile-tabs {
		/* On mobile, allow wrapping if too many tabs */
		flex-wrap: wrap;
		justify-content: flex-start; /* Align tabs left on mobile */
		overflow-x: hidden; /* Disable horizontal scroll when wrapping */
	}

	.tab {
		background: none;
		border: none;
		padding: 0.6rem clamp(0.8rem, 2vw, 1.2rem); /* Responsive padding */
		cursor: pointer;
		font-weight: 500; /* Medium weight */
		font-size: clamp(0.9rem, 1.8vw, 1.1rem); /* Responsive font size */
		color: #4b5563; /* Tailwind gray-600 */
		border-bottom: 3px solid transparent; /* Underline indicator */
		transition:
			border-color 0.2s ease-in-out,
			color 0.2s ease-in-out;
		white-space: nowrap; /* Prevent text wrapping */
		flex-shrink: 0; /* Prevent tabs from shrinking */
		border-radius: 4px 4px 0 0; /* Slight rounding at top */
	}

	.tab.mobile {
		padding: 0.5rem 0.8rem;
		font-size: 0.95rem;
	}

	.tab.active {
		border-color: #3b82f6; /* Tailwind blue-500 */
		color: #1e40af; /* Tailwind blue-800 */
		font-weight: 600;
	}

	.tab:hover:not(.active) {
		color: #1f2937; /* Tailwind gray-800 */
		border-color: #d1d5db; /* Tailwind gray-300 */
	}

	.tab:focus-visible {
		outline: 2px solid #60a5fa; /* Tailwind blue-400 */
		outline-offset: -2px; /* Inside border */
		background-color: rgba(59, 130, 246, 0.1);
	}

	.no-categories-message {
		color: #6b7280; /* Tailwind gray-500 */
		font-style: italic;
		padding: 0.6rem 1rem;
		white-space: nowrap;
	}

	/* --- Options Area Layout --- */
	.options-outer-container {
		flex: 1; /* Grow to fill available space */
		display: flex; /* Use flex for centering content */
		overflow: hidden; /* Crucial: Prevent grid from overflowing */
		position: relative; /* Needed for absolute positioning of options-panel */
		border: 1px solid #e5e7eb; /* Tailwind gray-200 */
		border-radius: 8px;
		background-color: transparent; /* White background for options area */
	}

	.options-panel {
		position: absolute; /* Fill the outer container */
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow-y: auto; /* Allow vertical scrolling *within* the panel */
		overflow-x: hidden; /* Prevent horizontal scrolling */
		padding: clamp(0.5rem, 1vw, 1rem); /* Responsive padding inside panel */
		display: flex; /* To center grid or messages */
		justify-content: center;
		align-items: flex-start; /* Align grid to top */
		box-sizing: border-box;
	}

	.options-grid {
		display: grid;
		width: 100%; /* Take full width of panel */
		max-width: 1200px; /* Optional: max width for very large screens */
		justify-content: center; /* Center grid items horizontally */
		align-content: flex-start; /* Align rows to the top */
		position: relative; /* For z-index context */
	}

	/* --- Grid Item Styling --- */
	.grid-item-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		/* Padding handled by Option size/gap */
		position: relative; /* Needed for z-index */
		z-index: 1;
		transition: z-index 0s 0.2s; /* Delay z-index change on leave */
	}

	/* Elevate item on hover */
	.grid-item-wrapper:hover {
		z-index: 10;
		transition-delay: 0s; /* Apply z-index immediately on hover */
	}
	/* Add this to your OptionPicker.svelte <style> block */

	.two-item-grid {
		/* Override display: grid if needed, or use grid properties */
		display: flex; /* Use flexbox for easy centering */
		justify-content: center; /* Center items horizontally */
		align-items: center; /* Center items vertically */
		width: 100%;
		height: 100%; /* Ensure it fills the panel for vertical centering */
		gap: var(--grid-gap, 1rem); /* Use gap from JS if possible, or set default */
	}

	/* Ensure the wrappers in a two-item grid don't force expansion */
	.two-item-grid .grid-item-wrapper {
		flex-grow: 0;
		flex-shrink: 0;
		width: auto; /* Let the Option component's size dictate width */
	}

	/* Make sure the existing single-item styles are still present */

	/* Special centering for single item */
	.single-item-grid {
		display: flex; /* Override grid */
		justify-content: center;
		align-items: center;
		height: 100%; /* Fill panel height */
	}

	/* --- Grid Layout Classes (from layout utils) --- */
	.mobile-grid {
		/* Mobile specific overrides if needed */
		padding: 0.2rem; /* Tighter padding on mobile */
	}
	.small-count {
		/* Styles for grids with few items (e.g., center vertically) */
		align-content: center;
	}
	.exactly-eight {
		/* Specific styles for 8 items (often a common case) */
		align-content: center;
		/* max-width: 95%; */ /* Example adjustment */
	}

	/* --- Loading/Empty/Message States --- */
	.message-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
		padding: 2rem;
		text-align: center;
		color: #6b7280; /* Tailwind gray-500 */
		box-sizing: border-box;
		font-size: 1.1rem;
	}
	.message-container.loading p {
		margin-top: 1rem;
	}
	.message-container.empty {
		font-style: italic;
	}
	.message-container.initial {
		font-style: italic;
		color: #9ca3af; /* Lighter gray */
	}

	/* --- Media Queries --- */
	@media (max-width: 768px) {
		/* Tablet overrides */
	}
	@media (max-width: 480px) {
		/* Mobile overrides */
		/* Removed potentially problematic override */
		/* .options-grid:not(.mobile-grid) { */
		/* grid-template-columns: repeat(3, 1fr) !important; */
		/* gap: 0.5rem; */
		/* } */
	}
</style>
