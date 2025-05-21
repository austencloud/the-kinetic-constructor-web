import { writable, derived, type Readable } from 'svelte/store';
import { BREAKPOINTS } from '../config';
import type { PictographData } from '$lib/types/PictographData';
import transitionLoading from '$lib/state/stores/ui/transitionLoadingStore';

/**
 * Initialize window dimension stores with sensible defaults
 */
export function createWindowDimensionStores() {
    // Use sensible defaults for window dimensions
    const windowWidth = writable(
        typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.desktop
    );
    const windowHeight = writable(typeof window !== 'undefined' ? window.innerHeight : 768);

    // Initialize container dimensions with fallback values to avoid invalid dimensions
    // This helps prevent the "getResponsiveLayout called with invalid dimensions" error
    const containerWidth = writable(
        typeof window !== 'undefined' ? Math.max(300, window.innerWidth * 0.8) : BREAKPOINTS.desktop
    );
    const containerHeight = writable(
        typeof window !== 'undefined' ? Math.max(200, window.innerHeight * 0.6) : 768
    );

    return {
        windowWidth,
        windowHeight,
        containerWidth,
        containerHeight
    };
}

/**
 * Create a store for tracking the selected category tab
 */
export function createSelectedTabStore() {
    return writable<string | null>(null);
}

/**
 * Create derived stores for UI state
 */
export function createDerivedUIStores(
    uiState: Readable<any>,
    groupedOptionsStore: Readable<Record<string, PictographData[]>>,
    filteredOptionsStore: Readable<PictographData[]>,
    selectedTab: Readable<string | null>
) {
    // Reactive UI State & Data
    const isLoading = derived(uiState, $ui => $ui.isLoading);
    
    const groupedOptions = derived(groupedOptionsStore, $groupedOptionsStore => $groupedOptionsStore);
    
    const filteredOptions = derived(filteredOptionsStore, $filteredOptionsStore => $filteredOptionsStore);
    
    const actualCategoryKeys = derived(
        groupedOptionsStore, 
        $groupedOptionsStore => $groupedOptionsStore ? Object.keys($groupedOptionsStore) : []
    );

    // Clear the loading state when options are loaded
    derived(
        [isLoading, filteredOptionsStore],
        ([$isLoading, $filteredOptions]) => {
            if (!$isLoading && $filteredOptions.length > 0) {
                // Clear the transition loading state
                transitionLoading.end();
            }
            return { isLoading: $isLoading, hasOptions: $filteredOptions.length > 0 };
        }
    );

    // Determine which options to display based on the selected tab
    const optionsToDisplay = derived(
        [selectedTab, filteredOptionsStore, groupedOptionsStore],
        ([$selectedTab, $filteredOptions, $groupedOptions]) => {
            return $selectedTab === 'all'
                ? $filteredOptions // Show all (filtered/sorted) options if 'all' is selected
                : ($selectedTab && $groupedOptions && $groupedOptions[$selectedTab]) || []; // Show options for the specific category tab
        }
    );

    // Flag to determine if category tabs should be shown in the header
    const showTabs = derived(selectedTab, $selectedTab => $selectedTab !== 'all');

    return {
        isLoading,
        groupedOptions,
        filteredOptions,
        actualCategoryKeys,
        optionsToDisplay,
        showTabs
    };
}

/**
 * Create a debounced function to handle container resize
 */
export function createDebouncedResizeHandler(containerWidth: any, containerHeight: any) {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (width: number, height: number) => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            // Ensure we never set invalid dimensions (0 or negative values)
            // This prevents the "getResponsiveLayout called with invalid dimensions" error
            if (width > 0 && height > 0) {
                containerWidth.set(width);
                containerHeight.set(height);
            } else {
                // If we get invalid dimensions, use fallback values based on window size
                // This can happen during initial render or when container is hidden
                if (width <= 0) {
                    const fallbackWidth =
                        typeof window !== 'undefined'
                            ? Math.max(300, window.innerWidth * 0.8)
                            : BREAKPOINTS.desktop;
                    containerWidth.set(fallbackWidth);
                }

                if (height <= 0) {
                    const fallbackHeight =
                        typeof window !== 'undefined' ? Math.max(200, window.innerHeight * 0.6) : 768;
                    containerHeight.set(fallbackHeight);
                }
            }
            timeoutId = null;
        }, 100);
    };
}
