/**
 * Arrow Component Debugger
 * 
 * This module provides specialized debugging utilities for the Arrow component
 * to help identify and fix infinite loop issues in Svelte 5.
 */

import { monitorEffectQueue } from '$lib/state/core/svelte5-integration.svelte';

// Track all active monitors
const activeMonitors = new Map<string, () => void>();

/**
 * Start monitoring for infinite loops in the Arrow component
 * 
 * @param componentId A unique identifier for the component instance
 * @returns A function to stop monitoring
 */
export function startArrowMonitoring(componentId: string): () => void {
    // Stop any existing monitor for this component
    if (activeMonitors.has(componentId)) {
        const stopFn = activeMonitors.get(componentId);
        if (stopFn) stopFn();
        activeMonitors.delete(componentId);
    }
    
    // Start a new monitor
    console.debug(`[ArrowDebugger] Starting monitoring for Arrow ${componentId}`);
    
    // Create a stack trace at initialization time
    const initStack = new Error().stack;
    console.debug(`[ArrowDebugger] Initialization stack for ${componentId}:`, initStack);
    
    // Start monitoring Svelte's effect queue
    const stopMonitoring = monitorEffectQueue({
        warnThreshold: 30,
        errorThreshold: 50,
        timeWindow: 500,
        logFrequency: 10
    });
    
    // Store the stop function
    activeMonitors.set(componentId, stopMonitoring);
    
    // Return a function to stop monitoring
    return () => {
        console.debug(`[ArrowDebugger] Stopping monitoring for Arrow ${componentId}`);
        if (activeMonitors.has(componentId)) {
            const stopFn = activeMonitors.get(componentId);
            if (stopFn) stopFn();
            activeMonitors.delete(componentId);
        }
    };
}

/**
 * Log detailed information about an Arrow component's state
 * 
 * @param componentId A unique identifier for the component instance
 * @param state The component's state object
 */
export function logArrowState(componentId: string, state: any): void {
    console.debug(`[ArrowDebugger] State update for Arrow ${componentId}:`, {
        isLoaded: state.isLoaded,
        hasCalledLoaded: state.hasCalledLoaded,
        isInitialized: state.isInitialized,
        isLoadingStarted: state.isLoadingStarted,
        hasSvgData: !!state.svgData,
        timestamp: new Date().toISOString()
    });
}

/**
 * Log detailed information about an Arrow component's lifecycle event
 * 
 * @param componentId A unique identifier for the component instance
 * @param event The lifecycle event name
 * @param details Optional additional details
 */
export function logArrowLifecycle(componentId: string, event: string, details?: any): void {
    console.debug(`[ArrowDebugger] Lifecycle event for Arrow ${componentId}: ${event}`, details || '');
    
    // Capture stack trace for important events
    if (event === 'mounted' || event === 'unmounted' || event === 'error') {
        console.debug(`[ArrowDebugger] Stack trace for ${event}:`, new Error().stack);
    }
}
