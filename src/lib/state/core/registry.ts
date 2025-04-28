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
	type ActorOptions,
	type AnyEventObject,
	type Actor,
	type SnapshotFrom,
	type InspectionEvent
} from 'xstate';

// Types for the registry
export type StateContainerType = 'machine' | 'store';

export interface StateContainer {
	id: string;
	type: StateContainerType;
	instance: AnyActorRef | Readable<any>;
	persist?: boolean;
	description?: string;
	subscriptions?: Set<() => void>; // Track subscriptions for cleanup
}

// Error types for persistence operations
export class PersistenceError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'PersistenceError';
	}
}

export class DataCorruptionError extends PersistenceError {
	constructor(id: string, originalError?: Error) {
		super(`Corrupted data detected for ${id}${originalError ? `: ${originalError.message}` : ''}`);
		this.name = 'DataCorruptionError';
	}
}

export class StorageError extends PersistenceError {
	constructor(operation: string, originalError?: Error) {
		super(
			`Storage operation failed during ${operation}${
				originalError ? `: ${originalError.message}` : ''
			}`
		);
		this.name = 'StorageError';
	}
}

// The registry itself
class StateRegistry {
	private containers: Map<string, StateContainer> = new Map();
	private persistenceEnabled = browser && typeof localStorage !== 'undefined';
	private persistenceKey = 'app_state';
	private persistedState: Record<string, any> = {};
	private lastPersistedState: Record<string, any> = {}; // Cache for selective persistence
	private persistenceDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	private persistenceDebounceDelay = 300; // ms
	private dependencies: Map<string, Set<string>> = new Map(); // Track dependencies between state containers

	constructor() {
		if (this.persistenceEnabled) {
			this.loadPersistedState();

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
			// Clean up existing subscriptions if any
			this.unregister(id);
		}

		this.containers.set(id, {
			id,
			instance,
			subscriptions: new Set(),
			...options
		});

		return instance;
	}

	/**
	 * Add a dependency relationship between state containers
	 */
	addDependency(dependentId: string, dependencyId: string): void {
		// Check if both IDs exist in the registry
		if (!this.containers.has(dependentId)) {
			console.warn(`Cannot add dependency: dependent ID "${dependentId}" is not registered`);
			return;
		}
		if (!this.containers.has(dependencyId)) {
			console.warn(`Cannot add dependency: dependency ID "${dependencyId}" is not registered`);
			return;
		}

		// Get or create the set of dependencies for this dependent
		if (!this.dependencies.has(dependentId)) {
			this.dependencies.set(dependentId, new Set());
		}

		// Add the dependency
		this.dependencies.get(dependentId)!.add(dependencyId);
	}

	/**
	 * Get all dependencies for a state container
	 */
	getDependencies(id: string): string[] {
		return Array.from(this.dependencies.get(id) || []);
	}

	/**
	 * Get all dependents of a state container
	 */
	getDependents(id: string): string[] {
		const dependents: string[] = [];
		this.dependencies.forEach((deps, depId) => {
			if (deps.has(id)) {
				dependents.push(depId);
			}
		});
		return dependents;
	}

	/**
	 * Get initialization order based on dependency graph
	 */
	getInitializationOrder(): string[] {
		return this.topologicalSort();
	}

