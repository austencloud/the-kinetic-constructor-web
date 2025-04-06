<!-- src/lib/components/OptionPicker/OptionPicker.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	// Store Imports
	import { beatsStore } from '$lib/stores/sequence/beatsStore';
	import {
		optionsStore,
		sequenceStore,
		uiState,
		filteredOptionsStore,
		groupedOptionsStore,
		actions
	} from './store';
	import { getResponsiveLayout } from './utils/layoutUtils';

	// Component Imports
	import OptionPickerHeader from './components/OptionPickerHeader.svelte';
	import OptionDisplayArea from './components/OptionDisplayArea.svelte';

	// Utility Imports
	import type { DeviceType } from './config';
	import type { PictographData } from '$lib/types/PictographData';
	import SimpleDebug from './components/SimpleDebug.svelte';
	import { resize } from './actions/resize';

	// --- Props ---
	export let debugMode: boolean = true;

	// --- State ---
	let viewState = {
		selectedTab: null as string | null,
		deviceType: 'desktop' as DeviceType,
		isMobile: false,
		isPortrait: false,
		container: { width: 0, height: 0 }
	};

	// Reactive display state
	$: categoryKeys = $groupedOptionsStore ? Object.keys($groupedOptionsStore) : [];
	$: currentOptions =
		viewState.selectedTab && $groupedOptionsStore
			? $groupedOptionsStore[viewState.selectedTab] || []
			: [];
	$: displayOptions = $uiState.showAllActive ? $filteredOptionsStore : currentOptions;

	// Layout calculation
	$: layout = getResponsiveLayout(
		displayOptions.length,
		viewState.container.height,
		viewState.container.width,
		viewState.isMobile,
		viewState.isPortrait
	);

	// Auto tab selection logic
	$: if (!$uiState.isLoading && !$uiState.showAllActive && categoryKeys.length > 0) {
		if (!viewState.selectedTab || !categoryKeys.includes(viewState.selectedTab)) {
			viewState.selectedTab = categoryKeys[0];
		}
	} else if (categoryKeys.length === 0 || $uiState.showAllActive) {
		viewState.selectedTab = null;
	}

	// --- Event Handlers ---
	function handleContainerResize(width: number, height: number) {
		viewState.container.width = width;
		viewState.container.height = height;
	}

	function handleTabSelect(event: CustomEvent<string>) {
		viewState.selectedTab = event.detail;
	}

	function updateDeviceState() {
		if (typeof window === 'undefined') return;

		const width = window.innerWidth;

		viewState.isMobile = width <= 480;
		viewState.isPortrait = window.innerHeight > window.innerWidth;

		// Simple device type detection
		if (width < 375) viewState.deviceType = 'smallMobile';
		else if (width < 480) viewState.deviceType = 'mobile';
		else if (width < 768) viewState.deviceType = 'tablet';
		else if (width < 1280) viewState.deviceType = 'desktop';
		else viewState.deviceType = 'largeDesktop';
	}

	// --- Debug Functions ---
	const DEVICE_TYPES: DeviceType[] = ['smallMobile', 'mobile', 'tablet', 'desktop', 'largeDesktop'];

	function toggleDeviceState() {
		const currentIndex = DEVICE_TYPES.indexOf(viewState.deviceType);
		const nextIndex = (currentIndex + 1) % DEVICE_TYPES.length;
		viewState.deviceType = DEVICE_TYPES[nextIndex];
		viewState.isMobile =
			viewState.deviceType === 'smallMobile' || viewState.deviceType === 'mobile';
	}

	function toggleOrientationState() {
		viewState.isPortrait = !viewState.isPortrait;
	}

	// --- Lifecycle ---
	onMount(() => {
		// Set up window resize handler
		const handleResize = () => {
			updateDeviceState();
		};

		window.addEventListener('resize', handleResize);

		// Initial setup
		updateDeviceState();

		// Subscribe to beats store
		const unsubscribeBeats = beatsStore.subscribe((beats) => {
			const sequence = beats?.map((beat) => beat.pictographData) ?? [];
			actions.loadOptions(sequence);
		});

		return () => {
			window.removeEventListener('resize', handleResize);
			unsubscribeBeats();
		};
	});
</script>

<div class="option-picker" class:mobile={viewState.isMobile} class:portrait={viewState.isPortrait}>
	{#if debugMode}
		<SimpleDebug
			deviceType={viewState.deviceType}
			isPortraitMode={viewState.isPortrait}
			{layout}
			containerWidth={viewState.container.width}
			containerHeight={viewState.container.height}
			optionsCount={displayOptions.length}
			selectedTab={viewState.selectedTab}
			showAllActive={$uiState.showAllActive}
			isMobileDevice={viewState.isMobile}
			{toggleDeviceState}
			{toggleOrientationState}
		/>
	{/if}

	<OptionPickerHeader
		showAllActive={$uiState.showAllActive}
		isMobileDevice={viewState.isMobile}
		{categoryKeys}
		selectedTab={viewState.selectedTab}
		on:toggleShowAll={() => actions.toggleShowAll()}
		on:tabSelect={handleTabSelect}
	/>

	<div class="options-container" use:resize={handleContainerResize}>
		<OptionDisplayArea
			isLoading={$uiState.isLoading}
			showAllActive={$uiState.showAllActive}
			selectedTab={viewState.selectedTab}
			{currentOptions}
			filteredOptions={$filteredOptionsStore}
			{layout}
			isMobileDevice={viewState.isMobile}
			isPortraitMode={viewState.isPortrait}
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
