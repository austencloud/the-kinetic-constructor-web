<script lang="ts">
	import { onMount, setContext, getContext } from 'svelte';
	import { writable, derived, type Readable } from 'svelte/store';
	import { get } from 'svelte/store';

	// Store Imports
	import { beatsStore } from '$lib/stores/sequence/beatsStore';
	import {
		optionsStore,
		sequenceStore,
		uiState,
		filteredOptionsStore,
		groupedOptionsStore,
		actions,
		type LastSelectedTabState
	} from './store';
	import { getResponsiveLayout } from './utils/layoutUtils';
	import {
		getContainerAspect,
		getDeviceType,
		BREAKPOINTS,
		type DeviceType,
		type ContainerAspect,
		type ResponsiveLayoutConfig,
		type SortMethod
	} from './config';
	import { LAYOUT_CONTEXT_KEY, type LayoutContextValue } from './layoutContext';

	// Component Imports
	import OptionPickerHeader from './components/OptionPickerHeader.svelte';
	import OptionDisplayArea from './components/OptionDisplayArea.svelte';
	import HeaderControls from './components/HeaderControls.svelte';
	import SimpleDebug from './components/SimpleDebug.svelte';
	import { resize } from './actions/resize';
	import type { ViewModeDetail } from './components/ViewControl.svelte';

	// export let debugMode: boolean = true;

	// --- Raw State Stores ---
	const windowWidth = writable(
		typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.desktop
	);
	const windowHeight = writable(typeof window !== 'undefined' ? window.innerHeight : 768);
	const containerWidth = writable(0);
	const containerHeight = writable(0);

	// --- Component State ---
	// Initialize selectedTab as null, will be set in onMount
	const selectedTab = writable<string | null>(null);

	// --- Reactive States ---
	$: isLoading = $uiState.isLoading;
	$: currentSortMethod = $uiState.sortMethod; // Read current sort method reactively
	$: lastSelectedTabs = $uiState.lastSelectedTab;
	$: groupedOptions = $groupedOptionsStore;
	$: filteredOptions = $filteredOptionsStore;
	$: actualCategoryKeys = groupedOptions ? Object.keys(groupedOptions) : [];
	$: optionsToDisplay =
		$selectedTab === 'all'
			? filteredOptions
			: ($selectedTab && groupedOptions && groupedOptions[$selectedTab]) || [];
	$: panelKey = $selectedTab || 'none';

	// --- Context Derivation ---
	const layoutContextValue: Readable<LayoutContextValue> = derived(
		[
			windowWidth,
			windowHeight,
			containerWidth,
			containerHeight,
			uiState,
			filteredOptionsStore,
			groupedOptionsStore,
			selectedTab // Depends on selectedTab store
		],
		([
			$windowWidth,
			$windowHeight,
			$containerWidth,
			$containerHeight,
			$ui,
			$filteredOptions,
			$groupedOptions,
			$selectedTab // Use store value
		]) => {
			const currentDeviceType = getDeviceType($windowWidth, $windowWidth < BREAKPOINTS.tablet);
			const isMobile = currentDeviceType === 'smallMobile' || currentDeviceType === 'mobile';
			const isTablet = currentDeviceType === 'tablet';
			const isPortrait = $windowHeight > $windowWidth;
			const currentContainerAspect = getContainerAspect($containerWidth, $containerHeight);

			// Calculate count based on current view ($selectedTab)
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

	// --- Event Handlers ---
	function handleContainerResize(width: number, height: number) {
		containerWidth.set(width);
		containerHeight.set(height);
	}

	// Handles selection from the main ViewControl dropdown
	function handleViewChange(event: CustomEvent<ViewModeDetail>) {
		const detail = event.detail;
		console.log('🎮 View Change Called:', detail);
		if (detail.mode === 'all') {
			console.log('🔍 Setting view to ALL');
			selectedTab.set('all');
			// Also save 'all' as the preference for the *current* sort method
			// (or a default like 'type' if you prefer)
			const methodToSaveFor = get(uiState).sortMethod;
			actions.setLastSelectedTabForSort(methodToSaveFor, 'all');
			// Optionally ensure sort method is 'type' for 'all' view
			if (methodToSaveFor !== 'type') {
				actions.setSortMethod('type');
			}
		} else if (detail.mode === 'group') {
			const newMethod = detail.method;
			// Set the sort method first
			actions.setSortMethod(newMethod);

			// Now determine the sub-tab to select based on stored preference for newMethod
			// This logic needs the *updated* groupedOptionsStore, which might take a tick.
			// It's often safer to get the latest store value *after* the action that triggers its update.
			// We can use `get()` here, assuming the store update is synchronous enough for this handler,
			// or use a reactive statement ($:) that depends on $groupedOptionsStore.
			// Let's try using get() for simplicity within the handler.
			const lastSelected = get(uiState).lastSelectedTab[newMethod];
			const currentGroupedOptions = get(groupedOptionsStore); // Get latest groups
			const currentSubTabs = currentGroupedOptions ? Object.keys(currentGroupedOptions) : [];

			let nextTab: string | null = 'all'; // Default if no valid sub-tab found
			if (lastSelected && currentSubTabs.includes(lastSelected)) {
				nextTab = lastSelected; // Restore valid preference
			} else if (currentSubTabs.length > 0) {
				nextTab = currentSubTabs[0]; // Default to first available sub-tab
			}

			selectedTab.set(nextTab);

			// Update stored preference if it wasn't the one we ended up selecting
			if (lastSelected !== nextTab) {
				actions.setLastSelectedTabForSort(newMethod, nextTab);
			}
		}
	}

	// Handles selection from the sub-category tabs (HeaderControls)
	function handleSubTabSelect(event: CustomEvent<string>) {
		const newSubTab = event.detail;
		selectedTab.set(newSubTab);
		// Store the newly selected sub-tab for the current sort method
		actions.setLastSelectedTabForSort(get(uiState).sortMethod, newSubTab);
	}

	function updateWindowSize() {
		windowWidth.set(window.innerWidth);
		windowHeight.set(window.innerHeight);
	}

	// --- Lifecycle ---
	onMount(() => {
		// *** MODIFIED Initialization Logic ***
		const savedState = get(uiState);
		const savedMethod = savedState.sortMethod;
		const savedTab = savedState.lastSelectedTab[savedMethod];

		console.log('💡 Initial view setup:', { savedMethod, savedTab });

		// Force "group" view if we have a saved tab
		if (savedMethod && savedTab && savedTab !== 'all') {
			// Force view to load with group immediately
			setTimeout(() => {
				console.log('🚀 Forcing saved view:', savedMethod, savedTab);
				handleViewChange({
					detail: { mode: 'group', method: savedMethod }
				} as CustomEvent<ViewModeDetail>);
			}, 0);
		}

		const initialSortMethod = get(uiState).sortMethod;
		const lastSelectedTabsMap = get(uiState).lastSelectedTab;
		const preferredTab = lastSelectedTabsMap[initialSortMethod];
		const currentGroups = get(groupedOptionsStore); // Get initial groups
		const availableKeys = currentGroups ? Object.keys(currentGroups) : [];

		let initialTabToSet: string | null = 'all'; // Default

		if (preferredTab) {
			if (preferredTab === 'all') {
				initialTabToSet = 'all';
			} else if (availableKeys.includes(preferredTab)) {
				initialTabToSet = preferredTab; // Restore valid preference
			} else if (availableKeys.length > 0) {
				initialTabToSet = availableKeys[0]; // Default to first available if stored is invalid
			}
		} else if (availableKeys.length > 0) {
			initialTabToSet = availableKeys[0]; // Default to first if nothing stored
		}

		selectedTab.set(initialTabToSet);

		// Update storage if we defaulted
		if (preferredTab !== initialTabToSet) {
			actions.setLastSelectedTabForSort(initialSortMethod, initialTabToSet);
		}
		// ************************************

		window.addEventListener('resize', updateWindowSize);
		updateWindowSize();
		const unsubscribeBeats = beatsStore.subscribe((beats) => {
			const sequence = beats?.map((beat) => beat.pictographData) ?? [];
			actions.loadOptions(sequence);
			// Maybe add logic here later to re-validate $selectedTab if options change drastically
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
	<OptionPickerHeader selectedTab={$selectedTab} on:viewChange={handleViewChange} />

	{#if $selectedTab !== 'all'}
		<div class="sub-tabs-container">
			<HeaderControls
				categoryKeys={actualCategoryKeys}
				selectedTab={$selectedTab}
				on:tabSelect={handleSubTabSelect}
			/>
		</div>
	{/if}

	<div class="options-container" use:resize={handleContainerResize}>
		<OptionDisplayArea
			{isLoading}
			selectedTab={$selectedTab}
			{optionsToDisplay}
			{panelKey}
			hasCategories={actualCategoryKeys.length > 0}
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
		padding: clamp(10px, 2vw, 15px);
		box-sizing: border-box;
		overflow: hidden;
		position: relative;
		background-color: transparent;
	}
	.option-picker.mobile {
		padding: clamp(8px, 1.5vw, 12px);
	}
	.sub-tabs-container {
		margin-bottom: 0.5rem;
		display: flex;
		justify-content: center;
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
