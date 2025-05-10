/**
 * Modern state container utility
 *
 * This module provides a simplified approach to state management using Svelte stores.
 * It's designed to replace the more complex store/registry pattern with a more direct
 * and ergonomic API.
 *
 * Note: This implementation uses Svelte stores which are compatible with both Svelte 4
 * and Svelte 5. For Svelte 5 runes integration, use the container in Svelte components.
 */

import { writable, get, type Writable } from 'svelte/store';

/**
 * Creates a state container with the given initial state and actions
 *
 * @param initialState The initial state object
 * @param actions A function that receives the state and returns action functions
 * @returns A state container with getters and actions
 */
export function createContainer<T extends object, A extends Record<string, Function>>(
	initialState: T,
	actions: (state: T, update: (fn: (state: T) => void) => void) => A
): { state: T } & A & { reset: () => void; subscribe: Writable<T>['subscribe'] } {
	// Create a writable store
	const store = writable<T>(structuredClone(initialState));

	// Function to update state immutably
	const update = (fn: (state: T) => void) => {
		store.update((currentState) => {
			try {
				// Try to use structuredClone for deep cloning
				const copy = structuredClone(currentState);
				fn(copy);
				return copy;
			} catch (error) {
				// If structuredClone fails (e.g., with Promise objects), fall back to a shallow copy
				console.warn('structuredClone failed, falling back to shallow copy:', error);
				const shallowCopy = { ...currentState };
				fn(shallowCopy);
				return shallowCopy;
			}
		});
	};

	// Create actions with access to state via store.update
	const boundActions = actions(
		// Proxy that forwards property access to the store value
		new Proxy({} as T, {
			get: (_, prop: string) => {
				const value = get(store);
				return value[prop as keyof T];
			},
			set: (_, prop: string, value) => {
				store.update((state) => {
					const newState = { ...state };
					(newState as any)[prop] = value;
					return newState;
				});
				return true;
			}
		}),
		update
	);

	// Create a reset function
	const reset = () => {
		try {
			// Try to use structuredClone for deep cloning
			store.set(structuredClone(initialState));
		} catch (error) {
			// If structuredClone fails (e.g., with Promise objects), fall back to a shallow copy
			console.warn('structuredClone failed in reset, falling back to shallow copy:', error);
			store.set({ ...initialState });
		}
	};

	// Create the container object with proper typing
	const container = {
		get state() {
			return get(store);
		},
		...boundActions,
		reset,
		// Add subscribe method for compatibility with Svelte stores
		subscribe: store.subscribe
	};

	// Return the container with proper type
	return container as typeof container & { subscribe: typeof store.subscribe };
}

/**
 * Creates a derived value from a state container
 *
 * @param fn A function that computes the derived value
 * @returns The derived value
 */
export function createDerived<T>(fn: () => T): { value: T; _update: () => void } {
	// Create a store that can be manually updated
	const store = writable<T>(fn());

	return {
		get value() {
			return get(store);
		},
		_update: () => {
			store.set(fn());
		}
	};
}

/**
 * Creates an effect that runs when dependencies change
 *
 * @param fn A function that performs side effects
 * @returns A cleanup function
 */
export function createEffect(fn: () => void | (() => void)): () => void {
	// Execute the function immediately
	const cleanup = fn();

	// Return a cleanup function if one was provided
	return typeof cleanup === 'function' ? cleanup : () => {};
}
