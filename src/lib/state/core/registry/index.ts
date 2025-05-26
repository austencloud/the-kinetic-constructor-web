/**
 * DEPRECATED: Legacy State Registry
 *
 * This file is deprecated as we've moved to 100% Svelte 5 runes.
 * NO STORES - RUNES ONLY!
 *
 * All state management is now handled by pure runes containers.
 */

// Re-export types for backward compatibility
export * from './types';
export * from './errors';

// DEPRECATED: Legacy registry class - kept for backward compatibility only
class StateRegistry {
	constructor() {
		console.warn('StateRegistry is deprecated. Use pure runes containers instead.');
	}

	// All methods are deprecated - use pure runes containers instead
	register(): any {
		throw new Error('StateRegistry.register() is deprecated. Use pure runes containers instead.');
	}

	// All other methods are deprecated
	addDependency(): any {
		throw new Error('Deprecated - use pure runes');
	}
	getDependencies(): any {
		throw new Error('Deprecated - use pure runes');
	}
	getDependents(): any {
		throw new Error('Deprecated - use pure runes');
	}
	getInitializationOrder(): any {
		throw new Error('Deprecated - use pure runes');
	}
	registerMachine(): any {
		throw new Error('Deprecated - use pure runes');
	}
	registerStore(): any {
		throw new Error('Deprecated - use pure runes');
	}
	get(): any {
		throw new Error('Deprecated - use pure runes');
	}
	unregister(): any {
		throw new Error('Deprecated - use pure runes');
	}
	trackSubscription(): any {
		throw new Error('Deprecated - use pure runes');
	}
	getAll(): any {
		throw new Error('Deprecated - use pure runes');
	}
	getAllByType(): any {
		throw new Error('Deprecated - use pure runes');
	}
	clear(): any {
		throw new Error('Deprecated - use pure runes');
	}
	persistState(): any {
		throw new Error('Deprecated - use pure runes');
	}
	debug(): any {
		throw new Error('Deprecated - use pure runes');
	}
	getPersistedState(): any {
		throw new Error('Deprecated - use pure runes');
	}
}

// Export a singleton instance
export const stateRegistry = new StateRegistry();
