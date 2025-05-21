/**
 * Svelte 5 Runes Integration
 *
 * This module provides utilities for integrating our store-based state management
 * with Svelte 5 runes. This file has a .svelte.ts extension to enable runes support.
 */

import type { Readable } from 'svelte/store';

/**
 * Creates a reactive state variable from a Svelte store
 *
 * @param store A Svelte store
 * @param defaultValue Optional default value to use before the store is initialized
 * @returns A reactive state variable that updates when the store changes
 */
export function useStore<T>(store: Readable<T>, defaultValue?: T): T {
	// Create a mutable reactive state variable with default value if provided
	let state = $state<T | undefined>(defaultValue);

	// Initialize with first value
	let initialized = $state(false);

	// Set up an effect to update the state when the store changes
	$effect(() => {
		// Log for debugging
		console.log('Setting up store subscription');

		// Get the initial value immediately
		try {
			// Use the get function if available
			if (typeof store.get === 'function') {
				const initialValue = (store as any).get();
				if (initialValue !== undefined) {
					state = initialValue;
					initialized = true;
					console.log('Initial store value:', initialValue);
				}
			}
		} catch (e) {
			console.warn('Error getting initial store value:', e);
		}

		// Subscribe to future updates
		const unsubscribe = store.subscribe((value) => {
			console.log('Store updated with value:', value);
			if (value !== undefined) {
				state = value;
				initialized = true;
			}
		});

		return unsubscribe;
	});

	// Create a variable to store the state
	const stateValue = $derived(state as T);

	// Return a proxy that uses default values if not initialized
	return new Proxy(Object.create(null), {
		get: (_target, prop) => {
			// Special case for Symbol.toPrimitive and other built-in symbols
			if (typeof prop === 'symbol') {
				// Handle primitive conversion explicitly
				if (prop === Symbol.toPrimitive) {
					return (hint: string) => {
						// If not initialized or value is null/undefined, return appropriate defaults
						if (!initialized || stateValue === null || stateValue === undefined) {
							if (hint === 'number') return 0;
							return hint === 'string' ? '' : false;
						}

						// For primitive values, return them directly
						if (
							typeof stateValue === 'string' ||
							typeof stateValue === 'number' ||
							typeof stateValue === 'boolean'
						) {
							return stateValue;
						}

						// For objects, convert based on hint
						if (hint === 'string') {
							return String(stateValue);
						} else if (hint === 'number') {
							return Number(stateValue);
						} else {
							// Default conversion
							return String(stateValue);
						}
					};
				}
				return undefined;
			}

			if (!initialized) {
				// If we have a default value, use it
				if (defaultValue !== undefined && defaultValue !== null) {
					return defaultValue[prop as keyof T];
				}
				// Otherwise return undefined for the property
				return undefined;
			}

			// Handle null or undefined state values
			if (stateValue === null || stateValue === undefined) {
				return undefined;
			}

			return stateValue[prop as keyof T];
		}
		// We can't directly add valueOf and toString to the proxy
		// Instead, we'll handle primitive conversions through Symbol.toPrimitive
	}) as T;
}

/**
 * Creates a reactive state variable from a container
 *
 * @param container A state container
 * @returns A reactive state variable that updates when the container changes
 */
export function useContainer<T extends object>(container: {
	state: T;
	subscribe: Readable<T>['subscribe'];
}): T {
	// Create a mutable reactive state variable with initial value from container
	let state = $state<T>({ ...container.state });

	// Set up an effect to update the state when the container changes
	$effect(() => {
		const unsubscribe = container.subscribe((value) => {
			// Update all properties of the state object
			Object.assign(state, value);
		});

		return unsubscribe;
	});

	return state;
}

/**
 * Creates a derived value from a reactive state variable
 *
 * @param fn A function that computes the derived value
 * @returns A derived value that updates when dependencies change
 */
export function useDerived<T>(fn: () => T): T {
	const value = $derived(fn());
	return value;
}

/**
 * Creates an effect that runs when dependencies change
 *
 * @param fn A function that performs side effects
 * @returns A cleanup function
 */
export function useEffect(fn: () => void | (() => void)): void {
	$effect(() => {
		return fn();
	});
}

/**
 * Creates a reactive state variable from an XState machine container
 *
 * @param container A machine container
 * @returns A reactive state object with machine state and helper methods
 */
export function useMachine<T extends object, E extends { type: string }>(container: {
	state: T;
	subscribe: Readable<T>['subscribe'];
	send: (event: E) => void;
	can: (eventType: string) => boolean;
	matches: (stateValue: string) => boolean;
	hasTag: (tag: string) => boolean;
}) {
	// Create a mutable reactive state variable with initial value from container
	let state = $state<T>({ ...container.state });

	// Set up an effect to update the state when the container changes
	$effect(() => {
		const unsubscribe = container.subscribe((value) => {
			// Update all properties of the state object
			Object.assign(state, value);
		});

		return unsubscribe;
	});

	// Create helper methods that use the reactive state
	const can = (eventType: string) => container.can(eventType);
	const matches = (stateValue: string) => container.matches(stateValue);
	const hasTag = (tag: string) => container.hasTag(tag);
	const send = (event: E) => container.send(event);

	return {
		state,
		can,
		matches,
		hasTag,
		send
	};
}
