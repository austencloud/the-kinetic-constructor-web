<script lang="ts">
	import { getContext, createEventDispatcher } from 'svelte';
	import { LAYOUT_CONTEXT_KEY, type LayoutContext } from '../layoutContext';
	import ViewControl from '../components/ViewControl/ViewControl.svelte';
	import TabsContainer from '../components/OptionPickerHeader/TabsContainer.svelte';
	import { optionPickerContainer } from '$lib/state/stores/optionPicker/optionPickerContainer';
	import type { SortMethod } from '../config';
	import type { ViewModeDetail } from '../components/ViewControl/types';

	// --- Props using Svelte 5 runes ---
	const props = $props<{
		selectedTab: string | null;
		categoryKeys: string[];
		showTabs: boolean;
	}>();

	// --- Context ---
	const layoutContext = getContext<LayoutContext>(LAYOUT_CONTEXT_KEY);

	// --- Event Dispatcher ---
	const dispatch = createEventDispatcher<{
		tabSelect: string;
		viewChange: ViewModeDetail;
	}>();

	// --- State ---
	// Create a reactive effect to track the current sort method and selected tab
	let currentSortMethod = $state<SortMethod | 'all'>(optionPickerContainer.state.sortMethod);
	let selectedTabState = $state(optionPickerContainer.state.selectedTab);
	let isMobileDevice = $state(false);
	let useShortLabels = $state(false);
	let isScrollable = $state(false);
	let compactMode = $state(false);
	let showScrollIndicator = $state(false);
	let tabsContainerRef = $state<HTMLElement | null>(null);

	// Keep state in sync with the container state
	$effect(() => {
		currentSortMethod = optionPickerContainer.state.sortMethod;
		selectedTabState = optionPickerContainer.state.selectedTab;
	});

	// Update layout-related state based on context
	$effect(() => {
		if (!layoutContext) return;
		
		const context = $layoutContext;
		isMobileDevice = context.isMobile;
		
		// Determine if we should use short labels based on container width
		useShortLabels = context.containerWidth < 480;
		
		// Determine if tabs should be scrollable based on container width and number of tabs
		isScrollable = context.containerWidth < 768 || props.categoryKeys.length > 5;
		
		// Use compact mode on small screens or when there are many tabs
		compactMode = context.containerWidth < 640 || props.categoryKeys.length > 6;
		
		// Show scroll indicator when tabs are scrollable and there are enough tabs
		showScrollIndicator = isScrollable && props.categoryKeys.length > 3;
	});

	// --- Event Handlers ---
	function handleTabSelect(event: CustomEvent<string>) {
		const tabKey = event.detail;
		optionPickerContainer.setSelectedTab(tabKey);
		optionPickerContainer.setLastSelectedTabForSort(currentSortMethod as SortMethod, tabKey);
		dispatch('tabSelect', tabKey);
	}

	function handleViewChange(event: CustomEvent<ViewModeDetail>) {
		const detail = event.detail;
		
		if (detail.mode === 'all') {
			// Switch to 'Show All' view
			optionPickerContainer.setSelectedTab('all');
			optionPickerContainer.setLastSelectedTabForSort(currentSortMethod as SortMethod, 'all');
		} else if (detail.mode === 'group' && detail.method) {
			// Switch to a grouped view
			optionPickerContainer.setSortMethod(detail.method);
			
			// Determine which tab to select within the new grouping
			const lastSelectedForNewMethod = optionPickerContainer.state.lastSelectedTab[detail.method];
			const availableKeys = props.categoryKeys;
			
			let nextTabToSelect: string | null = null;
			
			if (lastSelectedForNewMethod && lastSelectedForNewMethod !== 'all' && availableKeys.includes(lastSelectedForNewMethod)) {
				// If there was a previously selected tab for this sort method, use it
				nextTabToSelect = lastSelectedForNewMethod;
			} else if (availableKeys.length > 0) {
				// Otherwise, select the first available category tab
				nextTabToSelect = availableKeys[0];
			} else {
				// If no categories exist for this grouping, default back to 'all'
				nextTabToSelect = 'all';
			}
			
			optionPickerContainer.setSelectedTab(nextTabToSelect);
			
			// Update the last selected tab preference if it changed
			if (lastSelectedForNewMethod !== nextTabToSelect) {
				optionPickerContainer.setLastSelectedTabForSort(detail.method, nextTabToSelect);
			}
		}
		
		// Forward the event
		dispatch('viewChange', detail);
	}

	// Handle scroll events in the tabs container
	function handleScroll() {
		// This function can be expanded if needed
		// Currently just a placeholder for future scroll handling logic
	}
