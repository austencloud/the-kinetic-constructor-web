/**
 * DEPRECATED: Legacy adapters file
 *
 * This file is deprecated as we've moved to 100% Svelte 5 runes.
 * NO STORES - RUNES ONLY!
 *
 * All functionality has been moved to pure runes implementations.
 */

// This file is intentionally empty - all store-based adapters have been removed
// Use the new runes-based container system directly from container.svelte.ts

export function deprecatedNotice() {
	console.warn('Store adapters are deprecated. Use pure runes containers instead.');
}
