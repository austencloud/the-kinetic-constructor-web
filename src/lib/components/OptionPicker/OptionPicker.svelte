<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';

	// Store Imports
	import { beatsStore } from '$lib/stores/sequence/beatsStore';
	import { optionPickerStore, filteredOptionsStore, groupedOptionsStore } from './stores';

	// Component Imports
	import DebugControls from './components/debug/DebugControls.svelte';
	import OptionPickerHeader from './components/OptionPickerHeader.svelte';
	import OptionDisplayArea from './components/OptionDisplayArea.svelte';

	// Utility Imports
	import { detectDeviceState, type DeviceType } from './utils/deviceUtils';
	import { getResponsiveLayout, type ResponsiveLayoutConfig } from './utils/layoutConfig/layoutUtils';
	import { debounce } from '$lib/utils/debounceUtils';
	import type { PictographData } from '$lib/types/PictographData';

	// --- Props ---
	export let debugMode: boolean = true;

	// --- State ---
	let selectedTab: string | null = null;
	let containerHeight: number = 0;
	let containerWidth: number = 0;
	let headerHeight: number = 0;
	let { isMobileDevice, isPortraitMode, deviceType } = detectDeviceState();

	// --- Refs ---
	let optionsContainerRef: HTMLElement;
	// This ref will now be bound to the *exported* rootElement from OptionPickerHeader
	let headerRef: HTMLDivElement | null = null;
	let resizeObserver: ResizeObserver | null = null;

	// --- Store Actions ---
	const { loadOptions, toggleShowAll: storeToggleShowAll } = optionPickerStore;

	// --- Reactive State from Stores ---
	let showAllActive: boolean;
	let isLoading: boolean;

	// Store Subscriptions
	const unsubscribeStore = optionPickerStore.subscribe((state) => {
		showAllActive = state.showAllActive;
		isLoading = state.isLoading;
	});

	const unsubscribeBeats = beatsStore.subscribe((beats) => {
		const sequence = beats?.map((beat) => beat.pictographData) ?? [];
		loadOptions(sequence);
	});

	// --- Reactive Derived Values ---
	$: categoryKeys = $groupedOptionsStore ? Object.keys($groupedOptionsStore) : [];
	$: currentOptions =
		selectedTab && $groupedOptionsStore ? $groupedOptionsStore[selectedTab] || [] : [];
	$: displayedOptionsCount = (showAllActive ? $filteredOptionsStore : currentOptions).length;

	// --- Layout Calculation ---
	$: layout = getResponsiveLayout(
		displayedOptionsCount,
		containerHeight,
		containerWidth,
		isMobileDevice,
		isPortraitMode
	);

	// --- Device/Display Management ---
	function updateDeviceState() {
		const state = detectDeviceState();
		isMobileDevice = state.isMobileDevice;
		isPortraitMode = state.isPortraitMode;
		deviceType = state.deviceType;
	}

	// --- Debug Toggles (Passed to DebugControls) ---
	const DEVICE_TYPES: DeviceType[] = ['smallMobile', 'mobile', 'tablet', 'desktop', 'largeDesktop'];
	function toggleDeviceState() {
		const currentIndex = DEVICE_TYPES.indexOf(deviceType);
		const nextIndex = (currentIndex + 1) % DEVICE_TYPES.length;
		deviceType = DEVICE_TYPES[nextIndex];
		isMobileDevice = deviceType === 'smallMobile' || deviceType === 'mobile';
		tick().then(updateContainerDimensions);
	}

	function toggleOrientationState() {
		isPortraitMode = !isPortraitMode;
		tick().then(updateContainerDimensions);
	}

	// --- Resize Handling ---
	const handleResize = debounce(() => {
		updateDeviceState();
		updateContainerDimensions();
	}, 100);

	function updateContainerDimensions() {
		if (optionsContainerRef) {
			containerWidth = optionsContainerRef.clientWidth;
			containerHeight = optionsContainerRef.clientHeight;
		}
		// Calculate headerHeight using the bound element reference
		if (headerRef) {
			headerHeight = headerRef.clientHeight;
		}
		// console.log('Dimensions Updated:', { containerWidth, containerHeight, headerHeight });
	}

	function setupResizeObserver() {
		if (typeof ResizeObserver === 'undefined' || !optionsContainerRef) return false;

		resizeObserver = new ResizeObserver(
			debounce((entries: ResizeObserverEntry[]) => {
				// Update dimensions based on observed changes
				// We might need to observe both optionsContainerRef and headerRef if header height changes dynamically
				updateContainerDimensions();
				/* // More detailed update if needed:
				for (const entry of entries) {
					if (entry.target === optionsContainerRef) {
						containerWidth = entry.contentRect.width;
						containerHeight = entry.contentRect.height;
					} else if (entry.target === headerRef) {
						headerHeight = entry.contentRect.height;
					}
				}
				*/
			}, 20)
		);

		resizeObserver.observe(optionsContainerRef);
		// Also observe the header element if its height can change and affect layout
		if (headerRef) {
			resizeObserver.observe(headerRef);
		}
		return true;
	}

	function setupFallbackResizeHandler() {
		window.addEventListener('resize', handleResize);
		tick().then(updateContainerDimensions); // Initial measure
		return () => window.removeEventListener('resize', handleResize);
	}

	// --- Lifecycle ---
	onMount(() => {
		updateDeviceState();
		window.addEventListener('resize', updateDeviceState);

		tick().then(() => {
			updateContainerDimensions(); // Initial dimension calculation

			const hasObserver = setupResizeObserver();
			let cleanupFallback: (() => void) | null = null;
			if (!hasObserver) {
				cleanupFallback = setupFallbackResizeHandler();
			}

			// Ensure fallback cleanup happens on destroy if used
			if (cleanupFallback) {
				onDestroy(cleanupFallback);
			}
		});
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
		window.removeEventListener('resize', updateDeviceState);
		unsubscribeBeats();
		unsubscribeStore();
		// Fallback cleanup is handled via onDestroy(cleanupFallback) inside onMount
	});

	// --- Event Handlers from Child Components ---
	function handleToggleShowAll() {
		storeToggleShowAll();
	}

	function handleTabSelect(event: CustomEvent<string>) {
		selectedTab = event.detail;
	}

	// --- Ensure selectedTab logic remains ---
	$: {
		if (!isLoading && !showAllActive && categoryKeys.length > 0) {
			if (!selectedTab || !categoryKeys.includes(selectedTab)) {
				selectedTab = categoryKeys[0];
			}
		} else if (categoryKeys.length === 0 || showAllActive) {
			selectedTab = null;
		}
	}
