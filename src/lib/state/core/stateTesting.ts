/**
 * State Testing Utilities - Svelte 5 Runes Implementation
 */

import { runesStateRegistry } from './runesRegistry.svelte';

/**
 * Reset all state for testing
 */
export function resetAllState(): void {
	runesStateRegistry.clear();
}

/**
 * Mock state for testing
 */
export function mockState<T>(key: string, mockValue: T): void {
	runesStateRegistry.register(key, mockValue);
}

/**
 * Get state for testing
 */
export function getTestState<T>(key: string): T | undefined {
	return runesStateRegistry.get<T>(key);
}
