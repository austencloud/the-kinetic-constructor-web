/**
 * Container Utilities - Svelte 5 Runes Implementation
 * Provides state container patterns
 */

export interface StateContainer<T = any> {
	getSnapshot(): T;
	subscribe(callback: (state: T) => void): () => void;
}

export type StateContainerType = 'runes' | 'store' | 'machine';

/**
 * Create a simple state container
 */
export function createStateContainer<T>(initialState: T): StateContainer<T> {
	let state = $state(initialState);
	const subscribers = new Set<(state: T) => void>();

	return {
		getSnapshot() {
			return state;
		},
		subscribe(callback: (state: T) => void) {
			subscribers.add(callback);
			callback(state); // Call immediately with current state
			
			return () => {
				subscribers.delete(callback);
			};
		}
	};
}
