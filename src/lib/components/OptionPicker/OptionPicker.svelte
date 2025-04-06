<!-- src/lib/components/OptionPicker/OptionPicker.svelte -->
<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';

	// Store Imports
	import { beatsStore } from '$lib/stores/sequence/beatsStore';

	// Component Imports
	import OptionPickerHeader from './components/OptionPickerHeader.svelte';
	import OptionDisplayArea from './components/OptionDisplayArea.svelte';

	// Utility Imports
	import { debounce } from '$lib/utils/debounceUtils';
	import { getResponsiveLayout } from './utils/layoutUtils';
	import type { DeviceType } from './config';
	import type { PictographData } from '$lib/types/PictographData';
	import { filteredOptionsStore, groupedOptionsStore, optionPickerStore } from './store';
	import SimpleDebug from './components/SimpleDebug.svelte';

	// --- Props ---
	export let debugMode: boolean = true;

	// --- State ---
	let selectedTab: string | null = null;
	let containerHeight: number = 0;
	let containerWidth: number = 0;
	let isMobileDevice = false;
	let isPortraitMode = false;
	let deviceType: DeviceType = 'desktop';

	// --- Refs ---
	let containerRef: HTMLElement;
	let headerRef: HTMLDivElement | null = null;

	// --- Store Actions ---
	const { loadOptions, toggleShowAll } = optionPickerStore;

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
		if (typeof window === 'undefined') return;

		isMobileDevice = window.innerWidth <= 480;
		isPortraitMode = window.innerHeight > window.innerWidth;

		// Simple device type detection
		if (window.innerWidth < 375) deviceType = 'smallMobile';
		else if (window.innerWidth < 480) deviceType = 'mobile';
		else if (window.innerWidth < 768) deviceType = 'tablet';
		else if (window.innerWidth < 1280) deviceType = 'desktop';
		else deviceType = 'largeDesktop';
	}

	// --- Debug Toggles ---
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

	// --- Container Dimensions ---
	function updateContainerDimensions() {
		if (containerRef) {
			containerWidth = containerRef.clientWidth;
			containerHeight = containerRef.clientHeight;
		}
	}

	// --- ResizeObserver Setup ---
	function setupResizeObserver() {
		if (typeof ResizeObserver === 'undefined' || !containerRef) return false;

		const resizeObserver = new ResizeObserver(
			debounce(() => {
				updateContainerDimensions();
			}, 20)
		);

		resizeObserver.observe(containerRef);
		if (headerRef) resizeObserver.observe(headerRef);

		// Clean up on destroy
		onDestroy(() => {
			resizeObserver.disconnect();
		});

		return true;
	}

	// --- Lifecycle ---
	onMount(() => {
		// Set up window resize handler
		const handleResize = debounce(() => {
			updateDeviceState();
			updateContainerDimensions();
		}, 100);

		window.addEventListener('resize', handleResize);
		onDestroy(() => window.removeEventListener('resize', handleResize));

		// Initial setup
		updateDeviceState();
		tick().then(() => {
			updateContainerDimensions();
			setupResizeObserver();
		});
	});

	onDestroy(() => {
		unsubscribeBeats();
		unsubscribeStore();
	});

	// --- Event Handlers ---
	function handleTabSelect(event: CustomEvent<string>) {
		selectedTab = event.detail;
	}

	// --- Auto Tab Selection Logic ---
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
		<SimpleDebug
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
		on:toggleShowAll={() => toggleShowAll()}
		on:tabSelect={handleTabSelect}
	/>

	<div class="options-container" bind:this={containerRef}>
		<OptionDisplayArea
			{isLoading}
			{showAllActive}
			{selectedTab}
			{currentOptions}
			filteredOptions={$filteredOptionsStore}
			{layout}
			{isMobileDevice}
			{isPortraitMode}
			{categoryKeys}
		/>
	</div>
</div>

<style>
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

	.options-container {
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
