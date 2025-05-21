import { get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { ViewModeDetail } from '../components/ViewControl/types';

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
        if (detail.mode === 'all') {
            // Switch to 'Show All' view
            selectedTab.set('all');
            const currentSortMethod = get(uiState).sortMethod;
            // Persist 'all' as the last selection for this sort method
            actions.setLastSelectedTabForSort(currentSortMethod, 'all');

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
            }
        } else if (detail.mode === 'group') {
            // Switch to a grouped view (by Type, EndPos, etc.)
            const newSortMethod = detail.method;
            actions.setSortMethod(newSortMethod); // Update the sorting method in the store

            // Determine which category tab to select within the new grouping
            const uiStateValue = get(uiState);
            const lastSelectedForNewMethod =
                uiStateValue.lastSelectedTab[newSortMethod as keyof typeof uiStateValue.lastSelectedTab];
            const currentGroupsForNewMethod = get(actions.groupedOptionsStore); // Re-get groups based on new sort method
            const availableKeysForNewMethod = currentGroupsForNewMethod
                ? Object.keys(currentGroupsForNewMethod)
                : [];

            let nextTabToSelect: string | null = null; // Default to null, meaning no specific tab initially

            if (
                lastSelectedForNewMethod &&
                lastSelectedForNewMethod !== 'all' &&
                availableKeysForNewMethod.includes(lastSelectedForNewMethod)
            ) {
                // If there was a previously selected tab for this sort method, use it
                nextTabToSelect = lastSelectedForNewMethod;
            } else if (availableKeysForNewMethod.length > 0) {
                // Otherwise, select the first available category tab
                nextTabToSelect = availableKeysForNewMethod[0];
            } else {
                // If no categories exist for this grouping, default back to 'all'
                nextTabToSelect = 'all';
            }

            selectedTab.set(nextTabToSelect);

            // Update the last selected tab preference if it changed
            if (lastSelectedForNewMethod !== nextTabToSelect) {
                actions.setLastSelectedTabForSort(newSortMethod, nextTabToSelect);
            }
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
