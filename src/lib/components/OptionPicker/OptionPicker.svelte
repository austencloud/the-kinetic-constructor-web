<!-- src/lib/components/OptionPicker/OptionPicker.svelte -->
<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	// Stores
	import { beatsStore } from '$lib/stores/sequence/beatsStore';
	import { optionPickerStore, filteredOptionsStore, groupedOptionsStore } from './stores';

	// Components
	import HeaderControls from './components/HeaderControls.svelte';
	import OptionsPanel from './components/OptionsPanel.svelte';
	import LoadingMessage from './components/messages/LoadingMessage.svelte';
	import EmptyMessage from './components/messages/EmptyMessage.svelte';
	import ShowAllButton from './components/buttons/ShowAllButton.svelte';

	// Utilities & Services
	import { detectDeviceState } from './utils/deviceUtils';
	import { getResponsiveLayout } from './utils/layoutUtils';
	import type { PictographData } from '$lib/types/PictographData';
	import { debounce } from '$lib/utils/debounceUtils';

	// --- Local State ---
	let selectedTab: string | null = null;
	let containerHeight: number = 0;
	let containerWidth: number = 0;
	let { isMobileDevice, isPortraitMode } = detectDeviceState();

	// DOM Refs
	let optionsOuterContainerRef: HTMLElement;

	// --- Store Actions & Derived Data ---
	const { loadOptions, toggleShowAll } = optionPickerStore;

	// Extract only what we need from the store
	let showAllActive: boolean;
	let isLoading: boolean;

	const unsubscribeStore = optionPickerStore.subscribe((state) => {
		showAllActive = state.showAllActive;
		isLoading = state.isLoading;
	});

	// Subscribe to beat changes
	const unsubscribeBeats = beatsStore.subscribe((beats) => {
		const sequence = beats?.map((beat) => beat.pictographData) ?? [];
		loadOptions(sequence);
	});

	// --- Reactive Declarations ---
	$: categoryKeys = $groupedOptionsStore ? Object.keys($groupedOptionsStore) : [];

	$: currentOptions =
		selectedTab && $groupedOptionsStore ? $groupedOptionsStore[selectedTab] || [] : [];

	// Handle tab selection based on available categories
	$: {
		if (!isLoading && categoryKeys.length > 0) {
			if (!selectedTab || !categoryKeys.includes(selectedTab)) {
				selectedTab = categoryKeys[0];
			}
		} else if (categoryKeys.length === 0) {
			selectedTab = null;
		}
	}

	// Calculate layout based on current dimensions and options
	$: layout = getResponsiveLayout(
		showAllActive ? $filteredOptionsStore.length : currentOptions.length,
		containerHeight,
		containerWidth,
		isMobileDevice,
		isPortraitMode
	);

	// --- Lifecycle & Observers ---
	let resizeObserver: ResizeObserver | null = null;

	function updateDeviceState() {
		const state = detectDeviceState();
		isMobileDevice = state.isMobileDevice;
		isPortraitMode = state.isPortraitMode;
	}

	function setupContainerResizeObserver() {
		if (typeof ResizeObserver === 'undefined' || !optionsOuterContainerRef) return;

		const handleResize = debounce((entries: ResizeObserverEntry[]) => {
			const entry = entries[0];
			if (entry) {
				const { width, height } = entry.contentRect;
				containerWidth = width;
				containerHeight = height;
			}
		}, 100);

		resizeObserver = new ResizeObserver(handleResize);
		resizeObserver.observe(optionsOuterContainerRef);

		// Initial measurement
		tick().then(() => {
			if (optionsOuterContainerRef) {
				containerWidth = optionsOuterContainerRef.clientWidth;
				containerHeight = optionsOuterContainerRef.clientHeight;
			}
		});
	}

	function setupFallbackResizeHandler() {
		const updateDimensions = () => {
			if (optionsOuterContainerRef) {
				containerWidth = optionsOuterContainerRef.clientWidth;
				containerHeight = optionsOuterContainerRef.clientHeight;
			}
		};

		window.addEventListener('resize', updateDimensions);
		tick().then(updateDimensions);

		return () => window.removeEventListener('resize', updateDimensions);
	}

	onMount(() => {
		updateDeviceState();
		window.addEventListener('resize', updateDeviceState);

		// Setup dimension tracking
		if (typeof ResizeObserver !== 'undefined') {
			setupContainerResizeObserver();
		} else {
			const cleanup = setupFallbackResizeHandler();
			return () => {
				cleanup();
				window.removeEventListener('resize', updateDeviceState);
			};
		}
	});

	onDestroy(() => {
		window.removeEventListener('resize', updateDeviceState);
		resizeObserver?.disconnect();
		unsubscribeBeats();
		unsubscribeStore();
	});

	// --- Event Handlers ---
	function handleTabSelect(tab: string) {
		selectedTab = tab;
	}
</script>

<div class="option-picker">
	<!-- Show All Toggle Button -->
	{#key showAllActive}
		<ShowAllButton {showAllActive} {isMobileDevice} onToggle={toggleShowAll} />
	{/key}

	<!-- Header Controls -->
	<div class="header" class:mobile={isMobileDevice}>
		{#if !showAllActive}
			<HeaderControls
				{categoryKeys}
				{selectedTab}
				{isMobileDevice}
				onTabSelect={handleTabSelect}
				transitionParams={{ duration: 250, delay: 50 }}
			/>
		{/if}
	</div>

	<!-- Options Container -->
	<div class="options-outer-container" bind:this={optionsOuterContainerRef}>
		{#if isLoading}
			<LoadingMessage />
		{:else if selectedTab && currentOptions.length > 0}
			<OptionsPanel {selectedTab} options={currentOptions} {layout} {isMobileDevice} />
		{:else if selectedTab && currentOptions.length === 0}
			<EmptyMessage
				type="empty"
				message={`No options available for ${selectedTab}${!showAllActive ? ' (based on current filters)' : ''}`}
			/>
		{:else if !selectedTab && categoryKeys.length > 0}
			<EmptyMessage type="initial" message="Selecting category..." />
		{:else if categoryKeys.length === 0}
			<EmptyMessage type="empty" message="No options generated." />
		{/if}
	</div>
</div>

<style>
	/* Core container styling */
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

	/* Header area */
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		position: relative;
		margin-bottom: 0;
		min-height: 40px;
		padding-bottom: 0.5rem;
		padding-top: 40px;
	}

	/* Content area */
	.options-outer-container {
		flex: 1;
		display: flex;
		overflow: hidden;
		position: relative;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background-color: #ffffff;
		margin-top: 0.5rem;
	}

	/* Responsive adjustments */
	@media (max-width: 480px) {
		.header {
			padding-top: 35px;
		}
	}
</style>
