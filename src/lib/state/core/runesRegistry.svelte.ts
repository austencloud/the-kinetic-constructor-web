/**
 * Modern Runes-Based State Registry
 *
 * This replaces the deprecated StateRegistry with a pure Svelte 5 runes implementation.
 * NO STORES - RUNES ONLY!
 */

import { createActor, type AnyStateMachine, type AnyActorRef } from 'xstate';

// Modern registry entry type
interface RunesRegistryEntry {
	id: string;
	type: 'machine' | 'container' | 'state';
	instance: any;
	metadata: {
		persist?: boolean;
		description?: string;
		created: number;
	};
}

// Registry state using runes
let _registryEntries = $state<Map<string, RunesRegistryEntry>>(new Map());
let _registryConfig = $state({
	enablePersistence: true,
	enableDebug: false,
	maxEntries: 100
});

/**
 * Modern runes-based registry for state management
 */
export class RunesStateRegistry {
	/**
	 * Register a machine with the registry
	 */
	registerMachine<TMachine extends AnyStateMachine>(
		id: string,
		machine: TMachine,
		options: {
			persist?: boolean;
			description?: string;
		} = {}
	): AnyActorRef {
		// Create the actor
		const actor = createActor(machine);

		// Register the entry
		const entry: RunesRegistryEntry = {
			id,
			type: 'machine',
			instance: actor,
			metadata: {
				persist: options.persist,
				description: options.description,
				created: Date.now()
			}
		};

		_registryEntries.set(id, entry);

		// Start the actor
		actor.start();

		return actor;
	}

	/**
	 * Register a generic state container
	 */
	register(
		id: string,
		instance: any,
		options: {
			type?: 'machine' | 'container' | 'state';
			persist?: boolean;
			description?: string;
		} = {}
	): void {
		const entry: RunesRegistryEntry = {
			id,
			type: options.type || 'state',
			instance,
			metadata: {
				persist: options.persist,
				description: options.description,
				created: Date.now()
			}
		};

		_registryEntries.set(id, entry);
	}

	/**
	 * Get a registered entry by ID
	 */
	get(id: string): RunesRegistryEntry | undefined {
		return _registryEntries.get(id);
	}

	/**
	 * Get all registered entries
	 */
	getAll(): RunesRegistryEntry[] {
		return Array.from(_registryEntries.values());
	}

	/**
	 * Get entries by type
	 */
	getAllByType(type: 'machine' | 'container' | 'state'): RunesRegistryEntry[] {
		return this.getAll().filter((entry) => entry.type === type);
	}

	/**
	 * Unregister an entry
	 */
	unregister(id: string): boolean {
		const entry = _registryEntries.get(id);
		if (entry) {
			// Stop the actor if it's a machine
			if (entry.type === 'machine' && entry.instance?.stop) {
				entry.instance.stop();
			}
			return _registryEntries.delete(id);
		}
		return false;
	}

	/**
	 * Clear all entries
	 */
	clear(): void {
		// Stop all machines before clearing
		for (const entry of _registryEntries.values()) {
			if (entry.type === 'machine' && entry.instance?.stop) {
				entry.instance.stop();
			}
		}
		_registryEntries.clear();
	}

	/**
	 * Get registry statistics
	 */
	getStats() {
		const entries = this.getAll();
		return {
			total: entries.length,
			machines: entries.filter((e) => e.type === 'machine').length,
			containers: entries.filter((e) => e.type === 'container').length,
			states: entries.filter((e) => e.type === 'state').length,
			persisted: entries.filter((e) => e.metadata.persist).length
		};
	}

	/**
	 * Debug information
	 */
	debug(): void {
		if (_registryConfig.enableDebug) {
			console.group('🔧 Runes State Registry Debug');
			console.log('📊 Stats:', this.getStats());
			console.log('📋 Entries:', this.getAll());
			console.groupEnd();
		}
	}
}

// Create singleton instance
export const runesStateRegistry = new RunesStateRegistry();

// Export getter functions for reactive access
export function getRegistryEntries(): RunesRegistryEntry[] {
	return Array.from(_registryEntries.values());
}

export function getRegistryStats() {
	return runesStateRegistry.getStats();
}

export function getRegistryConfig() {
	return _registryConfig;
}

// Backward compatibility - export as stateRegistry
export const stateRegistry = runesStateRegistry;
