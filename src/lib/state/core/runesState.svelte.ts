/**
 * Modern Svelte 5 Runes State Factory
 *
 * Provides factory functions for creating standardized reactive state using Svelte 5 runes.
 * These factories ensure consistent patterns and automatic registration with the state registry.
 */

import { browser } from '$app/environment';
import { stateRegistry } from './registry';

/**
 * Create a reactive state with actions using Svelte 5 runes
 *
 * @param id Unique identifier for the state
 * @param initialState Initial state value
 * @param actions Object containing action methods that update the state
 * @param options Additional options for the state
 * @returns A reactive state object with actions
 */
export function createRunesState<T, A extends Record<string, Function>>(
	id: string,
	initialState: T,
	actions: (
		setState: (newState: T) => void,
		updateState: (fn: (state: T) => T) => void,
		getState: () => T
	) => A,
	options: {
		persist?: boolean;
		description?: string;
		storage?: Storage;
	} = {}
) {
	// Create reactive state
	let state = $state(initialState);

	// State management functions
	const setState = (newState: T) => {
		state = newState;
		if (options.persist) {
			persistState(newState);
		}
	};

	const updateState = (fn: (state: T) => T) => {
		state = fn(state);
		if (options.persist) {
			persistState(state);
		}
	};

	const getState = () => state;

	// Create the actions
	const stateActions = actions(setState, updateState, getState);

	// Always include a reset action
	const resetAction = {
		reset: () => setState(initialState)
	};

	// Persistence functions
	const storage = options.storage || (browser ? localStorage : null);

	const persistState = (value: T) => {
		if (!storage || !browser) return;

		try {
			storage.setItem(id, JSON.stringify(value));
		} catch (error) {
			console.warn(`Failed to persist state for ${id}:`, error);
		}
	};

	const loadPersistedState = () => {
		if (!storage || !browser) return;

		try {
			const persisted = storage.getItem(id);
			if (persisted) {
				const parsed = JSON.parse(persisted);
				state = parsed;
			}
		} catch (error) {
			console.warn(`Failed to load persisted state for ${id}:`, error);
		}
	};

	// Load persisted state if persistence is enabled
	if (options.persist) {
		loadPersistedState();
	}

	// Combine everything into a single state object
	const stateObject = {
		get state() {
			return state;
		},
		getSnapshot: getState, // For compatibility with XState and other libraries
		...stateActions,
		...resetAction
	};

	// Register with the state registry (simplified for runes)
	try {
		stateRegistry.registerStore(id, stateObject as any, {
			persist: options.persist,
			description: options.description
		});
	} catch (error) {
		console.warn(`Failed to register state ${id} with registry:`, error);
	}

	return stateObject;
}

/**
 * Create a derived reactive value using Svelte 5 runes
 *
 * @param id Unique identifier for the derived state
 * @param deriveFn Function that computes the derived value
 * @param options Additional options
 * @returns A derived reactive value
 */
export function createDerivedState<T>(
	id: string,
	deriveFn: () => T,
	options: {
		description?: string;
	} = {}
) {
	// Create derived state
	const derivedValue = $derived(deriveFn());

	const derivedObject = {
		get value() {
			return derivedValue;
		},
		getSnapshot: () => derivedValue
	};

	// Register with the state registry
	try {
		stateRegistry.registerStore(id, derivedObject as any, {
			persist: false, // Derived values should not be persisted
			description: options.description
		});
	} catch (error) {
		console.warn(`Failed to register derived state ${id} with registry:`, error);
	}

	return derivedObject;
}

/**
 * Create a persistent reactive state that saves to localStorage
 *
 * @param id Unique identifier for the state
 * @param initialState Initial state value
 * @param options Additional options
 * @returns A reactive state that persists to localStorage
 */
export function createPersistentRunesState<T>(
	id: string,
	initialState: T,
	options: {
		description?: string;
		storage?: Storage;
		debounceTime?: number;
	} = {}
) {
	const storage = options.storage || (browser ? localStorage : null);
	const debounceTime = options.debounceTime || 200;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Create reactive state
	let state = $state(initialState);

	// Load persisted state on initialization
	if (storage && browser) {
		try {
			const persisted = storage.getItem(id);
			if (persisted) {
				const parsed = JSON.parse(persisted);
				state = parsed;
			}
		} catch (error) {
			console.warn(`Failed to load persisted state for ${id}:`, error);
		}
	}

	// Debounced persistence function
	const persistState = (value: T) => {
		if (!storage || !browser) return;

		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		debounceTimer = setTimeout(() => {
			try {
				storage.setItem(id, JSON.stringify(value));
			} catch (error) {
				console.warn(`Failed to persist state for ${id}:`, error);
			}
		}, debounceTime);
	};

	// State management functions
	const setState = (newState: T) => {
		state = newState;
		persistState(newState);
	};

	const updateState = (fn: (state: T) => T) => {
		state = fn(state);
		persistState(state);
	};

	const getState = () => state;

	// Create the state object
	const persistentState = {
		get state() {
			return state;
		},
		set: setState,
		update: updateState,
		getSnapshot: getState,
		reset: () => setState(initialState)
	};

	// Register with the state registry
	try {
		stateRegistry.registerStore(id, persistentState as any, {
			persist: true,
			description: options.description
		});
	} catch (error) {
		console.warn(`Failed to register persistent state ${id} with registry:`, error);
	}

	return persistentState;
}

/**
 * Create a simple reactive state without actions
 *
 * @param initialValue Initial value
 * @returns A simple reactive state
 */
export function createSimpleState<T>(initialValue: T) {
	let state = $state(initialValue);

	return {
		get value() {
			return state;
		},
		set value(newValue: T) {
			state = newValue;
		},
		update: (fn: (current: T) => T) => {
			state = fn(state);
		},
		getSnapshot: () => state
	};
}

/**
 * Create a reactive effect that runs when dependencies change
 *
 * @param effectFn Function to run when dependencies change
 * @param dependencies Optional array of dependencies to track
 */
export function createReactiveEffect(
	effectFn: () => void | (() => void),
	dependencies?: (() => any)[]
) {
	if (dependencies && dependencies.length > 0) {
		// Track specific dependencies
		$effect(() => {
			// Access all dependencies to track them
			dependencies.forEach((dep) => dep());
			return effectFn();
		});
	} else {
		// Track all reactive values accessed in the effect
		$effect(effectFn);
	}
}
