/**
 * Legacy Settings Store Compatibility Layer
 * 
 * This file provides backward compatibility for components still importing
 * from the old settings.store path. It re-exports from the modern settings module.
 * 
 * TODO: Update all imports to use the new path and remove this file
 */

// Re-export everything from the modern settings module
export * from '../../settings.svelte';
