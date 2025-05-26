/**
 * DEPRECATED: Pictograph Lifecycle Manager
 *
 * This file used stores and has been completely removed in favor of runes-based approach.
 * NO STORES - RUNES ONLY!
 */

/**
 * DEPRECATED: Context for component initialization
 * This interface used stores and has been removed in favor of runes-based approach.
 */
export interface InitializationContext {
	// DEPRECATED - use runes instead
}

/**
 * DEPRECATED: Initializes the pictograph component
 * This function used stores and has been removed in favor of runes-based approach.
 */
export function initializePictograph(): any {
	throw new Error('initializePictograph is deprecated. Use runes-based initialization instead.');
}

/**
 * DEPRECATED: Creates a cleanup function for the pictograph component
 * This function used stores and has been removed in favor of runes-based approach.
 */
export function createCleanupFunction(): any {
	throw new Error('createCleanupFunction is deprecated. Use runes-based cleanup instead.');
}

/**
 * DEPRECATED: Creates a context for pictograph initialization
 * This function used stores and has been removed in favor of runes-based approach.
 */
export function createInitializationContext(): any {
	throw new Error('createInitializationContext is deprecated. Use runes-based context instead.');
}
