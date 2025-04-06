<!-- src/lib/components/OptionPicker/OptionPicker.svelte -->
<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { Motion } from 'svelte-motion';
	import { cubicOut } from 'svelte/easing';

	import { beatsStore } from '$lib/stores/sequence/beatsStore';
	import { optionPickerStore, filteredOptionsStore, groupedOptionsStore } from './stores';

	import HeaderControls from './components/HeaderControls.svelte';
	import OptionsPanel from './components/OptionsPanel.svelte';
	import LoadingMessage from './components/messages/LoadingMessage.svelte';
	import EmptyMessage from './components/messages/EmptyMessage.svelte';
	import ShowAllButton from './components/buttons/ShowAllButton.svelte';
	import SortOptions from './components/FilterControls/SortOptions.svelte';

	import { detectDeviceState, type DeviceType } from './utils/deviceUtils';
	import { getResponsiveLayout } from './utils/layoutConfig/layoutUtils';
	import type { PictographData } from '$lib/types/PictographData';
	import { debounce } from '$lib/utils/debounceUtils';

	// Debug mode toggle
	export let debugMode: boolean = true;

	// Component state
	let selectedTab: string | null = null;
	let containerHeight: number = 0;
	let containerWidth: number = 0;
	let optionsContainerRef: HTMLElement;
	let headerHeight: number = 0;
	let headerRef: HTMLElement;
	let { isMobileDevice, isPortraitMode, deviceType } = detectDeviceState();
	let resizeObserver: ResizeObserver | null = null;

	// Device type cycle order
	const DEVICE_TYPES = ['smallMobile', 'mobile', 'tablet', 'desktop', 'largeDesktop'];

	// Store references for easier access
	const { loadOptions, toggleShowAll } = optionPickerStore;

	// Reactive state from stores
	let showAllActive: boolean;
	let isLoading: boolean;

	// Store subscriptions
	const unsubscribeStore = optionPickerStore.subscribe((state) => {
		showAllActive = state.showAllActive;
		isLoading = state.isLoading;
	});

	const unsubscribeBeats = beatsStore.subscribe((beats) => {
		const sequence = beats?.map((beat) => beat.pictographData) ?? [];
		loadOptions(sequence);
	});

	// Reactive derived values
	$: categoryKeys = $groupedOptionsStore ? Object.keys($groupedOptionsStore) : [];

	$: currentOptions =
		selectedTab && $groupedOptionsStore ? $groupedOptionsStore[selectedTab] || [] : [];

	// Ensure we always have a valid selected tab
	$: {
		if (!isLoading && !showAllActive && categoryKeys.length > 0) {
			if (!selectedTab || !categoryKeys.includes(selectedTab)) {
				selectedTab = categoryKeys[0];
			}
		} else if (categoryKeys.length === 0 || showAllActive) {
			selectedTab = null;
		}
	}

	// Get responsive layout configuration
	$: displayedOptions = showAllActive ? $filteredOptionsStore : currentOptions;
	$: optionsCount = displayedOptions.length;
	$: layout = getResponsiveLayout(
		optionsCount,
		containerHeight,
		containerWidth,
		isMobileDevice,
		isPortraitMode
	);

	// Device and display management
	function updateDeviceState() {
		const state = detectDeviceState();
		isMobileDevice = state.isMobileDevice;
		isPortraitMode = state.isPortraitMode;
		deviceType = state.deviceType;
	}

	// Toggle device state (for testing)
	function toggleDeviceState() {
		const currentIndex = DEVICE_TYPES.indexOf(deviceType);
		const nextIndex = (currentIndex + 1) % DEVICE_TYPES.length;
		deviceType = DEVICE_TYPES[nextIndex] as DeviceType;

		// Adjust mobile state based on device type
		isMobileDevice = deviceType === 'smallMobile' || deviceType === 'mobile';
	}

	// Toggle orientation state (for testing)
	function toggleOrientationState() {
		isPortraitMode = !isPortraitMode;
	}

	const handleResize = debounce(() => {
		const windowWidth = window.innerWidth; // Get window width
		updateDeviceState();
		updateContainerDimensions();
		console.log(`[Resize Fallback] Window Width: ${windowWidth}px`); // Log window width
		console.log(`[Resize Fallback] Container W: ${containerWidth}px, H: ${containerHeight}px`); // Log container size
	}, 100);

	// Update container dimensions
	function updateContainerDimensions() {
		if (optionsContainerRef) {
			containerWidth = optionsContainerRef.clientWidth;
			containerHeight = optionsContainerRef.clientHeight;
			// Add log here if this function is called outside the observer/resize handler
			// console.log(`[Update Dimensions] Container W: ${containerWidth}px, H: ${containerHeight}px`);
		}

		if (headerRef) {
			headerHeight = headerRef.clientHeight;
		}
	}

	// Setup container resize observer
	function setupResizeObserver() {
		if (typeof ResizeObserver === 'undefined') return false;

		// Observer for the options container
		resizeObserver = new ResizeObserver(
			debounce((entries: ResizeObserverEntry[]) => {
				const entry = entries[0];
				if (entry) {
					const { width, height } = entry.contentRect;
					const windowWidth = window.innerWidth; // Get window width here too
					containerWidth = width;
					containerHeight = height;
					console.log(`[Resize Observer] Window Width: ${windowWidth}px`); // Log window width
					console.log(
						`[Resize Observer] Container W: ${containerWidth}px, H: ${containerHeight}px`
					); // Log container size
				}
			}, 100) // Adjust debounce rate if needed
		);

		if (optionsContainerRef) {
			resizeObserver.observe(optionsContainerRef);
			return true;
		}

		return false;
	}

	// Fallback for browsers without ResizeObserver
	function setupFallbackResizeHandler() {
		window.addEventListener('resize', handleResize);

		tick().then(() => {
			updateContainerDimensions();
		});

		return () => window.removeEventListener('resize', handleResize);
	}

	// Component lifecycle
	onMount(() => {
		updateDeviceState();
		window.addEventListener('resize', updateDeviceState);

		// Primary approach: ResizeObserver
		const hasObserver = setupResizeObserver();

		// Fallback approach
		let cleanup = () => {};
		if (!hasObserver) {
			cleanup = setupFallbackResizeHandler();
		}

		// Initial measurement
		tick().then(() => {
			updateContainerDimensions();
		});

		return () => {
			window.removeEventListener('resize', updateDeviceState);
			cleanup();
		};
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
		unsubscribeBeats();
		unsubscribeStore();
	});

	// Event handlers
	function handleTabSelect(tab: string) {
		selectedTab = tab;
	}

	// Animation states and transitions
	const motionTransition = {
		duration: 0.4,
		ease: cubicOut
	};

	const hiddenState = {
		opacity: 0,
		scale: 0.9,
		flexGrow: 0,
		flexShrink: 1,
		flexBasis: 0,
		margin: 0,
		pointerEvents: 'none' as const
	};

	const tabsVisibleState = {
		opacity: 1,
		scale: 1,
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 'auto',
		margin: '0 0.25rem',
		pointerEvents: 'auto' as const
	};

	const sortVisibleState = {
		opacity: 1,
		scale: 1,
		flexGrow: 0,
		flexShrink: 0,
		flexBasis: 'auto',
		margin: '0 0.25rem',
		pointerEvents: 'auto' as const
	};

	const showAllContainerState = {
		visible: { flexGrow: 0, flexShrink: 0, justifyContent: 'flex-start' },
		centered: { flexGrow: 1, flexShrink: 0, justifyContent: 'center' }
	};

	// Reactive animation states
	$: tabsAnimate = showAllActive ? hiddenState : tabsVisibleState;
	$: sortAnimate = showAllActive ? hiddenState : sortVisibleState;
	$: showAllAnimate = showAllActive
		? showAllContainerState.centered
		: showAllContainerState.visible;