	/**
	 * Perform topological sorting of the dependency graph
	 * This ensures that dependencies are initialized before dependents
	 */
	private topologicalSort(): string[] {
		const result: string[] = [];
		const visited = new Set<string>();
		const temporaryMark = new Set<string>();

		// Helper function for depth-first search
		const visit = (id: string) => {
			if (temporaryMark.has(id)) {
				console.error(`Circular dependency detected including ${id}`);
				return; // Skip circular dependencies
			}
			if (visited.has(id)) return;

			temporaryMark.add(id);

			// Visit all dependencies first
			const deps = this.dependencies.get(id);
			if (deps) {
				for (const depId of deps) {
					visit(depId);
				}
			}

			temporaryMark.delete(id);
			visited.add(id);
			result.push(id);
		};

		// Visit all nodes
		for (const id of this.containers.keys()) {
			if (!visited.has(id)) {
				visit(id);
			}
		}

		return result;
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
			snapshot?: SnapshotFrom<T>;
		} = {}
	): Actor<T> {
		// Check for persisted state with validation
		let snapshotToRestore: SnapshotFrom<T> | undefined = undefined;
		const persistedData = this.persistedState[id];

		if (persistedData?.type === 'machine') {
			try {
				// Validate persisted snapshot
				if (this.validateMachineSnapshot(persistedData.snapshot)) {
					snapshotToRestore = persistedData.snapshot;
				} else {
					throw new DataCorruptionError(id);
				}
			} catch (error) {
				console.error(`Invalid persisted snapshot for machine "${id}". Using fallback.`, error);
				// Use the provided snapshot as fallback
				snapshotToRestore = options.snapshot;
			}
		} else {
			// No persisted data, use the provided snapshot
			snapshotToRestore = options.snapshot;
		}

		const actorOptions: ActorOptions<T> = {};

		if (snapshotToRestore) {
			actorOptions.snapshot = snapshotToRestore;
		}

		let actor: Actor<T>;

		if (import.meta.env.DEV) {
			import('./logger')
				.then(({ LogLevel, shouldLog, log }) => {
					actorOptions.inspect = (inspectionEvent: InspectionEvent) => {
						if (!actor) return;
						if (inspectionEvent.type === '@xstate.event' && inspectionEvent.actorRef === actor) {
							if (shouldLog(id, LogLevel.DEBUG)) {
								log(id, LogLevel.DEBUG, 'Event:', inspectionEvent.event);
							}
						} else if (
							inspectionEvent.type === '@xstate.snapshot' &&
							inspectionEvent.actorRef === actor
						) {
							if (shouldLog(id, LogLevel.DEBUG)) {
								log(id, LogLevel.DEBUG, 'State:', inspectionEvent.snapshot);
							}
						}
					};
				})
				.catch((err) => {
					console.error('Failed to load logger:', err);
				});
		}

		actor = createActor(machine, actorOptions) as Actor<T>;
		actor.start();

		this.containers.set(id, {
			id,
			type: 'machine',
			instance: actor,
			persist: options.persist,
			description: options.description,
			subscriptions: new Set()
		});

		return actor;
	}

	/**
	 * Validate a machine snapshot to ensure it has the expected structure
	 */
	private validateMachineSnapshot(snapshot: any): boolean {
		// Basic structure validation for XState machine snapshots
		return (
			snapshot &&
			typeof snapshot === 'object' &&
			'status' in snapshot &&
			typeof snapshot.status === 'string' &&
			['active', 'done', 'error', 'stopped'].includes(snapshot.status) &&
			'context' in snapshot &&
			typeof snapshot.context === 'object'
		);
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
			persistFields?: string[]; // Add support for selective field persistence
		} = {}
	): Readable<T> {
		// Check for persisted state with validation
		const persistedData = this.persistedState[id];

		// If this is a writable store and we have persisted data, restore it
		if (persistedData?.type === 'store' && 'set' in store) {
			const writableStore = store as Writable<T>;
			try {
				// Validate and sanitize persisted data
				if (this.validateStoreData<T>(persistedData.value)) {
					writableStore.set(persistedData.value);
				} else {
					throw new DataCorruptionError(id);
				}
			} catch (error) {
				console.error(`Failed to restore persisted state for store "${id}":`, error);
				// No need to explicitly fall back to initial state, as it already has that value
			}
		}

		// Create container entry with subscription tracking
		const container: StateContainer = {
			id,
			type: 'store',
			instance: store,
			persist: options.persist,
			description: options.description,
			subscriptions: new Set()
		};

		this.containers.set(id, container);

		return store;
	}

	/**
	 * Validate store data to ensure it's safe to use
	 * This can be extended with more specific validation logic as needed
	 */
	private validateStoreData<T>(data: any): data is T {
		// Basic validation to check if the data is not undefined or corrupted
		return data !== undefined && data !== null;
	}

	/**
	 * Get a state container by ID
	 */
	get<T extends AnyActorRef | Readable<any>>(id: string): T | undefined {
		const container = this.containers.get(id);
		return container ? (container.instance as T) : undefined;
	}

	/**
	 * Remove a state container from the registry and clean up all subscriptions
	 */
	unregister(id: string): boolean {
		const container = this.containers.get(id);
		if (!container) return false;

		// Clean up based on container type
		if (container.type === 'machine') {
			const actor = container.instance as AnyActorRef;
			if (actor && actor.getSnapshot().status !== 'stopped') {
				try {
					actor.stop();
				} catch (error) {
					console.error(`Error stopping actor ${id}:`, error);
				}
			}
		}

		// Clean up all subscriptions
		if (container.subscriptions) {
			container.subscriptions.forEach((unsubscribe) => {
				try {
					unsubscribe();
				} catch (error) {
					console.error(`Error unsubscribing from ${id}:`, error);
				}
			});
		}

		// Remove from dependencies
		this.dependencies.delete(id);
		// Remove as dependency from other containers
		for (const [depId, deps] of this.dependencies.entries()) {
			deps.delete(id);
		}

		return this.containers.delete(id);
	}

	/**
	 * Track a subscription for automatic cleanup
	 */
	trackSubscription(id: string, unsubscribe: () => void): void {
		const container = this.containers.get(id);
		if (container && container.subscriptions) {
			container.subscriptions.add(unsubscribe);
		}
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
			if (actor && actor.getSnapshot().status !== 'stopped') {
				try {
					actor.stop();
				} catch (error) {
					console.error(`Error stopping actor ${container.id}:`, error);
				}
			}
		});

		// Clean up all subscriptions
		this.containers.forEach((container) => {
			if (container.subscriptions) {
				container.subscriptions.forEach((unsubscribe) => {
					try {
						unsubscribe();
					} catch (error) {
						console.error(`Error during unsubscribe in clear():`, error);
					}
				});
			}
		});

		this.containers.clear();
		this.dependencies.clear();
		this.persistedState = {};
		this.lastPersistedState = {};
	}

	/**
	 * Persist state to localStorage with debouncing and selective updating
	 */
	persistState(): void {
		if (!this.persistenceEnabled) return;

		// Clear any existing debounce timer
		if (this.persistenceDebounceTimer) {
			clearTimeout(this.persistenceDebounceTimer);
		}

		// Set a new debounce timer
		this.persistenceDebounceTimer = setTimeout(() => {
			this.performPersist();
		}, this.persistenceDebounceDelay);
	}

	/**
	 * Actually perform the persistence operation after debounce
	 */
	private performPersist(): void {
		if (!this.persistenceEnabled) return;

		const stateToPersist: Record<string, any> = {};
		let hasChanges = false;

		this.getAll().forEach((container) => {
			if (!container.persist) return;

			try {
				const instance = container.instance;
				let currentStateValue: any;
				let lastPersistedValue: any = this.lastPersistedState[container.id]?.value;

				// Extract current state value based on container type
				if (
					container.type === 'machine' &&
					instance &&
					typeof (instance as AnyActorRef).send === 'function'
				) {
					const actorInstance = instance as AnyActorRef;
					if (actorInstance.getSnapshot().status !== 'stopped') {
						const persistedSnapshot = actorInstance.getPersistedSnapshot();
						if (persistedSnapshot !== undefined) {
							currentStateValue = persistedSnapshot;
							// For machines, we need to compare stringified snapshots since they're complex objects
							if (
								!lastPersistedValue ||
								JSON.stringify(lastPersistedValue) !== JSON.stringify(currentStateValue)
							) {
								stateToPersist[container.id] = {
									type: 'machine',
									snapshot: currentStateValue
								};
								hasChanges = true;
							}
						}
					}
				} else if (container.type === 'store') {
					const store = instance as Readable<any>;
					currentStateValue = get(store);

					// Check if the current state is different from the last persisted state
					if (
						!lastPersistedValue ||
						JSON.stringify(lastPersistedValue) !== JSON.stringify(currentStateValue)
					) {
						stateToPersist[container.id] = {
							type: 'store',
							value: currentStateValue
						};
						hasChanges = true;
					}
				}

				// Update the last persisted state cache if we're persisting this item
				if (stateToPersist[container.id]) {
					if (!this.lastPersistedState[container.id]) {
						this.lastPersistedState[container.id] = {};
					}
					this.lastPersistedState[container.id].value = currentStateValue;
				}
			} catch (error) {
				console.error(`Failed to get state for persistence for ${container.id}:`, error);
			}
		});

		// Only save to localStorage if there are changes
		if (hasChanges) {
			try {
				localStorage.setItem(this.persistenceKey, JSON.stringify(stateToPersist));
			} catch (error) {
				const storageError = new StorageError('write', error instanceof Error ? error : undefined);
				console.error(storageError.message);

				// Attempt to handle quota exceeded errors by clearing less important data
				if (error instanceof DOMException && error.name === 'QuotaExceededError') {
					this.handleStorageQuotaError();
				}
			}
		}
	}

	/**
	 * Handle storage quota errors by trying to free up space
	 */
	private handleStorageQuotaError(): void {
		try {
			// Strategy: Remove non-critical persisted states
			// This requires knowledge of which states are critical vs. non-critical
			// Here's a simplified example - in practice, you'd have a more sophisticated approach

			const allPersistedState = JSON.parse(localStorage.getItem(this.persistenceKey) || '{}');
			const criticalStateKeys = Object.keys(allPersistedState).filter(
				(key) =>
					// Define your criteria for critical states here
					key.includes('user') || key.includes('auth') || key.includes('app')
			);

			const reducedState: Record<string, any> = {};
			criticalStateKeys.forEach((key) => {
				reducedState[key] = allPersistedState[key];
			});

			// Try to save the reduced state
			localStorage.setItem(this.persistenceKey, JSON.stringify(reducedState));
			console.warn('Storage quota exceeded - reduced persisted state to critical data only');
		} catch (error) {
			console.error('Failed to handle storage quota error:', error);
		}
	}

	/**
	 * Load persisted state from localStorage with enhanced validation and recovery
	 */
	private loadPersistedState(): void {
		if (!this.persistenceEnabled) return;

		try {
			const persistedStateJson = localStorage.getItem(this.persistenceKey);
			if (!persistedStateJson) {
				this.persistedState = {};
				return;
			}

			// Parse the JSON data
			const parsedData = JSON.parse(persistedStateJson);

			// Validate the overall structure
			if (typeof parsedData !== 'object' || parsedData === null) {
				throw new DataCorruptionError('root');
			}

			// Initialize with empty object, then add valid entries
			this.persistedState = {};

			// Process each entry with validation
			Object.entries(parsedData).forEach(([id, data]: [string, any]) => {
				try {
					// Basic structure validation
					if (!data || typeof data !== 'object' || !('type' in data)) {
						throw new DataCorruptionError(id);
					}

					// Type-specific validation
					if (
						data.type === 'machine' &&
						(!('snapshot' in data) || !this.validateMachineSnapshot(data.snapshot))
					) {
						throw new DataCorruptionError(id);
					} else if (data.type === 'store' && !('value' in data)) {
						throw new DataCorruptionError(id);
					}

					// If it passed validation, add to persisted state
					this.persistedState[id] = data;

					// Also update last persisted state cache for selective persistence
					if (!this.lastPersistedState[id]) {
						this.lastPersistedState[id] = {};
					}

					if (data.type === 'machine') {
						this.lastPersistedState[id].value = data.snapshot;
					} else if (data.type === 'store') {
						this.lastPersistedState[id].value = data.value;
					}
				} catch (error) {
					console.warn(`Skipping corrupted state for "${id}":`, error);
					// Don't add corrupted entries to the persistedState object
				}
			});
		} catch (error) {
			console.error('Failed to load or parse persisted state from localStorage:', error);
			// Reset on critical errors and attempt recovery
			this.persistedState = {};
			this.lastPersistedState = {};

			// Optionally backup and clear the corrupted data
			if (typeof localStorage !== 'undefined') {
				try {
					// Back up the corrupted data for potential recovery
					const corruptedData = localStorage.getItem(this.persistenceKey);
					if (corruptedData) {
						localStorage.setItem(`${this.persistenceKey}_corrupted_backup`, corruptedData);
						localStorage.removeItem(this.persistenceKey);
					}
				} catch {
					// If even this fails, just give up on persistence for now
				}
			}
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

			// Add dependency information if available
			const dependencies = this.getDependencies(container.id);
			if (dependencies.length > 0) {
				console.log('Dependencies:', dependencies);
			}

			const dependents = this.getDependents(container.id);
			if (dependents.length > 0) {
				console.log('Dependents:', dependents);
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
