/**
 * ViewControlInitialization.svelte.ts
 *
 * This module provides initialization functions for the ViewControl component.
 * This file is named with .svelte.ts extension to enable rune syntax.
 */

import type { SortMethod } from '../../config';
import {
	optionPickerContainer,
	groupedOptions
} from '$lib/state/stores/optionPicker/optionPickerContainer.svelte';

/**
 * Initialize the ViewControl component
 */
export function initializeViewControl(state: any) {
	// Add an initialization effect to ensure the UI state is consistent with the selected view option
	$effect(() => {
		// Skip if we're already processing an event
		if (state.isProcessingEvent) return;

		// Set the flag to prevent event loops
		state.isProcessingEvent = true;

		console.log('Initializing ViewControl with option:', state.selectedViewOption.label);

		// Dispatch an event to ensure the UI is updated based on the initial view option
		setTimeout(() => {
			if (typeof document !== 'undefined') {
				// If the selected view option is "All", dispatch events to show the helper text
				if (state.selectedViewOption.value === 'all') {
					console.log('INITIALIZATION: Setting up "Show All" view');

					// CRITICAL: Set the selectedTab to 'all' FIRST
					// This ensures the showTabs derived store immediately updates to hide tabs
					optionPickerContainer.setSelectedTab('all');

					// Then set the sort method (order matters here!)
					optionPickerContainer.setSortMethod('type');

					// Store 'all' as the last selected tab for the current sort method
					optionPickerContainer.setLastSelectedTabForSort('type', 'all');

					// Dispatch a single, clear event to update the UI
					const updateEvent = new CustomEvent('option-picker-update', {
						detail: {
							sortMethod: 'type',
							selectedTab: 'all',
							source: 'viewControl-initialization-showAll'
						},
						bubbles: true
					});
					document.dispatchEvent(updateEvent);
				} else {
					// For other view options (Type, End Position, Reversals)
					console.log('INITIALIZATION: Setting up filter view for', state.selectedViewOption.label);

					const sortMethod = state.selectedViewOption.value as SortMethod;

					// First, update the sort method
					// This will trigger the groupedOptions to update
					optionPickerContainer.setSortMethod(sortMethod);

					// Use a nested setTimeout to ensure the grouped options are updated
					setTimeout(() => {
						// Get the current grouped options AFTER the sort method has been updated
						const currentGroupedOptions = groupedOptions.value;
						const categoryKeys = Object.keys(currentGroupedOptions);

						console.log('Available category keys for sort method:', sortMethod, categoryKeys);

						// Check if there's a previously selected tab for this sort method
						const lastSelectedTab = optionPickerContainer.state.lastSelectedTab[sortMethod];

						// CRITICAL: If we have categories, set selectedTab to a non-'all' value
						if (categoryKeys.length > 0) {
							let tabToSelect;

							if (
								lastSelectedTab &&
								lastSelectedTab !== 'all' &&
								categoryKeys.includes(lastSelectedTab)
							) {
								// Use the previously selected tab if available
								tabToSelect = lastSelectedTab;
							} else {
								// Otherwise, select the appropriate default tab
								let defaultTab = categoryKeys[0]; // Default fallback

								if (sortMethod === 'type') {
									// For Type, find the "Type1" tab
									const type1Tab = categoryKeys.find((key) => key.includes('Type1') || key === '1');
									if (type1Tab) defaultTab = type1Tab;
								} else if (sortMethod === 'endPosition') {
									// For End Position, find the "alpha" tab
									const alphaTab = categoryKeys.find((key) => key.toLowerCase().includes('alpha'));
									if (alphaTab) defaultTab = alphaTab;
								} else if (sortMethod === 'reversals') {
									// For Reversals, find the "Continuous" tab
									const continuousTab = categoryKeys.find((key) => key.includes('Continuous'));
									if (continuousTab) defaultTab = continuousTab;
								}

								tabToSelect = defaultTab;

								// Update the last selected tab for this sort method
								optionPickerContainer.setLastSelectedTabForSort(sortMethod, tabToSelect);
							}

							// Set the selected tab to ensure tabs are shown
							optionPickerContainer.setSelectedTab(tabToSelect);

							// Dispatch a single, clear event to update the UI
							const updateEvent = new CustomEvent('option-picker-update', {
								detail: {
									sortMethod: sortMethod,
									selectedTab: tabToSelect,
									source: 'viewControl-initialization-filter'
								},
								bubbles: true
							});
							document.dispatchEvent(updateEvent);
						}
					}, 50); // Small delay to ensure grouped options are updated
				}
			}

			// Reset the flag after a short delay
			setTimeout(() => {
				state.isProcessingEvent = false;
				console.log('Initialization complete');
			}, 100);
		}, 0);
	});

	// Separate effect to handle tab selection for non-'all' sort methods
	// This is separated to break the circular dependency
	$effect(() => {
		// Skip if we're currently processing an event to prevent loops
		if (state.isProcessingEvent) {
			return;
		}

		const currentSortMethod = optionPickerContainer.state.sortMethod;
		const selectedTab = optionPickerContainer.state.selectedTab;

		// Only proceed if we have a sort method but 'all' is selected as the tab
		// This is the specific case that was causing the infinite loop
		if (currentSortMethod && selectedTab === 'all' && state.selectedViewOption.value !== 'all') {
			// Get the current grouped options
			const currentGroupedOptions = groupedOptions.value;
			const categoryKeys = Object.keys(currentGroupedOptions);

			console.log('Available category keys in effect:', categoryKeys);

			// Only proceed if we have categories and we're not already processing an event
			if (categoryKeys.length > 0 && !state.isProcessingEvent) {
				// Set the flag to prevent event loops
				state.isProcessingEvent = true;

				// Select the first available category tab
				const tabToSelect = categoryKeys[0];
				console.log('Selecting first category tab in effect:', tabToSelect);

				// Use setTimeout to break the synchronous execution chain
				setTimeout(() => {
					// Update the selected tab in the container
					optionPickerContainer.setSelectedTab(tabToSelect);

					// Also update the last selected tab for this sort method
					optionPickerContainer.setLastSelectedTabForSort(currentSortMethod, tabToSelect);

					// Reset the flag after a short delay
					setTimeout(() => {
						state.isProcessingEvent = false;
					}, 50);
				}, 0);
			}
		}
	});
}

/**
 * Initialize compact mode based on props and window size
 */
export function initializeCompactMode(state: any, compact?: boolean) {
	$effect(() => {
		// Force compact mode on mobile devices
		const isMobile = window.innerWidth <= 640;
		state.isCompact = compact || isMobile || false;

		// Add resize listener to update compact mode when window size changes
		const handleResize = () => {
			const isMobile = window.innerWidth <= 640;
			state.isCompact = compact || isMobile || false;
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});
}
