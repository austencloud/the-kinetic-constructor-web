/**
 * Legacy UI Store Compatibility Layer
 * 
 * This file provides backward compatibility for components still importing
 * from the old uiStore path. It re-exports from the modern UI store module.
 * 
 * TODO: Update all imports to use the new path and remove this file
 */

// Re-export everything from the modern UI store module
export * from './ui/uiStore.svelte';
