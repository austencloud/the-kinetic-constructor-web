/**
 * Runes State Registry - Pure Svelte 5 Implementation
 * Replaces XState with simple reactive state management
 */

import { browser } from '$app/environment';

// Registry for tracking state instances
const stateRegistry = new Map<string, any>();

/**
 * Register a state instance in the global registry
 */
export function registerState(key: string, state: any): void {
	if (browser) {
		stateRegistry.set(key, state);
	}
}

/**
 * Get a state instance from the registry
 */
export function getState<T>(key: string): T | undefined {
	return stateRegistry.get(key);
}

/**
 * Remove a state instance from the registry
 */
export function unregisterState(key: string): void {
	stateRegistry.delete(key);
}

/**
 * Clear all registered states
 */
export function clearRegistry(): void {
	stateRegistry.clear();
}

/**
 * Get all registered state keys
 */
export function getRegisteredKeys(): string[] {
	return Array.from(stateRegistry.keys());
}

/**
 * Runes State Registry - Main export
 */
export const runesStateRegistry = {
	register: registerState,
	get: getState,
	unregister: unregisterState,
	clear: clearRegistry,
	getKeys: getRegisteredKeys
};
