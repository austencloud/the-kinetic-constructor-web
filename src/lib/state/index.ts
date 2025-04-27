/**
 * State Management
 *
 * This is the main entry point for the state management system.
 * It exports all state management functionality.
 */

// Export core functionality
export * from './core';

// Export machines
export * from './machines/app';

// Export stores
export * from './stores/pictograph';
export * from './stores/grid';
export * from './stores/background';
export * from './stores/settings';

/**
 * Initialize the state management system
 *
 * This function should be called at application startup to initialize
 * the state management system.
 */
export function initializeStateManagement(): void {
	// Import all stores to ensure they are registered with the registry
	import('./stores/pictograph');
	import('./stores/grid');
	import('./stores/background');
	import('./stores/settings');

	// Import all machines to ensure they are registered with the registry
	import('./machines/app');

	// Set up any cross-store synchronization

	// For example, sync settings with background store
	import { settingsStore } from './stores/settings';
	import { backgroundStore } from './stores/background';
	import { get } from 'svelte/store';

	// Initial sync
	const settings = get(settingsStore);
	backgroundStore.setBackground(settings.background);
	backgroundStore.setQuality(settings.backgroundQuality);

	// Set up listeners for future changes
	settingsStore.subscribe((settings) => {
		backgroundStore.setBackground(settings.background);
		backgroundStore.setQuality(settings.backgroundQuality);
	});
}
