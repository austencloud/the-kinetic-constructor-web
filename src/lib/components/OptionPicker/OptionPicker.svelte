<script lang="ts">
	import { onMount, setContext, getContext } from 'svelte';
	import { writable, derived, type Readable } from 'svelte/store';
	import { get } from 'svelte/store';
	import { beatsStore } from '$lib/stores/sequence/beatsStore';
	import { uiState, filteredOptionsStore, groupedOptionsStore, actions } from './store';
	// Ensure layoutUtils imports are correct
	import { getResponsiveLayout, getEnhancedDeviceType } from './utils/layoutUtils';
	import { getContainerAspect, getDeviceType, BREAKPOINTS } from './config'; // getDeviceType might be unused if getEnhancedDeviceType handles all cases
	import { LAYOUT_CONTEXT_KEY, type LayoutContextValue } from './layoutContext';
	import OptionPickerHeader from './components/OptionPickerHeader.svelte';
	import OptionDisplayArea from './components/OptionDisplayArea.svelte';
	import { resize } from './actions/resize';
	import type { ViewModeDetail } from './components/ViewControl.svelte';
	import LayoutDebugger from './utils/debugger/LayoutDebugger.svelte';

	// --- State Stores ---
	const windowWidth = writable(
		typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.desktop
	);
	const windowHeight = writable(typeof window !== 'undefined' ? window.innerHeight : 768);
	const containerWidth = writable(0);
	const containerHeight = writable(0);
	const selectedTab = writable<string | null>(null); // Tracks the currently selected category tab ('all' or specific key)

	// --- Reactive UI State & Data ---
	$: isLoading = $uiState.isLoading;
	$: groupedOptions = $groupedOptionsStore; // Options grouped by the current sort method's criteria
	$: filteredOptions = $filteredOptionsStore; // Options after filtering (if any) and sorting
	$: actualCategoryKeys = groupedOptions ? Object.keys(groupedOptions) : []; // Available category keys based on current grouping
	// Determine which options to display based on the selected tab
	$: optionsToDisplay =
		$selectedTab === 'all'
			? filteredOptions // Show all (filtered/sorted) options if 'all' is selected
			: ($selectedTab && groupedOptions && groupedOptions[$selectedTab]) || []; // Show options for the specific category tab
	$: panelKey = $selectedTab || 'none'; // Key for transitions based on the selected tab
	$: showTabs = $selectedTab !== 'all'; // Flag to determine if category tabs should be shown in the header

	// --- Derived Layout Context ---
	// This derived store calculates layout values based on various inputs
	const layoutContextValue: Readable<LayoutContextValue> = derived(
		[
			windowWidth,
			windowHeight,
			containerWidth,
			containerHeight,
			uiState,
			filteredOptionsStore, // Need filtered options count for layout
			groupedOptionsStore, // Need grouped options for layout when tab is selected
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
			// 1. Get enhanced device info using container width (more reliable for component layout)
			const {
				deviceType: enhancedDeviceType,
				isFoldable,
				foldableInfo
			} = getEnhancedDeviceType($containerWidth > 0 ? $containerWidth : $windowWidth, $windowWidth < BREAKPOINTS.tablet);

			// 2. Determine isMobile/isTablet BASED ON the final enhancedDeviceType
			const isMobile = enhancedDeviceType === 'smallMobile' || enhancedDeviceType === 'mobile';
			const isTablet = enhancedDeviceType === 'tablet';

			// 3. Determine portrait/aspect based on container dimensions
			const isPortrait = $containerHeight > $containerWidth;
			const currentContainerAspect = getContainerAspect($containerWidth, $containerHeight);

			// 4. Calculate the count of items currently being displayed for layout purposes
			const optionsCount =
				$selectedTab && $selectedTab !== 'all' && $groupedOptions && $groupedOptions[$selectedTab]
					? $groupedOptions[$selectedTab].length // Count for the specific selected tab
					: $filteredOptions.length; // Count for the 'all' view

			// 5. Get the responsive layout configuration, passing foldableInfo
			const currentLayoutConfig = getResponsiveLayout(
				optionsCount,
				$containerHeight,
				$containerWidth,
				isMobile,
				isPortrait,
				foldableInfo // Pass the full foldable info object
			);

			// 6. Return the complete context object
			return {
				deviceType: enhancedDeviceType,
				isMobile: isMobile,
				isTablet: isTablet,
				isPortrait: isPortrait,
				containerWidth: $containerWidth,
				containerHeight: $containerHeight,
				containerAspect: currentContainerAspect,
				layoutConfig: currentLayoutConfig,
				foldableInfo: foldableInfo // IMPORTANT: Pass the full foldable info object
			};
		}
	);

	// --- Set Context ---
	// Make the derived layout context available to child components
	setContext<Readable<LayoutContextValue>>(LAYOUT_CONTEXT_KEY, layoutContextValue);

	// --- Reactive Access to Context (Optional) ---
	// You can reactively access the context value if needed directly in this component's logic/template
	$: context = $layoutContextValue;

	// --- Event Handlers ---

	// Update container dimensions when the container resizes
	function handleContainerResize(width: number, height: number) {
		containerWidth.set(width);
		containerHeight.set(height);
	}

	// Handle changes from the ViewControl (Show All / Group By...)
	function handleViewChange(event: CustomEvent<ViewModeDetail>) {
		const detail = event.detail;
		if (detail.mode === 'all') {
			// Switch to 'Show All' view
			selectedTab.set('all');
			const currentSortMethod = get(uiState).sortMethod;
			// Persist 'all' as the last selection for this sort method
			actions.setLastSelectedTabForSort(currentSortMethod, 'all');
			// Optionally reset sort method if needed when showing all
			// if (currentSortMethod !== 'type') {
			// 	actions.setSortMethod('type');
			// }
		} else if (detail.mode === 'group') {
			// Switch to a grouped view (by Type, EndPos, etc.)
			const newSortMethod = detail.method;
			actions.setSortMethod(newSortMethod); // Update the sorting method in the store

			// Determine which category tab to select within the new grouping
			const lastSelectedForNewMethod = get(uiState).lastSelectedTab[newSortMethod];
			const currentGroupsForNewMethod = get(groupedOptionsStore); // Re-get groups based on new sort method
			const availableKeysForNewMethod = currentGroupsForNewMethod ? Object.keys(currentGroupsForNewMethod) : [];

			let nextTabToSelect: string | null = null; // Default to null, meaning no specific tab initially

			if (lastSelectedForNewMethod && availableKeysForNewMethod.includes(lastSelectedForNewMethod)) {
				// If there was a previously selected tab for this sort method, use it
				nextTabToSelect = lastSelectedForNewMethod;
			} else if (availableKeysForNewMethod.length > 0) {
				// Otherwise, select the first available category tab
				nextTabToSelect = availableKeysForNewMethod[0];
			} else {
                // If no categories exist for this grouping, maybe default back to 'all'? Or handle empty state.
                // For now, setting to null might be okay if the display area handles it.
                // Let's try setting back to 'all' if no sub-tabs exist
                 nextTabToSelect = 'all';
            }


			selectedTab.set(nextTabToSelect);

			// Update the last selected tab preference if it changed
			if (lastSelectedForNewMethod !== nextTabToSelect) {
				actions.setLastSelectedTabForSort(newSortMethod, nextTabToSelect);
			}
		}
	}

	// Handle clicks on specific category tabs (Type1, Type2, etc.)
	function handleSubTabSelect(event: CustomEvent<string>) {
		const newSubTab = event.detail;
		selectedTab.set(newSubTab);
		// Save this tab selection preference for the current sort method
		actions.setLastSelectedTabForSort(get(uiState).sortMethod, newSubTab);
	}

	// Update window dimensions on resize
	function updateWindowSize() {
		windowWidth.set(window.innerWidth);
		windowHeight.set(window.innerHeight);
	}

	// --- Lifecycle ---
	onMount(() => {
		// --- Initialization Logic ---

		// Restore last view state on mount (which sort method and tab were active)
		const savedState = get(uiState);
		const savedSortMethod = savedState.sortMethod;
		const lastSelectedTabsMap = savedState.lastSelectedTab;
		const preferredTabForSavedMethod = lastSelectedTabsMap[savedSortMethod];

        // Trigger initial load/option calculation based on the current sequence
        // This assumes beatsStore might already have data or will update soon
        const currentBeats = get(beatsStore);
        const initialSequence = currentBeats?.map((beat) => beat.pictographData) ?? [];
        actions.loadOptions(initialSequence); // Load options based on initial sequence


		// Determine the initial tab to display after options are loaded/grouped
        // We need to wait for groupedOptionsStore to potentially update after loadOptions
        // Using a timeout or derived store reaction might be more robust, but let's try this first.
        setTimeout(() => {
            const currentGroups = get(groupedOptionsStore); // Get groups AFTER potential loading
            const availableKeys = currentGroups ? Object.keys(currentGroups) : [];

            let initialTabToSet: string | null = 'all'; // Default to 'all'

            if (preferredTabForSavedMethod) {
                // If a preference exists for the current sort method
                if (preferredTabForSavedMethod === 'all') {
                    initialTabToSet = 'all';
                } else if (availableKeys.includes(preferredTabForSavedMethod)) {
                    // If the preferred tab still exists in the current options, use it
                    initialTabToSet = preferredTabForSavedMethod;
                } else if (availableKeys.length > 0) {
                    // If preferred tab is gone, use the first available tab
                    initialTabToSet = availableKeys[0];
                }
                // If no keys available, it stays 'all'
            } else if (availableKeys.length > 0) {
                 // If no preference, use the first available tab
                initialTabToSet = availableKeys[0];
            }

            selectedTab.set(initialTabToSet);

            // Ensure the stored preference is accurate if we had to change the initial tab
            if (preferredTabForSavedMethod !== initialTabToSet) {
                actions.setLastSelectedTabForSort(savedSortMethod, initialTabToSet);
            }
        }, 0); // Timeout 0 allows stores to update after initial load


		// --- Event Listeners & Subscriptions ---
		window.addEventListener('resize', updateWindowSize);
		updateWindowSize(); // Initial call

		// Subscribe to sequence changes (beatsStore) to reload options
		const unsubscribeBeats = beatsStore.subscribe((beats) => {
			// Avoid running loadOptions on the very first mount if already done above
            // This check might need refinement depending on exact store timing
            if (beats !== currentBeats) { // Basic check if beats actually changed
                 const sequence = beats?.map((beat) => beat.pictographData) ?? [];
			    actions.loadOptions(sequence);
            }
		});

		// --- Cleanup ---
		return () => {
			window.removeEventListener('resize', updateWindowSize);
			unsubscribeBeats();
		};
	});
</script>

<div
	class="option-picker"
	class:mobile={context.isMobile}
	class:portrait={context.isPortrait}
>
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
		background-color: transparent; /* Or your desired background */
	}
	.option-picker.mobile {
		padding: clamp(8px, 1.5vw, 12px);
	}
	.options-container {
		flex: 1; /* Takes remaining vertical space */
		display: flex; /* Needed for children */
		position: relative; /* For absolute positioning of children like messages */
		border: 1px solid #e5e7eb; /* Example border */
		border-radius: 8px;
		background-color: transparent; /* Or your desired background */
		min-height: 0; /* Crucial for flex child sizing */
		overflow: hidden; /* Contains children, prevents double scrollbars */
	}
	/* Optional: Constrain max width on large screens */
	@media (min-width: 1400px) {
		.option-picker {
			max-width: 1400px;
			margin: 0 auto;
		}
	}
</style>
