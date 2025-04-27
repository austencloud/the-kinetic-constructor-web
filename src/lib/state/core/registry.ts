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
import {
	createActor,
	type AnyActorRef,
	type AnyStateMachine,
	type ActorOptions, // Import ActorOptions type
	type AnyEventObject, // Example type for event object
	type Actor, // Import Actor type for more specific typing if needed
	type SnapshotFrom, // Utility type to get snapshot type from machine
	type InspectionEvent // Type for inspection events
	// Removed isActorRef import
} from 'xstate';

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
	// Store raw persisted data loaded from storage
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
			// Use SnapshotFrom<T> for the snapshot type
			snapshot?: SnapshotFrom<T>;
		} = {}
	): Actor<T> {
		// Return a more specific Actor type
		// Check for persisted state loaded from storage
		const persistedData = this.persistedState[id];
		// Attempt to use persisted snapshot first, then option snapshot
		const snapshotToRestore: SnapshotFrom<T> | undefined =
			persistedData?.type === 'machine' ? persistedData.snapshot : options.snapshot;

		// Construct actor options carefully
		// Initialize with correct base type, explicitly defining snapshot type
		const actorOptions: ActorOptions<T> = {};

		// Add snapshot if it exists and is valid
		if (snapshotToRestore) {
			// Basic validation (you might add more specific checks)
			if (
				typeof snapshotToRestore === 'object' &&
				snapshotToRestore !== null &&
				'status' in snapshotToRestore
			) {
				actorOptions.snapshot = snapshotToRestore;
			} else {
				console.warn(`Invalid persisted snapshot format for machine "${id}". Ignoring.`);
			}
		}

		// Define actor variable here so it's accessible within inspect callback closure
		let actor: Actor<T>;

		// Add inspector in dev mode
		if (import.meta.env.DEV) {
			// Import the logger
			import('./logger')
				.then(({ LogLevel, shouldLog, log }) => {
					// Use 'inspect' with a single callback function
					actorOptions.inspect = (inspectionEvent: InspectionEvent) => {
						// Ensure actor is defined before checking actorRef
						if (!actor) return;
						// Filter based on the type of inspection event
						if (inspectionEvent.type === '@xstate.event' && inspectionEvent.actorRef === actor) {
							// Event received by or sent from this specific actor
							if (shouldLog(id, LogLevel.DEBUG)) {
								log(id, LogLevel.DEBUG, 'Event:', inspectionEvent.event);
							}
						} else if (
							inspectionEvent.type === '@xstate.snapshot' &&
							inspectionEvent.actorRef === actor
						) {
							// Snapshot emitted by this specific actor
							if (shouldLog(id, LogLevel.DEBUG)) {
								log(id, LogLevel.DEBUG, 'State:', inspectionEvent.snapshot);
							}
						}
						// Add other checks like '@xstate.actor' if needed
					};
				})
				.catch((err) => {
					console.error('Failed to load logger:', err);
				});
		}

		// Create actor from machine with constructed options
		// Cast the result to Actor<T> for better type safety downstream
		actor = createActor(machine, actorOptions) as Actor<T>;

		// Start the actor
		actor.start();

		// Register the actor
		this.containers.set(id, {
			id,
			type: 'machine',
			instance: actor, // Store the specifically typed actor
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
			try {
				// Ensure the value exists before setting
				if (persistedData.value !== undefined) {
					writableStore.set(persistedData.value);
				}
			} catch (error) {
				console.error(`Failed to restore persisted state for store "${id}":`, error);
			}
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
		const container = this.containers.get(id);
		if (container?.type === 'machine') {
			const actor = container.instance as AnyActorRef;
			// Check status before stopping
			if (actor && actor.getSnapshot().status !== 'stopped') {
				try {
					actor.stop();
				} catch (error) {
					console.error(`Error stopping actor ${id}:`, error);
				}
			}
		}
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
		// Stop all actors before clearing
		this.getAllByType('machine').forEach((container) => {
			const actor = container.instance as AnyActorRef;
			// Check if actor exists and is running before stopping
			if (actor && actor.getSnapshot().status !== 'stopped') {
				try {
					actor.stop();
				} catch (error) {
					console.error(`Error stopping actor ${container.id}:`, error);
				}
			}
		});

		this.containers.clear();
		// Also clear persisted state cache in memory
		this.persistedState = {};
		// Optionally clear localStorage as well during a full clear
		// if (this.persistenceEnabled) {
		// 	try {
		// 		localStorage.removeItem(this.persistenceKey);
		// 	} catch (error) {
		// 		console.error('Failed to clear persisted state from localStorage:', error);
		// 	}
		// }
	}

	/**
	 * Persist state to localStorage
	 */
	persistState(): void {
		if (!this.persistenceEnabled) return;

		const stateToPersist: Record<string, any> = {};

		this.getAll().forEach((container) => {
			if (!container.persist) return;

			try {
				const instance = container.instance; // Get the instance

				// Use a type guard check for actor properties (like .send)
				if (
					container.type === 'machine' &&
					instance &&
					typeof (instance as AnyActorRef).send === 'function'
				) {
					const actorInstance = instance as AnyActorRef; // Cast after check
					if (actorInstance.getSnapshot().status !== 'stopped') {
						// Now TypeScript should be more confident it's an actor
						const persistedSnapshot = actorInstance.getPersistedSnapshot();
						if (persistedSnapshot !== undefined) {
							// Check if defined
							stateToPersist[container.id] = {
								type: 'machine',
								snapshot: persistedSnapshot
							};
						}
					}
				} else if (container.type === 'store') {
					// Assuming it's a Readable store if not a machine
					const store = instance as Readable<any>;
					stateToPersist[container.id] = {
						type: 'store',
						value: get(store) // get() from svelte/store
					};
				}
			} catch (error) {
				console.error(`Failed to get state for persistence for ${container.id}:`, error);
			}
		});

		try {
			// Only save if there's something to persist
			if (Object.keys(stateToPersist).length > 0) {
				localStorage.setItem(this.persistenceKey, JSON.stringify(stateToPersist));
			} else {
				// Optionally remove the key if nothing is persisted anymore
				// localStorage.removeItem(this.persistenceKey);
			}
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
			if (!persistedStateJson) {
				this.persistedState = {}; // Ensure it's an empty object if nothing is found
				return;
			}

			this.persistedState = JSON.parse(persistedStateJson);
			// Basic validation
			if (typeof this.persistedState !== 'object' || this.persistedState === null) {
				console.warn('Invalid persisted state format found in localStorage. Resetting.');
				this.persistedState = {};
			}
		} catch (error) {
			console.error('Failed to load or parse persisted state from localStorage:', error);
			this.persistedState = {}; // Reset on error
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

			try {
				const instance = container.instance;
				// Use the same type guard here for consistency
				if (
					container.type === 'machine' &&
					instance &&
					typeof (instance as AnyActorRef).send === 'function'
				) {
					const actor = instance as AnyActorRef;
					console.log('State:', actor.getSnapshot());
				} else if (container.type === 'store') {
					const store = instance as Readable<any>;
					console.log('Value:', get(store));
				}
			} catch (error) {
				console.error(`Error getting state for ${container.id}:`, error);
			}

			console.groupEnd();
		});
		console.groupEnd();
	}

	/**
	 * Get persisted state for a specific ID (loaded at startup)
	 */
	getPersistedState(id: string): any {
		return this.persistedState[id];
	}
}

// Export a singleton instance
export const stateRegistry = new StateRegistry();
