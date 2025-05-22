/**
 * ViewControlState.svelte.ts - FIXED VERSION
 *
 * This module provides state management functions for the ViewControl component.
 * This file is named with .svelte.ts extension to enable rune syntax.
 */

import type { SortMethod } from '../../config';
import type { ViewOption } from './types';
import { viewOptions } from './viewOptions';
import {
	optionPickerContainer,
	groupedOptions
} from '$lib/state/stores/optionPicker/optionPickerContainer.svelte';
import { saveViewOption, getInitialViewOption } from './viewControlPersistence';

/**
 * Initialize the ViewControl state - FIXED VERSION
 */
export function initializeViewControlState() {
	// Create a single reactive state object instead of individual variables
	const state = $state({
		// Flag to prevent event loops
		isProcessingEvent: false,
		
		// UI state
		isOpen: false,
		buttonElement: null as HTMLButtonElement | null,
		isCompact: false,
		
		// Initialize the state with the result of the getInitialViewOption function
		selectedViewOption: getInitialViewOption(
			optionPickerContainer.state.sortMethod,
			optionPickerContainer.state.selectedTab
		) as ViewOption,
		
		// Track the last known state to prevent unnecessary updates
		lastKnownSortMethod: optionPickerContainer.state.sortMethod,
		lastKnownSelectedTab: optionPickerContainer.state.selectedTab
	});

	return state;
}

