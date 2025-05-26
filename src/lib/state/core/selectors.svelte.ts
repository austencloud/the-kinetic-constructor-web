/**
 * Modern Selector Utilities for Svelte 5
 *
 * This module provides modern runes-based selector utilities that replace
 * the legacy store-based selector system. All selectors use pure Svelte 5 runes.
 *
 * NO STORES - RUNES ONLY!
 */

import type { AnyActorRef } from 'xstate';

/**
 * Metadata for selectors to provide debugging and development information
 */
export interface SelectorMetadata {
	id: string;
	description?: string;
}

/**
 * A modern selector that wraps a reactive value with metadata
 */
export interface ModernSelector<T> {
	readonly value: T;
	readonly metadata: SelectorMetadata;
	getSnapshot(): T;
}

/**
 * Creates a modern selector using Svelte 5 runes - PURE RUNES, NO STORES!
 *
 * This function takes any reactive value and wraps it with metadata and a
 * consistent API. The result is reactive and can be used directly in Svelte components.
 *
 * @param selectorFn A function that returns the reactive value
 * @param metadata Metadata about the selector
 * @returns A modern selector with reactive value and metadata
 */
export function createSelector<T>(
	selectorFn: () => T,
	metadata: SelectorMetadata
): ModernSelector<T> {
	// Create derived reactive value using runes - NO STORES!
	const derivedValue = $derived(selectorFn());

	return {
		get value() {
			return derivedValue;
		},
		metadata,
		getSnapshot() {
			return derivedValue;
		}
	};
}

/**
 * Creates a modern XState machine selector using pure runes - NO STORES!
 *
 * This function directly accesses XState machine state without using stores,
 * providing a pure runes-based reactive selector.
 *
 * @param actor The XState actor/machine
 * @param selectorFn Function to extract value from machine snapshot
 * @param metadata Metadata about the selector
 * @returns A modern selector with reactive value and metadata
 */
export function createMachineSelector<T>(
	actor: AnyActorRef,
	selectorFn: (snapshot: any) => T,
	metadata: SelectorMetadata
): ModernSelector<T> {
	// Create reactive state that tracks the machine state - NO STORES!
	let currentValue = $state<T>(selectorFn(actor.getSnapshot()));

	// Subscribe to machine changes and update reactive state
	actor.subscribe((snapshot: any) => {
		currentValue = selectorFn(snapshot);
	});

	return {
		get value() {
			return currentValue;
		},
		metadata,
		getSnapshot() {
			return currentValue;
		}
	};
}

/**
 * Creates a selector from a static value (for compatibility)
 *
 * @param value The static value to wrap
 * @param metadata Metadata about the selector
 * @returns A modern selector
 */
export function createStaticSelector<T>(value: T, metadata: SelectorMetadata): ModernSelector<T> {
	return {
		get value() {
			return value;
		},
		metadata,
		getSnapshot() {
			return value;
		}
	};
}

/**
 * Utility to create a selector that memoizes expensive computations
 *
 * @param selectorFn Function that returns the reactive value
 * @param metadata Metadata about the selector
 * @returns A memoized modern selector
 */
export function createMemoizedSelector<T>(
	selectorFn: () => T,
	metadata: SelectorMetadata
): ModernSelector<T> {
	// Use $derived for automatic memoization
	const memoizedValue = $derived(selectorFn());

	return {
		get value() {
			return memoizedValue;
		},
		metadata,
		getSnapshot() {
			return memoizedValue;
		}
	};
}
