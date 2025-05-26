/**
 * DEPRECATED: Registry Types
 *
 * This file provides type definitions for the deprecated registry system.
 * These types are kept for backward compatibility only.
 * NO STORES - RUNES ONLY!
 */

/**
 * DEPRECATED: State registry entry type
 */
export interface StateRegistryEntry {
	id: string;
	type: 'store' | 'machine' | 'container';
	instance: any;
	dependencies: string[];
	metadata: {
		persist?: boolean;
		description?: string;
		created: number;
	};
}

/**
 * DEPRECATED: Registry configuration
 */
export interface RegistryConfig {
	enablePersistence?: boolean;
	enableDebug?: boolean;
	maxEntries?: number;
}

/**
 * DEPRECATED: Registry state
 */
export interface RegistryState {
	entries: Map<string, StateRegistryEntry>;
	dependencies: Map<string, Set<string>>;
	config: RegistryConfig;
}

// Export for backward compatibility
export type StateRegistryType = 'store' | 'machine' | 'container';
