<script lang="ts">
	import { onMount, setContext, getContext } from 'svelte';
	import { writable, derived, type Readable } from 'svelte/store';
	import { get } from 'svelte/store';
	import { beatsStore } from '$lib/stores/sequence/beatsStore';
	import { uiState, filteredOptionsStore, groupedOptionsStore, actions } from './store';
	import { getResponsiveLayout } from './utils/layoutUtils';
	import { getContainerAspect, getDeviceType, BREAKPOINTS } from './config';
	import { LAYOUT_CONTEXT_KEY, type LayoutContextValue } from './layoutContext';
	import OptionPickerHeader from './components/OptionPickerHeader.svelte';
	import OptionDisplayArea from './components/OptionDisplayArea.svelte';
	// HeaderControls is now integrated into OptionPickerHeader
	// import HeaderControls from './components/HeaderControls.svelte';
	import { resize } from './actions/resize';
	import type { ViewModeDetail } from './components/ViewControl.svelte';
	import LayoutDebugger from './utils/LayoutDebugger.svelte';

	const windowWidth = writable(
		typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.desktop
	);
	const windowHeight = writable(typeof window !== 'undefined' ? window.innerHeight : 768);
	const containerWidth = writable(0);
	const containerHeight = writable(0);

	const selectedTab = writable<string | null>(null);

	$: isLoading = $uiState.isLoading;
	$: groupedOptions = $groupedOptionsStore;
	$: filteredOptions = $filteredOptionsStore;
	$: actualCategoryKeys = groupedOptions ? Object.keys(groupedOptions) : [];
	$: optionsToDisplay =
		$selectedTab === 'all'
			? filteredOptions
			: ($selectedTab && groupedOptions && groupedOptions[$selectedTab]) || [];
	$: panelKey = $selectedTab || 'none';
	$: showTabs = $selectedTab !== 'all'; // Flag to determine when to show tabs

	const layoutContextValue: Readable<LayoutContextValue> = derived(
		[
			windowWidth,
			windowHeight,
			containerWidth,
			containerHeight,
			uiState,
			filteredOptionsStore,
			groupedOptionsStore,
			selectedTab
		],
		([
			$windowWidth,
			$windowHeight,
			$containerWidth,
			$containerHeight,
			$ui,
			$filteredOptions,
			$groupedOptions,
			$selectedTab
		]) => {
			const currentDeviceType = getDeviceType($windowWidth, $windowWidth < BREAKPOINTS.tablet);
			const isMobile = currentDeviceType === 'smallMobile' || currentDeviceType === 'mobile';
			const isTablet = currentDeviceType === 'tablet';
			const isPortrait = $windowHeight > $windowWidth;
			const currentContainerAspect = getContainerAspect($containerWidth, $containerHeight);

			const optionsCount =
				$selectedTab && $selectedTab !== 'all' && $groupedOptions?.[$selectedTab]
					? $groupedOptions[$selectedTab].length
					: $filteredOptions.length;

			const currentLayoutConfig = getResponsiveLayout(
				optionsCount,
				$containerHeight,
				$containerWidth,
				isMobile,
				isPortrait
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
	setContext<Readable<LayoutContextValue>>(LAYOUT_CONTEXT_KEY, layoutContextValue);
	$: context = $layoutContextValue;

	function handleContainerResize(width: number, height: number) {
		containerWidth.set(width);
		containerHeight.set(height);
	}

	function handleViewChange(event: CustomEvent<ViewModeDetail>) {
		const detail = event.detail;
		if (detail.mode === 'all') {
			selectedTab.set('all');
			const methodToSaveFor = get(uiState).sortMethod;
			actions.setLastSelectedTabForSort(methodToSaveFor, 'all');
			if (methodToSaveFor !== 'type') {
				actions.setSortMethod('type');
			}
		} else if (detail.mode === 'group') {
			const newMethod = detail.method;
			actions.setSortMethod(newMethod);
			const lastSelected = get(uiState).lastSelectedTab[newMethod];
			const currentGroupedOptions = get(groupedOptionsStore);
			const currentSubTabs = currentGroupedOptions ? Object.keys(currentGroupedOptions) : [];

			let nextTab: string | null = 'all';
			if (lastSelected && currentSubTabs.includes(lastSelected)) {
				nextTab = lastSelected;
			} else if (currentSubTabs.length > 0) {
				nextTab = currentSubTabs[0];
			}

			selectedTab.set(nextTab);

			if (lastSelected !== nextTab) {
				actions.setLastSelectedTabForSort(newMethod, nextTab);
			}
		}
	}

	function handleSubTabSelect(event: CustomEvent<string>) {
		const newSubTab = event.detail;
		selectedTab.set(newSubTab);
		actions.setLastSelectedTabForSort(get(uiState).sortMethod, newSubTab);
	}

	function updateWindowSize() {
		windowWidth.set(window.innerWidth);
		windowHeight.set(window.innerHeight);
	}

	onMount(() => {
		const savedState = get(uiState);
		const savedMethod = savedState.sortMethod;
		const savedTab = savedState.lastSelectedTab[savedMethod];

		if (savedMethod && savedTab && savedTab !== 'all') {
			setTimeout(() => {
				handleViewChange({
					detail: { mode: 'group', method: savedMethod }
				} as CustomEvent<ViewModeDetail>);
			}, 0);
		}

		const initialSortMethod = get(uiState).sortMethod;
		const lastSelectedTabsMap = get(uiState).lastSelectedTab;
		const preferredTab = lastSelectedTabsMap[initialSortMethod];
		const currentGroups = get(groupedOptionsStore);
		const availableKeys = currentGroups ? Object.keys(currentGroups) : [];

		let initialTabToSet: string | null = 'all';

		if (preferredTab) {
			if (preferredTab === 'all') {
				initialTabToSet = 'all';
			} else if (availableKeys.includes(preferredTab)) {
				initialTabToSet = preferredTab;
			} else if (availableKeys.length > 0) {
				initialTabToSet = availableKeys[0];
			}
		} else if (availableKeys.length > 0) {
			initialTabToSet = availableKeys[0];
		}

		selectedTab.set(preferredTab ? preferredTab : initialTabToSet);

		if (preferredTab !== initialTabToSet) {
			actions.setLastSelectedTabForSort(initialSortMethod, preferredTab ?? null);
		}

		window.addEventListener('resize', updateWindowSize);
		updateWindowSize();
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
	<!-- Combined header with tabs and view controls -->
	<OptionPickerHeader
		selectedTab={$selectedTab}
		categoryKeys={actualCategoryKeys}
		{showTabs}
		on:viewChange={handleViewChange}
		on:tabSelect={handleSubTabSelect}
	/>

	<div class="options-container" use:resize={handleContainerResize}>
		<OptionDisplayArea
			{isLoading}
			selectedTab={$selectedTab}
			{optionsToDisplay}
			{panelKey}
			hasCategories={actualCategoryKeys.length > 0}
		/>
	</div>
	<LayoutDebugger />
</div>

<style>
	.option-picker {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		padding: clamp(10px, 2vw, 15px);
		box-sizing: border-box;
		overflow: hidden;
		position: relative;
		background-color: transparent;
	}
	.option-picker.mobile {
		padding: clamp(8px, 1.5vw, 12px);
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
