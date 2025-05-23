/**
 * Svelte 5 Runes Utilities
 *
 * This module provides utility functions for working with Svelte 5 runes.
 * It focuses exclusively on runes-based state management without any store integration.
 * This file has a .svelte.ts extension to enable runes support.
 */

import { untrack } from 'svelte';

/**
 * Creates a safe state update function that prevents infinite update loops
 *
 * @param updateFn The function to execute safely
 * @returns A function that safely executes the provided function
 */
export function safeUpdate<T extends any[]>(updateFn: (...args: T) => void): (...args: T) => void {
	// Create a flag to track if we're currently updating
	let isUpdating = $state(false);

	// Return a wrapped function that prevents recursive updates
	return (...args: T) => {
		// Skip if we're already updating
		if (isUpdating) return;

		try {
			// Set the flag to prevent recursive updates
			isUpdating = true;

			// Use untrack to prevent reactivity loops
			untrack(() => {
				updateFn(...args);
			});
		} finally {
			// Reset the flag when done
			isUpdating = false;
		}
	};
}

/**
 * Creates a debounced state update function
 *
 * @param updateFn The function to debounce
 * @param delayMs The debounce delay in milliseconds
 * @returns A debounced function
 */
export function debouncedUpdate<T extends any[]>(
	updateFn: (...args: T) => void,
	delayMs: number = 100
): (...args: T) => void {
	// Store the timeout ID
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	// Return a debounced function
	return (...args: T) => {
		// Clear any existing timeout
		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		// Set a new timeout
		timeoutId = setTimeout(() => {
			// Use untrack to prevent reactivity loops
			untrack(() => {
				updateFn(...args);
			});
		}, delayMs);
	};
}

/**
 * Creates a memoized value that only updates when dependencies change
 *
 * @param computeFn A function that computes the value
 * @returns A function that returns the memoized value
 */
export function memoized<T>(computeFn: () => T): () => T {
	// Create a derived value inside the function
	const value = $derived(computeFn());

	// Return a function that returns the derived value
	return () => value;
}

/**
 * Creates a safe effect that prevents infinite update loops
 *
 * @param effectFn The effect function to run
 */
export function safeEffect(effectFn: () => void | (() => void)): void {
	// Create a flag to track if we're currently updating
	let isUpdating = $state(false);

	// Set up the effect with protection against infinite loops
	$effect(() => {
		// Skip if we're already updating
		if (isUpdating) return;

		try {
			// Set the flag to prevent recursive updates
			isUpdating = true;

			// Run the effect function
			return effectFn();
		} finally {
			// Reset the flag when done
			isUpdating = false;
		}
	});
}

/**
 * Safely logs state objects by creating snapshots
 *
 * @param label A label for the log message
 * @param value The value to log (can be a state object or any other value)
 * @param options Additional options for logging
 */
export function safeLog(
	label: string,
	value: any,
	options: {
		level?: 'log' | 'debug' | 'info' | 'warn' | 'error';
		snapshot?: boolean;
	} = {}
): void {
	const { level = 'debug', snapshot = true } = options;

	// Create a safe copy of the value
	let safeValue;

	try {
		if (snapshot) {
			// Try to use $state.snapshot if available (Svelte 5 API)
			if (
				value &&
				typeof value === 'object' &&
				'$state' in globalThis &&
				typeof (globalThis as any).$state.snapshot === 'function'
			) {
				safeValue = (globalThis as any).$state.snapshot(value);
				console[level](`[snapshot] ${label}`, safeValue);
			} else {
				// For arrays and objects, create a shallow copy
				if (Array.isArray(value)) {
					safeValue = [...value];
				} else if (value && typeof value === 'object' && value !== null) {
					safeValue = { ...value };
				} else {
					safeValue = value;
				}
				console[level](`${label}`, safeValue);
			}
		} else {
			// Log directly without snapshot
			console[level](`${label}`, value);
		}
	} catch (error) {
		// If anything goes wrong, fall back to a simple string representation
		console[level](`${label} (safe logging failed)`, String(value));
	}
}

/**
 * Creates a state object with safe update methods
 *
 * @param initialState The initial state object
 * @returns A state object with safe update methods
 */
export function createSafeState<T extends object>(initialState: T) {
	// Create the state object
	const state = $state<T>({ ...initialState });

	// Create a safe update function
	const update = safeUpdate((newState: Partial<T>) => {
		// Update each property individually
		for (const key in newState) {
			if (Object.prototype.hasOwnProperty.call(newState, key)) {
				// Only update if the value has actually changed
				if (state[key as keyof T] !== newState[key as keyof T]) {
					state[key as keyof T] = newState[key as keyof T] as any;
				}
			}
		}
	});

	// Create a safe reset function
	const reset = safeUpdate(() => {
		// Reset to initial state
		for (const key in initialState) {
			if (Object.prototype.hasOwnProperty.call(initialState, key)) {
				state[key as keyof T] = initialState[key as keyof T];
			}
		}
	});

	return {
		state,
		update,
		reset
	};
}

/**
 * Creates a safe async effect that prevents infinite update loops
 *
 * @param asyncEffectFn The async effect function to run
 */
export function safeAsyncEffect(asyncEffectFn: () => Promise<void | (() => void)>): void {
	// Create a flag to track if we're currently updating
	let isUpdating = $state(false);

	// Set up the effect with protection against infinite loops
	$effect(() => {
		// Skip if we're already updating
		if (isUpdating) return;

		// Set the flag to prevent recursive updates
		isUpdating = true;

		// Run the async effect function
		asyncEffectFn()
			.catch((error) => {
				console.error('Error in async effect:', error);
			})
			.finally(() => {
				// Reset the flag when done
				isUpdating = false;
			});
	});
}
