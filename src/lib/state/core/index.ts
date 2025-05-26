/**
 * State Management Core
 *
 * This is the entry point for the state management system.
 * It exports all the core functionality for state management.
 */

// Export the modern runes registry
export * from './runesRegistry.svelte';

// Export modern selector utilities
export * from './selectors.svelte';

// No more store factories - runes only!

// Export machine factories
export * from './machine';

// Testing utilities removed - use direct imports from test files