// Rest of the functions remain the same...
export function handleViewSelect(option: ViewOption, state: any, closeDropdown: () => void) {
	// Set the flag to prevent event loops
	state.isProcessingEvent = true;

	// Set the selected view option first
	state.selectedViewOption = option;
	console.log('Selected view option:', option.label, option.value);

	// Add haptic feedback on mobile devices
	if ('vibrate' in window.navigator) {
		try {
			window.navigator.vibrate(50);
		} catch (e) {
			// Ignore errors if vibration is not supported
		}
	}

	try {
		// Update the optionPickerContainer state directly
		if (option.value === 'all') {
			console.log('SHOW ALL SELECTED - Setting selectedTab to "all"');

			// When "Show All" is selected:
			// CRITICAL: Set the selectedTab to 'all' FIRST
			// This ensures the showTabs derived store immediately updates to hide tabs
			optionPickerContainer.setSelectedTab('all');

			// Then set the sort method (order matters here!)
			optionPickerContainer.setSortMethod('type');

			// Store 'all' as the last selected tab for the current sort method
			optionPickerContainer.setLastSelectedTabForSort('type', 'all');

			// Save the view option to localStorage
			// This ensures we restore the correct view on page refresh
			saveViewOption(option);

			// Update our tracking variables to prevent unnecessary effect triggers
			state.lastKnownSortMethod = 'type';
			state.lastKnownSelectedTab = 'all';

			console.log('Updated container state for Show All option');

			// Force an immediate UI update to show the helper text
			if (typeof document !== 'undefined') {
				// Dispatch a single, clear event to update the UI
				const updateEvent = new CustomEvent('option-picker-update', {
					detail: {
						sortMethod: 'type',
						selectedTab: 'all',
						source: 'viewControl-handleViewSelect-showAll'
					},
					bubbles: true
				});
				document.dispatchEvent(updateEvent);
			}
		} else {
			// For other sort methods, update the sort method first
			const sortMethod = option.value as SortMethod;
			optionPickerContainer.setSortMethod(sortMethod);

			// Save the view option to localStorage
			saveViewOption(option);

			// Update our tracking variable
			state.lastKnownSortMethod = sortMethod;

			// Use setTimeout to ensure the grouped options are updated before selecting a tab
			// This is crucial to avoid race conditions where the UI updates before the data is ready
			setTimeout(() => {
				// Get the current grouped options AFTER the sort method has been updated
				const currentGroupedOptions = groupedOptions.value;
				const categoryKeys = Object.keys(currentGroupedOptions);

				console.log('FILTER OPTION SELECTED - Getting tabs for:', sortMethod);
				console.log('Available category keys for sort method:', sortMethod, categoryKeys);

				// Check if there's a previously selected tab for this sort method
				const lastSelectedTab = optionPickerContainer.state.lastSelectedTab[sortMethod];

				// Important: First explicitly set selectedTab to something other than 'all'
				// to ensure the showTabs derived store updates correctly
				if (categoryKeys.length > 0) {
					// Temporarily set to the first category to ensure tabs are shown
					optionPickerContainer.setSelectedTab(categoryKeys[0]);
				}

				// Then, after a brief delay, set to the actual desired tab
				setTimeout(() => {
					if (
						lastSelectedTab &&
						lastSelectedTab !== 'all' &&
						categoryKeys.includes(lastSelectedTab)
					) {
						// If there's a previously selected tab for this sort method and it's valid, use it
						console.log('Using previously selected tab for this sort method:', lastSelectedTab);

						// Update the selected tab in the container
						optionPickerContainer.setSelectedTab(lastSelectedTab);

						// Update our tracking variable
						state.lastKnownSelectedTab = lastSelectedTab;
					} else if (categoryKeys.length > 0) {
						// Otherwise, select the appropriate default tab based on the sort method
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

						console.log(`Selecting default tab for ${sortMethod}:`, defaultTab);

						// Update the selected tab in the container
						optionPickerContainer.setSelectedTab(defaultTab);

						// Also update the last selected tab for this sort method
						optionPickerContainer.setLastSelectedTabForSort(sortMethod, defaultTab);

						// Update our tracking variable
						state.lastKnownSelectedTab = defaultTab;
					}

					// Force a UI update by dispatching a custom event
					const forceUpdateEvent = new CustomEvent('option-picker-update', {
						detail: {
							sortMethod: sortMethod,
							selectedTab: state.lastKnownSelectedTab,
							source: 'viewControl-handleViewSelect-delayed'
						},
						bubbles: true
					});
					document.dispatchEvent(forceUpdateEvent);
				}, 50); // Small delay to ensure the first selectedTab change is processed
			}, 50); // Small delay to ensure grouped options are updated

			console.log('ViewControl state after selection:', {
				selectedOption: option.value,
				containerState: {
					sortMethod: optionPickerContainer.state.sortMethod,
					selectedTab: optionPickerContainer.state.selectedTab
				}
			});
		}

		// Create a DOM event that will bubble up
		const customEvent = new CustomEvent('viewChange', {
			detail:
				option.value === 'all'
					? { mode: 'all' }
					: { mode: 'group', method: option.value as SortMethod },
			bubbles: true,
			composed: true
		});

		// Dispatch the event from the button element if available
		if (state.buttonElement) {
			console.log('Dispatching viewChange event');
			state.buttonElement.dispatchEvent(customEvent);
		} else {
			// Fallback to dispatching from the document
			console.warn('Button element not available, using document for event dispatch');
			document.dispatchEvent(customEvent);
		}

		// Only dispatch these events for the "Show All" option
		// For other options, we'll dispatch events after the setTimeout
		if (option.value === 'all') {
			// Dispatch an option-picker-update event to ensure the header and content are updated
			const updateEvent = new CustomEvent('option-picker-update', {
				detail: {
					sortMethod: 'type', // Keep the actual sort method as 'type'
					selectedTab: 'all', // But set the selected tab to 'all'
					source: 'viewControl-handleViewSelect-all'
				},
				bubbles: true
			});

			console.log('Dispatching option-picker-update event with detail:', updateEvent.detail);
			document.dispatchEvent(updateEvent);

			// Also dispatch an update-view-control event to ensure the ViewControl icon is updated
			const viewUpdateEvent = new CustomEvent('update-view-control', {
				detail: {
					mode: 'all',
					method: null,
					forceUpdate: true
				},
				bubbles: true
			});
			document.dispatchEvent(viewUpdateEvent);
		}
	} finally {
		// Reset the processing flag after a short delay
		// This ensures all reactive updates have completed
		setTimeout(() => {
			state.isProcessingEvent = false;
			console.log('Reset isProcessingEvent flag');
		}, 100);

		closeDropdown();
	}
}