</script>

<div class="option-picker" class:mobile={isMobileDevice} class:portrait={isPortraitMode}>
	<!-- {#if debugMode}
		<div class="debug-controls">
			<button class="debug-button" on:click={toggleDeviceState}>
				Toggle Device:
				{#if deviceType === 'smallMobile'}
					Small Mobile 📱🔬
				{:else if deviceType === 'mobile'}
					Mobile 📱
				{:else if deviceType === 'tablet'}
					Tablet 📲
				{:else if deviceType === 'desktop'}
					Desktop 💻
				{:else if deviceType === 'largeDesktop'}
					Large Desktop 🖥️
				{/if}
			</button>
			<button class="debug-button" on:click={toggleOrientationState}>
				Toggle Orientation: {isPortraitMode ? 'Portrait 📸' : 'Landscape 🌄'}
			</button>
			<div>
				Current Device:
				{#if deviceType === 'smallMobile'}
					Small Mobile 📱🔬
				{:else if deviceType === 'mobile'}
					Mobile 📱
				{:else if deviceType === 'tablet'}
					Tablet 📲
				{:else if deviceType === 'desktop'}
					Desktop 💻
				{:else if deviceType === 'largeDesktop'}
					Large Desktop 🖥️
				{/if}
				, Orientation: {isPortraitMode ? 'Portrait 📸' : 'Landscape 🌄'}
			</div>
		</div>
	{/if} -->

	<div class="header" class:mobile={isMobileDevice} bind:this={headerRef}>
		<div class="header-controls" class:centered-mode={showAllActive}>
			<Motion
				layout
				animate={showAllAnimate}
				transition={motionTransition}
				initial={false}
				let:motion
			>
				<div class="show-all-container" use:motion>
					<ShowAllButton {showAllActive} {isMobileDevice} onToggle={toggleShowAll} />
				</div>
			</Motion>

			<Motion layout animate={tabsAnimate} transition={motionTransition} initial={false} let:motion>
				<div class="tabs-container" use:motion>
					<HeaderControls
						{categoryKeys}
						{selectedTab}
						{isMobileDevice}
						onTabSelect={handleTabSelect}
					/>
				</div>
			</Motion>

			<Motion layout animate={sortAnimate} transition={motionTransition} initial={false} let:motion>
				<div class="sort-container" use:motion>
					<SortOptions {isMobileDevice} />
				</div>
			</Motion>
		</div>
	</div>

	<div class="options-outer-container" bind:this={optionsContainerRef}>
		{#if isLoading}
			<LoadingMessage />
		{:else if showAllActive}
			<OptionsPanel selectedTab={'all'} options={$filteredOptionsStore} {layout} {isMobileDevice} />
		{:else if selectedTab && currentOptions.length > 0}
			<OptionsPanel {selectedTab} options={currentOptions} {layout} {isMobileDevice} />
		{:else if selectedTab && currentOptions.length === 0}
			<EmptyMessage
				type="empty"
				message={`No options available for ${selectedTab}${!showAllActive ? ' (based on current filters)' : ''}`}
			/>
		{:else if !selectedTab && categoryKeys.length > 0 && !showAllActive}
			<EmptyMessage type="initial" message="Selecting category..." />
		{:else if categoryKeys.length === 0 && !showAllActive}
			<EmptyMessage type="empty" message="No options generated." />
		{/if}
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

	.debug-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 10px;
		padding: 8px;
		background-color: #f0f7ff;
		border-radius: 4px;
		border: 1px dashed #99ccff;
		color: black;
	}

	.debug-button {
		background-color: #2563eb;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 6px 12px;
		font-size: 12px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.debug-button:hover {
		background-color: #1d4ed8;
	}

	.header {
		width: 100%;
		position: relative;
		margin-bottom: 0.5rem;
		padding-bottom: 0.5rem;
		padding-top: 10px;
		min-height: 50px;
		box-sizing: border-box;
	}

	.header.mobile {
		padding-top: 5px;
		min-height: 40px;
		margin-bottom: 0.3rem;
	}

	.header-controls {
		display: flex;
		align-items: center;
		width: 100%;
		flex-wrap: wrap; /* TEMPORARY TEST */
	}

	.header-controls.centered-mode {
		justify-content: center;
	}

	.show-all-container,
	.tabs-container,
	.sort-container {
		display: flex;
		align-items: center;
		flex-basis: auto;
	}

	.show-all-container {
		flex-shrink: 0;
		flex-grow: 0;
	}

	.tabs-container {
		justify-content: center;
		min-width: 0;
		flex-shrink: 1;
		flex-grow: 1;
	}

	.sort-container {
		justify-content: flex-end;
		flex-shrink: 0;
		flex-grow: 0;
	}

	.options-outer-container {
		flex: 1;
		display: flex;
		position: relative;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background-color: transparent;
	}

	/* Responsive layout adjustments */
	@media (max-width: 480px) {
		.header-controls {
			flex-direction: column;
			flex-wrap: wrap;
		}

		.show-all-container,
		.tabs-container,
		.sort-container {
			width: 100%;
			justify-content: center;
			flex-basis: auto !important;
			flex-grow: 1;
			flex-shrink: 0;
			margin: 0.25rem 0;
		}
		/* Override margin for hidden state in mobile */
		:global(.header-controls .tabs-container[style*='opacity: 0;']),
		:global(.header-controls .sort-container[style*='opacity: 0;']) {
			margin: 0 !important;
		}

		.tabs-container {
			order: 2;
		}

		.sort-container {
			order: 3;
		}

		.show-all-container {
			order: 1;
		}

		.header-controls.centered-mode {
			flex-direction: column;
			justify-content: center;
		}

		.header-controls.centered-mode .show-all-container {
			width: 100%;
		}

		.options-outer-container {
			margin-top: 0.3rem;
		}
	}

	/* Tablet layout adjustments */
	@media (min-width: 481px) and (max-width: 768px) {
		.option-picker {
			padding: clamp(10px, 1.8vw, 18px);
		}
	}

	/* Large desktop layout enhancements */
	@media (min-width: 1400px) {
		.option-picker {
			max-width: 1400px;
			margin: 0 auto;
		}
	}
</style>
