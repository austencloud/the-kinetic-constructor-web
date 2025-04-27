/**
 * Store Factory
 *
 * Provides factory functions for creating standardized Svelte stores.
 * These factories ensure consistent patterns and automatic registration with the state registry.
 */

import { writable, derived, get, type Writable, type Readable } from 'svelte/store';
import { stateRegistry } from './registry';

/**
 * Create a standard store with actions
 *
 * @param id Unique identifier for the store
 * @param initialState Initial state of the store
 * @param actions Object containing action methods that update the store
 * @param options Additional options for the store
 * @returns A store with actions and standard methods
 */
export function createStore<T, A extends Record<string, Function>>(
	id: string,
	initialState: T,
	actions: (set: (state: T) => void, update: (fn: (state: T) => T) => void, get: () => T) => A,
	options: {
		persist?: boolean;
		description?: string;
	} = {}
) {
	// Create the base writable store
	const { subscribe, set, update } = writable<T>(initialState);

	// Create a getter function
	const getState = () => get({ subscribe });

	// Create the actions
	const storeActions = actions(set, update, getState);

	// Always include a reset action
	const resetAction = {
		reset: () => set(initialState)
	};

	// Combine everything into a single store object
	const store = {
		subscribe,
		getSnapshot: getState, // Add getSnapshot method for compatibility
		...storeActions,
		...resetAction
	};

	// Register with the state registry
	stateRegistry.registerStore(id, store, {
		persist: options.persist,
		description: options.description
	});

	return store;
}

/**
 * Create a slice of a larger store
 *
 * @param parentStore The parent store this is a slice of
 * @param selector Function to select a portion of the parent state
 * @param options Additional options for the store
 * @returns A derived store that updates when the selected portion changes
 */
export function createSelector<T, S>(
	parentStore: Readable<T>,
	options: {
		id?: string;
		description?: string;
	} = {}
) {
	// In this case, parentStore is already a derived store with the selector applied
	const derivedStore = parentStore;

	// Register with the registry if an ID is provided
	if (options.id) {
		stateRegistry.registerStore(options.id, derivedStore, {
			persist: false, // Selectors should not be persisted directly
			description: options.description
		});
	}

	return derivedStore;
}

/**
 * Create a store that combines multiple stores
 *
 * @param stores Object containing the stores to combine
 * @param options Additional options for the store
 * @returns A derived store that updates when any of the source stores change
 */
export function combineStores<T extends Record<string, Readable<any>>>(
	stores: T,
	options: {
		id?: string;
		description?: string;
	} = {}
): Readable<{ [K in keyof T]: T[K] extends Readable<infer U> ? U : never }> {
	// Extract the store keys
	const storeKeys = Object.keys(stores) as Array<keyof T>;

	// Create an array of stores for the derived store
	const storeArray = storeKeys.map((key) => stores[key]);

	// Create the derived store
	const combinedStore = derived(storeArray, (values) => {
		// Create an object with the same keys as the input stores
		return storeKeys.reduce((result, key, index) => {
			result[key as string] = values[index];
			return result;
		}, {} as any);
	});

	// Register with the registry if an ID is provided
	if (options.id) {
		stateRegistry.registerStore(options.id, combinedStore, {
			persist: false, // Combined stores should not be persisted directly
			description: options.description
		});
	}

	return combinedStore;
}

/**
 * Create a persistent store that saves to localStorage
 *
 * @param id Unique identifier for the store
 * @param initialState Initial state of the store
 * @param options Additional options for the store
 * @returns A writable store that persists to localStorage
 */
export function createPersistentStore<T>(
	id: string,
	initialState: T,
	options: {
		description?: string;
		storage?: Storage;
	} = {}
): Writable<T> {
	// Use the provided storage or default to localStorage
	const storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);

	// Create the store with the initial state
	const { subscribe, set, update } = writable<T>(initialState, (set) => {
		// Try to load the persisted state when the store is initialized
		if (storage) {
			try {
				const persisted = storage.getItem(id);
				if (persisted) {
					set(JSON.parse(persisted));
				}
			} catch (e) {
				console.error(`Error loading persisted state for ${id}:`, e);
			}
		}

		// Return the unsubscribe function
		return () => {};
	});

	// Create a store object with persistence
	const persistentStore = {
		subscribe,
		set: (value: T) => {
			set(value);
			// Persist the new value
			if (storage) {
				try {
					storage.setItem(id, JSON.stringify(value));
				} catch (e) {
					console.error(`Error persisting state for ${id}:`, e);
				}
			}
		},
		update: (updater: (value: T) => T) => {
			update((current) => {
				const next = updater(current);
				// Persist the new value
				if (storage) {
					try {
						storage.setItem(id, JSON.stringify(next));
					} catch (e) {
						console.error(`Error persisting state for ${id}:`, e);
					}
				}
				return next;
			});
		}
	};

	// Register with the state registry
	stateRegistry.registerStore(id, persistentStore, {
		persist: true,
		description: options.description
	});

	return persistentStore;
}
