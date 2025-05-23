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
 * Enhanced with stack trace capture for debugging
 *
 * @param effectFn The effect function to run
 * @param debugName Optional name for the effect to identify it in logs
 */
export function safeEffect(
	effectFn: () => void | (() => void),
	debugName: string = 'unnamed'
): void {
	// Create a flag to track if we're currently updating
	let isUpdating = $state(false);
	let updateCount = $state(0);
	let lastUpdateTime = $state(Date.now());

	// Capture the stack trace at creation time
	const creationStack = new Error().stack;

	// Set up the effect with protection against infinite loops
	$effect(() => {
		const now = Date.now();
		const timeSinceLastUpdate = now - lastUpdateTime;
		updateCount++;
		lastUpdateTime = now;

		// Log every effect run with timing information
		console.debug(
			`[safeEffect:${debugName}] Run #${updateCount}, ` +
				`${timeSinceLastUpdate}ms since last update`
		);

		// Detect potential infinite loops (many updates in short succession)
		if (updateCount > 5 && timeSinceLastUpdate < 50) {
			console.warn(
				`[safeEffect:${debugName}] Potential infinite loop detected! ` +
					`${updateCount} updates in rapid succession.`
			);
			console.warn(`Creation stack trace:`, creationStack);
			console.warn(`Current stack trace:`, new Error().stack);
		}

		// Skip if we're already updating
		if (isUpdating) {
			console.warn(
				`[safeEffect:${debugName}] Prevented recursive update! ` +
					`This could indicate an infinite loop.`
			);
			console.warn(`Current stack trace:`, new Error().stack);
			return;
		}

		try {
			// Set the flag to prevent recursive updates
			isUpdating = true;

			// Run the effect function
			return effectFn();
		} catch (error) {
			console.error(`[safeEffect:${debugName}] Error in effect:`, error);
			console.error(`Stack trace:`, new Error().stack);
			throw error;
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
 * Creates a debug effect that logs detailed information about each execution
 * This is a wrapper around Svelte's native $effect that adds debugging
 *
 * @param effectFn The effect function to run
 * @param debugName Optional name for the effect to identify it in logs
 */
export function debugEffect(
	effectFn: () => void | (() => void),
	debugName: string = 'debug-effect'
): void {
	let updateCount = $state(0);
	let lastUpdateTime = $state(Date.now());

	// Capture the stack trace at creation time
	const creationStack = new Error().stack;

	// Set up the effect with debugging
	$effect(() => {
		const now = Date.now();
		const timeSinceLastUpdate = now - lastUpdateTime;
		updateCount++;
		lastUpdateTime = now;

		// Log every effect run with timing information
		console.debug(
			`[debugEffect:${debugName}] Run #${updateCount}, ` +
				`${timeSinceLastUpdate}ms since last update`
		);

		// Detect potential infinite loops (many updates in short succession)
		if (updateCount > 5 && timeSinceLastUpdate < 50) {
			console.warn(
				`[debugEffect:${debugName}] Potential infinite loop detected! ` +
					`${updateCount} updates in rapid succession.`
			);
			console.warn(`Creation stack trace:`, creationStack);
			console.warn(`Current stack trace:`, new Error().stack);
		}

		try {
			// Run the effect function
			return effectFn();
		} catch (error) {
			console.error(`[debugEffect:${debugName}] Error in effect:`, error);
			console.error(`Stack trace:`, new Error().stack);
			throw error;
		}
	});
}

/**
 * Creates a safe async effect that prevents infinite update loops
 * Enhanced with stack trace capture for debugging
 *
 * @param asyncEffectFn The async effect function to run
 * @param debugName Optional name for the effect to identify it in logs
 */
/**
 * Monitors Svelte's internal effect queue to detect infinite loops
 * This function patches Svelte's internal flush mechanism to track effect executions
 *
 * @param options Configuration options for the monitor
 */
export function monitorEffectQueue(
	options: {
		warnThreshold?: number;
		errorThreshold?: number;
		timeWindow?: number;
		logFrequency?: number;
	} = {}
): () => void {
	// Default options
	const {
		warnThreshold = 50, // Warn after this many effects in the time window
		errorThreshold = 100, // Error after this many effects in the time window
		timeWindow = 1000, // Time window in ms to track effects
		logFrequency = 20 // Log every N effects
	} = options;

	// Track effect executions
	let effectCount = 0;
	let lastResetTime = Date.now();
	let isMonitoring = true;

	// Store original functions
	const originalFlushSync = (window as any).__svelte_flush_sync;
	const originalFlush = (window as any).__svelte_flush;

	if (!originalFlushSync || !originalFlush) {
		console.warn('Unable to monitor Svelte effect queue: internal functions not found');
		return () => {}; // Return no-op cleanup function
	}

	// Create wrapper for flush_sync
	(window as any).__svelte_flush_sync = function (...args: any[]) {
		if (isMonitoring) {
			trackEffect('flush_sync');
		}
		return originalFlushSync.apply(this, args);
	};

	// Create wrapper for flush
	(window as any).__svelte_flush = function (...args: any[]) {
		if (isMonitoring) {
			trackEffect('flush');
		}
		return originalFlush.apply(this, args);
	};

	// Track effect execution
	function trackEffect(type: string) {
		effectCount++;

		// Reset counter if time window has passed
		const now = Date.now();
		if (now - lastResetTime > timeWindow) {
			if (effectCount > 5) {
				console.debug(`[EffectMonitor] ${effectCount} effects in the last ${timeWindow}ms`);
			}
			effectCount = 1;
			lastResetTime = now;
			return;
		}

		// Log based on frequency
		if (effectCount % logFrequency === 0) {
			console.debug(`[EffectMonitor] ${effectCount} effects so far (${type})`);
		}

		// Check thresholds
		if (effectCount >= errorThreshold) {
			console.error(
				`[EffectMonitor] CRITICAL: ${effectCount} effects in ${now - lastResetTime}ms!`
			);
			console.error('This is almost certainly an infinite loop. Stack trace:', new Error().stack);
		} else if (effectCount >= warnThreshold) {
			console.warn(`[EffectMonitor] WARNING: ${effectCount} effects in ${now - lastResetTime}ms`);
			console.warn('This might be an infinite loop. Stack trace:', new Error().stack);
		}
	}

	// Return cleanup function
	return () => {
		isMonitoring = false;
		(window as any).__svelte_flush_sync = originalFlushSync;
		(window as any).__svelte_flush = originalFlush;
		console.debug('[EffectMonitor] Monitoring stopped');
	};
}

export function safeAsyncEffect(
	asyncEffectFn: () => Promise<void | (() => void)>,
	debugName: string = 'unnamed-async'
): void {
	// Create a flag to track if we're currently updating
	let isUpdating = $state(false);
	let updateCount = $state(0);
	let lastUpdateTime = $state(Date.now());

	// Capture the stack trace at creation time
	const creationStack = new Error().stack;

	// Set up the effect with protection against infinite loops
	$effect(() => {
		const now = Date.now();
		const timeSinceLastUpdate = now - lastUpdateTime;
		updateCount++;
		lastUpdateTime = now;

		// Log every effect run with timing information
		console.debug(
			`[safeAsyncEffect:${debugName}] Run #${updateCount}, ` +
				`${timeSinceLastUpdate}ms since last update`
		);

		// Detect potential infinite loops (many updates in short succession)
		if (updateCount > 5 && timeSinceLastUpdate < 50) {
			console.warn(
				`[safeAsyncEffect:${debugName}] Potential infinite loop detected! ` +
					`${updateCount} updates in rapid succession.`
			);
			console.warn(`Creation stack trace:`, creationStack);
			console.warn(`Current stack trace:`, new Error().stack);
		}

		// Skip if we're already updating
		if (isUpdating) {
			console.warn(
				`[safeAsyncEffect:${debugName}] Prevented recursive update! ` +
					`This could indicate an infinite loop.`
			);
			console.warn(`Current stack trace:`, new Error().stack);
			return;
		}

		// Set the flag to prevent recursive updates
		isUpdating = true;

		// Log the start of the async operation
		console.debug(`[safeAsyncEffect:${debugName}] Starting async operation`);

		// Run the async effect function
		asyncEffectFn()
			.catch((error) => {
				console.error(`[safeAsyncEffect:${debugName}] Error in async effect:`, error);
				console.error(`Stack trace:`, new Error().stack);
			})
			.finally(() => {
				// Reset the flag when done
				isUpdating = false;
				console.debug(`[safeAsyncEffect:${debugName}] Async operation completed`);
			});
	});
}
