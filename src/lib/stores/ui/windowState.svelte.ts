/**
 * Window Height Store
 *
 * Provides the current window height as a reactive value.
 * This file uses Svelte 5 runes for reactivity.
 */

import { browser } from '$app/environment';

// Create a reactive state for window height
let height = $state(browser ? `${window.innerHeight}px` : '100vh');

// Set up resize listener if in browser environment
if (browser) {
	const updateHeight = () => {
		height = `${window.innerHeight}px`;
	};

	window.addEventListener('resize', updateHeight);

	// Clean up function (can be called in onDestroy)
	const destroy = () => window.removeEventListener('resize', updateHeight);

	// Export the destroy function for components that need to clean up
	$effect.root(() => {
		return destroy;
	});
}

// Export the height value
export const windowHeight = {
	get value() {
		return height;
	}
};

// For backward compatibility with code that expects a store
export function getWindowHeight() {
	return height;
}
