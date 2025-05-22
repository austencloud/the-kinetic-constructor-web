import { get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { ViewModeDetail } from '../components/ViewControl/types';
import { optionPickerContainer } from '$lib/state/stores/optionPicker/optionPickerContainer';

/**
 * Handle changes from the ViewControl (Show All / Group By...)
 */
export function createViewChangeHandler(
	selectedTab: Writable<string | null>,
	uiState: Writable<any>,
	actions: any
) {
	return function handleViewChange(event: CustomEvent<ViewModeDetail>) {
		const detail = event.detail;
		console.log('ViewChangeHandler received event with detail:', detail);

		if (detail.mode === 'all') {
			// Switch to 'Show All' view
			selectedTab.set('all');
			const currentSortMethod = get(uiState).sortMethod;

			// Persist 'all' as the last selection for this sort method
			actions.setLastSelectedTabForSort(currentSortMethod, 'all');

			// Also update the container state
			optionPickerContainer.setSelectedTab('all');
			optionPickerContainer.setLastSelectedTabForSort(currentSortMethod, 'all');

			// Important: When showing all, we don't change the sort method
			// This ensures we keep the current sort method but just show all options
			console.log('Showing all options while maintaining sort method:', currentSortMethod);

			// Dispatch an event to notify the ViewControl to update its icon
			// Only force update if we're coming from a different view
			if (typeof document !== 'undefined') {
				const viewUpdateEvent = new CustomEvent('update-view-control', {
					detail: {
						mode: 'all',
						forceUpdate: true // Force update only when explicitly showing all
					},
					bubbles: true
				});
				document.dispatchEvent(viewUpdateEvent);

				// Also dispatch an option-picker-update event to ensure the header is updated
				// This is crucial for showing the helper text instead of tabs
				const forceUpdateEvent = new CustomEvent('option-picker-update', {
					detail: {
						sortMethod: currentSortMethod,
						selectedTab: 'all',
						source: 'viewChangeHandler'
					},
					bubbles: true
				});
				document.dispatchEvent(forceUpdateEvent);
			}
		} else if (detail.mode === 'group') {
			// Switch to a grouped view (by Type, EndPos, etc.)
			const newSortMethod = detail.method;

			// Update both the legacy store and the container
			actions.setSortMethod(newSortMethod);
			optionPickerContainer.setSortMethod(newSortMethod);

			console.log('Setting sort method to:', newSortMethod);

			// Determine which category tab to select within the new grouping
			const uiStateValue = get(uiState);

			// Get the last selected tab for this sort method from the container
			// This ensures we're using the most up-to-date state from localStorage
			const lastSelectedForNewMethod = optionPickerContainer.state.lastSelectedTab[newSortMethod];

			// Get the current grouped options for the new sort method
			// We need to wait a bit for the grouped options to update based on the new sort method
			setTimeout(() => {
				const currentGroupsForNewMethod = get(actions.groupedOptionsStore);
				const availableKeysForNewMethod = currentGroupsForNewMethod
					? Object.keys(currentGroupsForNewMethod)
					: [];

				console.log('Available category keys for new sort method:', availableKeysForNewMethod);

				let nextTabToSelect: string | null = null;

				if (
					lastSelectedForNewMethod &&
					lastSelectedForNewMethod !== 'all' &&
					availableKeysForNewMethod.includes(lastSelectedForNewMethod)
				) {
					// If there was a previously selected tab for this sort method, use it
					nextTabToSelect = lastSelectedForNewMethod;
					console.log('Using previously selected tab:', nextTabToSelect);
				} else if (availableKeysForNewMethod.length > 0) {
					// Otherwise, select the appropriate default tab based on the sort method
					let defaultTab = availableKeysForNewMethod[0]; // Default fallback

					if (newSortMethod === 'type') {
						// For Type, find the "Type1" tab
						const type1Tab = availableKeysForNewMethod.find(
							(key) => key.includes('Type1') || key === '1'
						);
						if (type1Tab) defaultTab = type1Tab;
					} else if (newSortMethod === 'endPosition') {
						// For End Position, find the "alpha" tab
						const alphaTab = availableKeysForNewMethod.find((key) =>
							key.toLowerCase().includes('alpha')
						);
						if (alphaTab) defaultTab = alphaTab;
					} else if (newSortMethod === 'reversals') {
						// For Reversals, find the "Continuous" tab
						const continuousTab = availableKeysForNewMethod.find((key) =>
							key.includes('Continuous')
						);
						if (continuousTab) defaultTab = continuousTab;
					}

					nextTabToSelect = defaultTab;
					console.log(`Selecting default tab for ${newSortMethod}:`, nextTabToSelect);
				} else {
					// If no categories exist for this grouping, default back to 'all'
					nextTabToSelect = 'all';
					console.log('No categories available, defaulting to "all"');
				}

				// Update both the legacy store and the container with the selected tab
				selectedTab.set(nextTabToSelect);
				optionPickerContainer.setSelectedTab(nextTabToSelect);

				// Also update the last selected tab preference
				actions.setLastSelectedTabForSort(newSortMethod, nextTabToSelect);
				optionPickerContainer.setLastSelectedTabForSort(newSortMethod, nextTabToSelect);

				// Force a UI update by dispatching a custom event
				if (typeof document !== 'undefined') {
					const forceUpdateEvent = new CustomEvent('option-picker-update', {
						detail: {
							sortMethod: newSortMethod,
							selectedTab: nextTabToSelect,
							source: 'viewChangeHandler-setTimeout'
						},
						bubbles: true
					});
					document.dispatchEvent(forceUpdateEvent);
				}
			}, 50); // Small delay to ensure grouped options are updated
		}
	};
}

/**
 * Handle clicks on specific category tabs (Type1, Type2, etc.)
 */
export function createSubTabSelectHandler(
	selectedTab: Writable<string | null>,
	uiState: Writable<any>,
	actions: any
) {
	return function handleSubTabSelect(event: CustomEvent<string>) {
		const newSubTab = event.detail;
		selectedTab.set(newSubTab);
		// Save this tab selection preference for the current sort method
		actions.setLastSelectedTabForSort(get(uiState).sortMethod, newSubTab);
	};
}

/**
 * Update window dimensions on resize
 */
export function createWindowResizeHandler(
	windowWidth: Writable<number>,
	windowHeight: Writable<number>
) {
	return function updateWindowSize() {
		windowWidth.set(window.innerWidth);
		windowHeight.set(window.innerHeight);
	};
}
