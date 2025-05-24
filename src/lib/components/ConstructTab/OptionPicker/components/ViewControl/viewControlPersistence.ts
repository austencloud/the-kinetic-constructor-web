/**
 * ViewControl Persistence
 *
 * This module provides functions to save and restore the ViewControl state.
 */

import type { SortMethod } from '../../config';
import type { ViewOption } from './types';
import { viewOptions } from './viewOptions';
import { browser } from '$app/environment';

// Constants for localStorage keys
const VIEW_CONTROL_MODE_KEY = 'viewControlMode';
const VIEW_CONTROL_SORT_METHOD_KEY = 'viewControlSortMethod';

/**
 * Save the selected view option to localStorage
 */
export function saveViewOption(option: ViewOption): void {
	if (!browser) return;

	if (option.value === 'all') {
		localStorage.setItem(VIEW_CONTROL_MODE_KEY, 'all');
	} else {
		localStorage.setItem(VIEW_CONTROL_MODE_KEY, 'group');
		localStorage.setItem(VIEW_CONTROL_SORT_METHOD_KEY, option.value);
	}
}

/**
 * Get the initial view option from localStorage or fallback to default
 */
export function getInitialViewOption(
	currentSortMethod: SortMethod | 'all',
	selectedTab: string | null
): ViewOption {
	if (!browser) {
		// Server-side rendering, use default
		return getDefaultViewOption(currentSortMethod, selectedTab);
	}

	const viewMode = localStorage.getItem(VIEW_CONTROL_MODE_KEY);

	if (viewMode === 'all') {
		// "Show All" was previously selected
		const allOption = viewOptions.find((opt) => opt.value === 'all');
		if (allOption) {
			return allOption;
		}
	} else if (viewMode === 'group') {
		// A specific filter method was previously selected
		const sortMethod = localStorage.getItem(VIEW_CONTROL_SORT_METHOD_KEY);
		if (sortMethod) {
			const methodOption = viewOptions.find((opt) => opt.value === sortMethod);
			if (methodOption) {
				return methodOption;
			}
		}
	}

	// Fallback to default if localStorage values are invalid or not present
	return getDefaultViewOption(currentSortMethod, selectedTab);
}

/**
 * Get the default view option based on the current state
 */
function getDefaultViewOption(
	currentSortMethod: SortMethod | 'all',
	selectedTab: string | null
): ViewOption {
	// If the selected tab is 'all', show the "All" view option
	if (selectedTab === 'all') {
		return viewOptions.find((opt) => opt.value === 'all') || viewOptions[0];
	}

	// Otherwise, show the view option that matches the current sort method
	return (
		viewOptions.find((opt) => opt.value === currentSortMethod) ||
		viewOptions.find((opt) => opt.value === 'all') ||
		viewOptions[0]
	);
}

/**
 * Clear the view control persistence data
 * Useful for testing or resetting the state
 */
export function clearViewControlPersistence(): void {
	if (!browser) return;

	localStorage.removeItem(VIEW_CONTROL_MODE_KEY);
	localStorage.removeItem(VIEW_CONTROL_SORT_METHOD_KEY);
}
