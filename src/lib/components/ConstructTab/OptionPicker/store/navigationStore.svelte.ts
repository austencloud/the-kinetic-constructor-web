// src/lib/components/ConstructTab/OptionPicker/store/navigationStore.svelte.ts
// Svelte 5 runes-based navigation store

import { untrack } from 'svelte';
import type { SortMethod } from '../config';

export type NavigationDirection = 'forward' | 'backward' | 'initial';

interface NavigationState {
	currentTab: string | null;
	previousTab: string | null;
	direction: NavigationDirection;
	transitionLock: boolean;
	tabOrder: string[];
}

// Default state
const initialState: NavigationState = {
	currentTab: null,
	previousTab: null,
	direction: 'initial',
	transitionLock: false,
	tabOrder: ['all'] // Will be populated dynamically
};

// Create reactive state using Svelte 5 runes
export const navigationState = $state<NavigationState>(initialState);

// Guard flag to prevent reactive loops
let isProcessing = false;

/**
 * Navigate to a new tab with direction awareness
 */
export function selectTab(newTab: string | null, _sortMethod: SortMethod) {
	if (isProcessing) return;
	
	// Prevent rapid navigation during transitions
	if (navigationState.transitionLock) return;

	// If same tab, no navigation needed
	if (navigationState.currentTab === newTab) return;

	isProcessing = true;

	untrack(() => {
		// Determine direction based on tab order
		let direction: NavigationDirection = 'initial';

		if (navigationState.currentTab && newTab) {
			const prevIndex = navigationState.tabOrder.indexOf(navigationState.currentTab);
			const newIndex = navigationState.tabOrder.indexOf(newTab);

			if (prevIndex !== -1 && newIndex !== -1) {
				direction = prevIndex < newIndex ? 'forward' : 'backward';
			}
		}

		// Update state
		navigationState.previousTab = navigationState.currentTab;
		navigationState.currentTab = newTab;
		navigationState.direction = direction;
		navigationState.transitionLock = true;

		// Set transition lock with timeout
		setTimeout(() => {
			untrack(() => {
				navigationState.transitionLock = false;
			});
		}, 350); // Slightly longer than transition duration
	});

	isProcessing = false;
}

/**
 * Update the tab order based on available tabs
 */
export function setTabOrder(tabOrder: string[]) {
	if (isProcessing) return;
	
	isProcessing = true;
	untrack(() => {
		navigationState.tabOrder = tabOrder;
	});
	isProcessing = false;
}

/**
 * Reset the navigation state
 */
export function reset() {
	if (isProcessing) return;
	
	isProcessing = true;
	untrack(() => {
		navigationState.currentTab = initialState.currentTab;
		navigationState.previousTab = initialState.previousTab;
		navigationState.direction = initialState.direction;
		navigationState.transitionLock = initialState.transitionLock;
		navigationState.tabOrder = [...initialState.tabOrder];
	});
	isProcessing = false;
}

// Export getter function for components that need to access the state
export function getNavigationState() {
	return navigationState;
}

// Derived state for transition parameters
export const transitionParams = $derived(() => ({
	direction: navigationState.direction,
	duration: 300,
	delay: 0
}));

// Compatibility layer for old store API
export const navigationStore = {
	// Getter for state access (replaces $navigationStore)
	get state() {
		return navigationState;
	},
	
	// Methods
	selectTab,
	setTabOrder,
	reset
};
