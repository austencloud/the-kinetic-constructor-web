<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { writable, derived, type Readable } from 'svelte/store';

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
	import {
		getContainerAspect,
		getDeviceType,
		BREAKPOINTS,
		type DeviceType,
		type ContainerAspect,
		type ResponsiveLayoutConfig
	} from './config'; // Import helpers
	import { LAYOUT_CONTEXT_KEY, type LayoutContextValue } from './layoutContext'; // Import context key and type

	// Component Imports
	import OptionPickerHeader from './components/OptionPickerHeader.svelte';
	import OptionDisplayArea from './components/OptionDisplayArea.svelte';
	import SimpleDebug from './components/SimpleDebug.svelte';
	import { resize } from './actions/resize';

	export let debugMode: boolean = true;

	// --- Raw State Stores ---
	const windowWidth = writable(
		typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.desktop
	);
	const windowHeight = writable(typeof window !== 'undefined' ? window.innerHeight : 768);
	const containerWidth = writable(0);
	const containerHeight = writable(0);

	// --- Reactive Derived State for Context ---
	const layoutContextValue: Readable<LayoutContextValue> = derived(
		[windowWidth, windowHeight, containerWidth, containerHeight, filteredOptionsStore, uiState],
		([
			$windowWidth,
			$windowHeight,
			$containerWidth,
			$containerHeight,
			$filteredOptions,
			$uiState
		]) => {
			// Determine device characteristics based on WINDOW size
			const currentDeviceType = getDeviceType($windowWidth, $windowWidth < BREAKPOINTS.tablet); // Pass width and a simple isMobile flag
			const isMobile = currentDeviceType === 'smallMobile' || currentDeviceType === 'mobile';
			const isTablet = currentDeviceType === 'tablet';
			const isPortrait = $windowHeight > $windowWidth;

			// Determine container characteristics
			const currentContainerAspect = getContainerAspect($containerWidth, $containerHeight);

			// Calculate layout based on CONTAINER size and device characteristics
			// Pass the *actual* container dimensions and the determined flags
			const currentLayoutConfig = getResponsiveLayout(
				$uiState.showAllActive
					? $filteredOptions.length
					: ($groupedOptionsStore?.[selectedTab || ''] || []).length, // Get appropriate count
				$containerHeight,
				$containerWidth,
				isMobile, // Pass calculated isMobile
				isPortrait // Pass calculated isPortrait
			);

			return {
				deviceType: currentDeviceType,
				isMobile: isMobile,
				isTablet: isTablet,
				isPortrait: isPortrait,
				containerWidth: $containerWidth,
				containerHeight: $containerHeight,
				containerAspect: currentContainerAspect,
				layoutConfig: currentLayoutConfig
			};
		}
	);

	// Provide the context
	setContext<Readable<LayoutContextValue>>(LAYOUT_CONTEXT_KEY, layoutContextValue);

	// --- Component State (Less needed now) ---
	let selectedTab: string | null = null; // Keep local UI state separate

	// Reactive display state using derived context
	$: context = $layoutContextValue; // Easy access for debug/local use if needed
	$: categoryKeys = $groupedOptionsStore ? Object.keys($groupedOptionsStore) : [];
	$: currentOptions =
		selectedTab && $groupedOptionsStore ? $groupedOptionsStore[selectedTab] || [] : [];
	$: displayOptions = $uiState.showAllActive ? $filteredOptionsStore : currentOptions;

	// Auto tab selection logic (remains the same)
	$: if (!$uiState.isLoading && !$uiState.showAllActive && categoryKeys.length > 0) {
		if (!selectedTab || !categoryKeys.includes(selectedTab)) {
			selectedTab = categoryKeys[0];
		}
	} else if (categoryKeys.length === 0 || $uiState.showAllActive) {
		selectedTab = null;
	}

	// --- Event Handlers ---
	function handleContainerResize(width: number, height: number) {
		containerWidth.set(width);
		containerHeight.set(height);
	}

	function handleTabSelect(event: CustomEvent<string>) {
		selectedTab = event.detail;
	}

	function updateWindowSize() {
		windowWidth.set(window.innerWidth);
		windowHeight.set(window.innerHeight);
	}

	// --- Debug Functions (Simplified) ---
	// No need for separate toggles, debug component reads from context now

	// --- Lifecycle ---
	onMount(() => {
		window.addEventListener('resize', updateWindowSize);
		updateWindowSize(); // Initial check

		const unsubscribeBeats = beatsStore.subscribe((beats) => {
			const sequence = beats?.map((beat) => beat.pictographData) ?? [];
			actions.loadOptions(sequence);
		});

		return () => {
			window.removeEventListener('resize', updateWindowSize);
			unsubscribeBeats();
		};
	});
</script>

<div
	class="option-picker"
	class:mobile={$layoutContextValue.isMobile}
	class:portrait={$layoutContextValue.isPortrait}
>
	{#if debugMode}
		<SimpleDebug />
	{/if}

	<OptionPickerHeader
		showAllActive={$uiState.showAllActive}
		{categoryKeys}
		{selectedTab}
		on:toggleShowAll={() => actions.toggleShowAll()}
		on:tabSelect={handleTabSelect}
	/>

	<div class="options-container" use:resize={handleContainerResize}>
		<OptionDisplayArea
			isLoading={$uiState.isLoading}
			showAllActive={$uiState.showAllActive}
			{selectedTab}
			{currentOptions}
			filteredOptions={$filteredOptionsStore}
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
