/**
 * State Registry
 *
 * A central registry for all state machines and stores in the application.
 * This helps with:
 * - Tracking all state containers
 * - Providing debugging capabilities
 * - Enabling persistence
 * - Facilitating testing
 */

import { browser } from '$app/environment';
import { writable, get, type Writable, type Readable } from 'svelte/store';
import { createActor, type AnyActorRef, type AnyStateMachine } from 'xstate';

// Types for the registry
export type StateContainerType = 'machine' | 'store';

export interface StateContainer {
	id: string;
	type: StateContainerType;
	instance: AnyActorRef | Readable<any>;
	persist?: boolean;
	description?: string;
}

// The registry itself
class StateRegistry {
	private containers: Map<string, StateContainer> = new Map();
	private persistenceEnabled = browser && typeof localStorage !== 'undefined';
	private persistenceKey = 'app_state';
	private persistedState: Record<string, any> = {};

	constructor() {
		// Load persisted state on initialization if in browser
		if (this.persistenceEnabled) {
			this.loadPersistedState();

			// Set up window unload event to save state
			if (typeof window !== 'undefined') {
				window.addEventListener('beforeunload', () => {
					this.persistState();
				});
			}
		}
	}

	/**
	 * Register a state container (machine or store)
	 */
	register<T extends AnyActorRef | Readable<any>>(
		id: string,
		instance: T,
		options: {
			type: StateContainerType;
			persist?: boolean;
			description?: string;
		}
	): T {
		if (this.containers.has(id)) {
			console.warn(`State container with ID "${id}" is already registered. Overwriting.`);
		}

		this.containers.set(id, {
			id,
			instance,
			...options
		});

		return instance;
	}

	/**
	 * Register a state machine
	 */
	registerMachine<T extends AnyStateMachine>(
		id: string,
		machine: T,
		options: {
			persist?: boolean;
			description?: string;
			snapshot?: any;
		} = {}
	): AnyActorRef {
		// Check for persisted state
		const persistedData = this.persistedState[id];
		const snapshot = persistedData?.type === 'machine' ? persistedData.snapshot : options.snapshot;

		// Create actor from machine
		const actor = createActor(machine, {
			snapshot,
			// Add inspector in dev mode
			inspect: import.meta.env.DEV
				? {
						onEvent: (event) => {
							console.log(`[${id}] Event:`, event);
						},
						onTransition: (state) => {
							console.log(`[${id}] State:`, state);
						}
					}
				: undefined
		});

		// Start the actor
		actor.start();

		// Register the actor
		this.containers.set(id, {
			id,
			type: 'machine',
			instance: actor,
			persist: options.persist,
			description: options.description
		});

		return actor;
	}

	/**
	 * Register a Svelte store
	 */
	registerStore<T>(
		id: string,
		store: Readable<T>,
		options: {
			persist?: boolean;
			description?: string;
		} = {}
	): Readable<T> {
		// Check for persisted state
		const persistedData = this.persistedState[id];

		// If this is a writable store and we have persisted data, restore it
		if (persistedData?.type === 'store' && 'set' in store) {
			const writableStore = store as Writable<T>;
			writableStore.set(persistedData.value);
		}

		this.containers.set(id, {
			id,
			type: 'store',
			instance: store,
			persist: options.persist,
			description: options.description
		});

		return store;
	}

	/**
	 * Get a state container by ID
	 */
	get<T extends AnyActorRef | Readable<any>>(id: string): T | undefined {
		const container = this.containers.get(id);
		return container ? (container.instance as T) : undefined;
	}

	/**
	 * Remove a state container from the registry
	 */
	unregister(id: string): boolean {
		return this.containers.delete(id);
	}

	/**
	 * Get all registered state containers
	 */
	getAll(): StateContainer[] {
		return Array.from(this.containers.values());
	}

	/**
	 * Get all state containers of a specific type
	 */
	getAllByType(type: StateContainerType): StateContainer[] {
		return this.getAll().filter((container) => container.type === type);
	}

	/**
	 * Clear the registry (useful for testing)
	 */
	clear(): void {
		// Stop all actors
		this.getAllByType('machine').forEach((container) => {
			const actor = container.instance as AnyActorRef;
			if (actor.getSnapshot().status === 'active') {
				actor.stop();
			}
		});

		this.containers.clear();
	}

	/**
	 * Persist state to localStorage
	 */
	persistState(): void {
		if (!this.persistenceEnabled) return;

		const persistedState: Record<string, any> = {};

		this.getAll().forEach((container) => {
			if (!container.persist) return;

			try {
				if (container.type === 'machine') {
					const actor = container.instance as AnyActorRef;
					persistedState[container.id] = {
						type: 'machine',
						snapshot: actor.getSnapshot()
					};
				} else {
					const store = container.instance as Readable<any>;
					persistedState[container.id] = {
						type: 'store',
						value: get(store)
					};
				}
			} catch (error) {
				console.error(`Failed to persist state for ${container.id}:`, error);
			}
		});

		try {
			localStorage.setItem(this.persistenceKey, JSON.stringify(persistedState));
		} catch (error) {
			console.error('Failed to persist state to localStorage:', error);
		}
	}

	/**
	 * Load persisted state from localStorage
	 */
	private loadPersistedState(): void {
		if (!this.persistenceEnabled) return;

		try {
			const persistedStateJson = localStorage.getItem(this.persistenceKey);
			if (!persistedStateJson) return;

			this.persistedState = JSON.parse(persistedStateJson);
		} catch (error) {
			console.error('Failed to load persisted state from localStorage:', error);
		}
	}

	/**
	 * Debug helper to log the current state of all containers
	 */
	debug(): void {
		console.group('State Registry');
		this.getAll().forEach((container) => {
			console.group(`${container.id} (${container.type})`);
			if (container.description) {
				console.log(`Description: ${container.description}`);
			}

			if (container.type === 'machine') {
				const actor = container.instance as AnyActorRef;
				console.log('State:', actor.getSnapshot());
			} else {
				const store = container.instance as Readable<any>;
				console.log('Value:', get(store));
			}

			console.groupEnd();
		});
		console.groupEnd();
	}

	/**
	 * Get persisted state for a specific ID
	 */
	getPersistedState(id: string): any {
		return this.persistedState[id];
	}
}

// Export a singleton instance
export const stateRegistry = new StateRegistry();