</script>

<div class="option-picker-header" class:mobile={isMobileDevice} data-testid="option-picker-header">
	<div class="header-content">
		<!-- TabsContainer or helper-message now comes first -->
		{#if props.showTabs}
			<!-- Show tabs when not in "Show All" mode -->
			<TabsContainer
				selectedTab={props.selectedTab}
				categoryKeys={Array.isArray(props.categoryKeys) ? props.categoryKeys : []}
				{isScrollable}
				{showScrollIndicator}
				{useShortLabels}
				{isMobileDevice}
				{compactMode}
				tabsContainerRefStore={tabsContainerRef}
				onScroll={handleScroll}
				on:tabSelect={handleTabSelect}
			/>
		{:else}
			<!-- Show helper message when in "Show All" mode -->
			<div class="helper-message">Showing all options - select a filter to see sections</div>
		{/if}

		<!-- ViewControl now comes second, will be on the right -->
		<div class="view-controls" class:compact={compactMode}>
			<ViewControl compact={compactMode} on:viewChange={handleViewChange} />
		</div>
	</div>
</div>

<style>
	/* Export all styles as CSS custom properties */
	:global(.option-picker-header) {
		height: auto;
		width: 100%;
		position: relative;
		margin-bottom: 0.5rem;
		padding-bottom: 0.5rem;
		padding-top: 8px;
		min-height: auto;
		box-sizing: border-box;
	}

	:global(.option-picker-header.mobile) {
		padding-top: 4px;
		margin-bottom: 0.3rem;
	}

	:global(.header-content) {
		display: flex;
		justify-content: space-between; /* Changed: Puts ViewControl on right, Tabs/Helper on left */
		align-items: center;
		flex-wrap: nowrap;
		padding-right: 20px; /* Added padding for right side of ViewControl */
	}

	/* Add this rule to ensure .tabs can grow */
	:global(.tabs) {
		flex-grow: 1;
		min-width: 0; /* Allow shrinking if content is too large */
		display: flex; /* Make it a flex container for its children */
	}

	:global(.view-controls) {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	/* Helper message shown when showTabs is false */
	:global(.helper-message) {
		color: white;
		font-style: italic;
		font-size: 1rem;
		padding: clamp(0.4rem, 1vw, 0.6rem);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex-shrink: 1; /* Allow shrinking if needed */
	}

	/* --- Responsive Layout --- */
	/* Compact mode styles */
	:global(.view-controls.compact) {
		flex-shrink: 0; /* Prevent view controls from shrinking */
		margin-left: 8px; /* Changed: from margin-right to provide space on its left */
	}

	/* Styles for when container width is constrained */
	@media (max-width: 768px) {
		:global(.header-content) {
			flex-direction: row; /* Keep items on the same line */
			align-items: center; /* Center align items vertically */
			flex-wrap: nowrap; /* Prevent wrapping to next line */
			padding-right: 10px;
		}

		:global(.tabs),
		:global(.tabs-placeholder),
		:global(.helper-message) {
			flex-grow: 1; /* Allow tabs to take remaining space */
			width: auto; /* Don't force full width */
			max-width: calc(100%); /* Leave space for view control */
		}
	}

	/* Mobile styles */
	@media (max-width: 640px) {
		:global(.view-controls) {
			flex-shrink: 0; /* Prevent view controls from shrinking */
			margin-left: 4px; /* Changed: from margin-right */
		}

		:global(.helper-message) {
			padding-left: 0; /* Adjust padding if needed */
			font-size: 0.9rem; /* Smaller font size */
		}
	}

	/* Very small screens */
	@media (max-width: 480px) {
		:global(.helper-message) {
			font-size: 0.8rem;
		}

		/* Make view controls more compact */
		:global(.view-controls) {
			margin-left: 2px; /* Changed: from margin-right */
		}
	}
</style>