</script>

<div class="option-picker" class:mobile={isMobileDevice} class:portrait={isPortraitMode}>
	{#if debugMode}
		<DebugControls
			{deviceType}
			{isPortraitMode}
			{layout}
			{containerWidth}
			{containerHeight}
			optionsCount={displayedOptionsCount}
			{selectedTab}
			{showAllActive}
			{isMobileDevice}
			{toggleDeviceState}
			{toggleOrientationState}
		/>
	{/if}

	<OptionPickerHeader
		bind:rootElement={headerRef}
		{showAllActive}
		{isMobileDevice}
		{categoryKeys}
		{selectedTab}
		on:toggleShowAll={handleToggleShowAll}
		on:tabSelect={handleTabSelect}
	/>

	<div class="options-outer-container" bind:this={optionsContainerRef}>
		<OptionDisplayArea
			{isLoading}
			{showAllActive}
			{selectedTab}
			{currentOptions}
			filteredOptions={$filteredOptionsStore}
			{layout}
			{isMobileDevice}
			{categoryKeys}
		/>
	</div>
</div>

<style>
	/* Styles remain the same */
	.option-picker {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		padding: clamp(10px, 2vw, 20px);
		box-sizing: border-box;
		overflow: hidden;
		position: relative;
		background-color: transparent;
	}

	.option-picker.mobile {
		padding: clamp(8px, 1.5vw, 15px);
	}

	.options-outer-container {
		flex: 1;
		display: flex;
		position: relative;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background-color: transparent;
		min-height: 0;
		overflow: hidden;
	}

	@media (min-width: 1400px) {
		.option-picker {
			max-width: 1400px;
			margin: 0 auto;
		}
	}
</style>
