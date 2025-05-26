/**
 * State Management Adapters with Svelte 5 Runes
 *
 * This module provides adapters between different state management approaches,
 * allowing for gradual migration from the old registry-based system to the new
 * container-based system.
 *
 * This file has a .svelte.ts extension to enable runes support.
 */

/**
 * Creates a derived container from another container using Svelte 5 runes
 *
 * @param container The source container
 * @param deriveFn A function that derives a new state from the source state
 * @returns A new container with the derived state
 */
export function deriveContainerWithRunes<T extends object, U extends object>(
	container: { state: T },
	deriveFn: (state: T) => U
): { state: U } {
	// Use $derived to create reactive derived state
	const derivedState = $derived(deriveFn(container.state));

	return {
		get state() {
			return derivedState;
		}
	};
}

/**
 * Creates a reactive state factory for containers
 * This replaces the need for store-based containers
 */
export function createReactiveContainer<T extends object>(
	initialState: T
): {
	state: T;
	setState: (newState: Partial<T>) => void;
	reset: () => void;
} {
	let state = $state<T>({ ...initialState });
	const originalState = { ...initialState };

	return {
		get state() {
			return state;
		},
		setState: (newState: Partial<T>) => {
			state = { ...state, ...newState };
		},
		reset: () => {
			state = { ...originalState };
		}
	};
}

/**
 * Creates a reactive derived state
 * This replaces derived stores
 */
export function createDerivedState<T, U>(source: () => T, deriveFn: (value: T) => U): () => U {
	return () => deriveFn(source());
}

/**
 * Creates a reactive effect
 * This replaces store subscriptions
 */
export function createReactiveEffect(fn: () => void): void {
	$effect(fn);
}

/**
 * Creates a reactive state with persistence
 * This replaces persistent stores
 */
export function createPersistentState<T>(
	key: string,
	initialValue: T,
	storage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as Storage)
): {
	value: T;
	setValue: (newValue: T) => void;
	reset: () => void;
} {
	// Try to load from storage
	let storedValue: T;
	try {
		const stored = storage.getItem(key);
		storedValue = stored ? JSON.parse(stored) : initialValue;
	} catch {
		storedValue = initialValue;
	}

	let value = $state<T>(storedValue);

	// Save to storage when value changes
	$effect(() => {
		try {
			storage.setItem(key, JSON.stringify(value));
		} catch {
			// Ignore storage errors
		}
	});

	return {
		get value() {
			return value;
		},
		setValue: (newValue: T) => {
			value = newValue;
		},
		reset: () => {
			value = initialValue;
		}
	};
}
