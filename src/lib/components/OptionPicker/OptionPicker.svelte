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

	import { detectDeviceState } from './utils/deviceUtils';
	import { getResponsiveLayout } from './utils/layoutUtils';
	import type { PictographData } from '$lib/types/PictographData';
	import { debounce } from '$lib/utils/debounceUtils';

	let selectedTab: string | null = null;
	let containerHeight: number = 0;
	let containerWidth: number = 0;
	let { isMobileDevice, isPortraitMode } = detectDeviceState();

	let optionsOuterContainerRef: HTMLElement;

	const { loadOptions, toggleShowAll } = optionPickerStore;

	let showAllActive: boolean;
	let isLoading: boolean;

	const unsubscribeStore = optionPickerStore.subscribe((state) => {
		showAllActive = state.showAllActive;
		isLoading = state.isLoading;
	});

	const unsubscribeBeats = beatsStore.subscribe((beats) => {
		const sequence = beats?.map((beat) => beat.pictographData) ?? [];
		loadOptions(sequence);
	});

	$: categoryKeys = $groupedOptionsStore ? Object.keys($groupedOptionsStore) : [];

	$: currentOptions =
		selectedTab && $groupedOptionsStore ? $groupedOptionsStore[selectedTab] || [] : [];

	$: {
		if (!isLoading && !showAllActive && categoryKeys.length > 0) {
			if (!selectedTab || !categoryKeys.includes(selectedTab)) {
				selectedTab = categoryKeys[0];
			}
		} else if (categoryKeys.length === 0 || showAllActive) {
			selectedTab = null;
		}
	}

	$: layout = getResponsiveLayout(
		showAllActive ? $filteredOptionsStore.length : currentOptions.length,
		containerHeight,
		containerWidth,
		isMobileDevice,
		isPortraitMode
	);

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

	function handleTabSelect(tab: string) {
		selectedTab = tab;
	}

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

	$: tabsAnimate = showAllActive ? hiddenState : tabsVisibleState;
	$: sortAnimate = showAllActive ? hiddenState : sortVisibleState;
	$: showAllAnimate = showAllActive
		? showAllContainerState.centered
		: showAllContainerState.visible;
</script>

<div class="option-picker">
	<div class="header" class:mobile={isMobileDevice}>
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

	<div class="options-outer-container" bind:this={optionsOuterContainerRef}>
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

	.header {
		width: 100%;
		position: relative;
		margin-bottom: 0;
		padding-bottom: 0.5rem;
		padding-top: 10px;
		min-height: 50px;
		box-sizing: border-box;
	}

	.header-controls {
		display: flex;
		align-items: center;
		width: 100%;
		/* gap: 0.5rem; */ /* REMOVED gap, rely on margin from animate state */
		flex-wrap: nowrap;
	}
	.header-controls.centered-mode {
		justify-content: center;
	}

	.show-all-container,
	.tabs-container,
	.sort-container {
		display: flex;
		align-items: center;
		/* overflow: hidden; */ /* REMOVED overflow hidden */
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

	@media (max-width: 480px) {
		.header {
			padding-top: 5px;
			min-height: auto;
		}
		.header-controls {
			flex-direction: column;
			/* gap: 0.5rem; */ /* Keep gap removed */
			flex-wrap: wrap;
		}

		.show-all-container,
		.tabs-container,
		.sort-container {
			width: 100%;
			justify-content: center;
			flex-basis: auto !important;
			flex-grow: 0 !important;
			flex-shrink: 0 !important;
			margin: 0.25rem 0 !important; /* Add vertical margin instead of horizontal */
		}
		/* Override margin for hidden state in mobile */
		:global(.header-controls .tabs-container[style*='opacity: 0;']),
		:global(.header-controls .sort-container[style*='opacity: 0;']) {
			margin: 0 !important;
		}

		.tabs-container {
			flex-grow: 0;
		}

		.header-controls.centered-mode {
			flex-direction: column;
			justify-content: center;
		}
		.header-controls.centered-mode .show-all-container {
			width: 100%;
		}
	}

	.options-outer-container {
		flex: 1;
		display: flex;
		overflow: hidden;
		position: relative;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background-color: transparent;
		margin-top: 0.5rem;
	}
</style>
