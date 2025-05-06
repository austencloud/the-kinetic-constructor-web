/**
 * Utility functions for updating dev tools with current application state
 */

import { sequenceStore } from '$lib/state/stores/sequenceStore';
import { get } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Update the dev tools with the current sequence state
 * This makes the sequence data visible and up-to-date in the dev tools
 */
export function updateDevTools() {
  if (!browser) return;

  try {
    // Get the current sequence state
    const sequenceState = get(sequenceStore);

    // Create a custom property on the window object for dev tools inspection
    if (typeof window !== 'undefined') {
      // Create a global object for our app state if it doesn't exist
      if (!window.hasOwnProperty('appState')) {
        Object.defineProperty(window, 'appState', {
          value: {},
          writable: true,
          configurable: true
        });
      }

      // Update the sequence state in the global object
      // @ts-ignore - Adding custom property to window
      window.appState.sequence = JSON.parse(JSON.stringify(sequenceState));
      
      // Also add it directly to window for easier access
      // @ts-ignore - Adding custom property to window
      window.sequence = JSON.parse(JSON.stringify(sequenceState));

    
    }
  } catch (error) {
    console.error('[Dev Tools] Error updating dev tools:', error);
  }
}

/**
 * Initialize dev tools updater
 * Sets up subscriptions to stores to keep dev tools updated
 */
export function initDevToolsUpdater() {
  if (!browser) return;

  try {
    // Subscribe to the sequence store to update dev tools when it changes
    const unsubscribe = sequenceStore.subscribe((state) => {
      // Create a global object for our app state if it doesn't exist
      if (!window.hasOwnProperty('appState')) {
        Object.defineProperty(window, 'appState', {
          value: {},
          writable: true,
          configurable: true
        });
      }

      // Update the sequence state in the global object
      // @ts-ignore - Adding custom property to window
      window.appState.sequence = JSON.parse(JSON.stringify(state));
      
      // Also add it directly to window for easier access
      // @ts-ignore - Adding custom property to window
      window.sequence = JSON.parse(JSON.stringify(state));
    });

    // Add the sequence state to the window object for easy access in dev tools
    const initialState = get(sequenceStore);
    // @ts-ignore - Adding custom property to window
    window.appState = { sequence: JSON.parse(JSON.stringify(initialState)) };
    // @ts-ignore - Adding custom property to window
    window.sequence = JSON.parse(JSON.stringify(initialState));

    // Return the unsubscribe function
    return unsubscribe;
  } catch (error) {
    console.error('[Dev Tools] Error initializing dev tools updater:', error);
    return () => {}; // Return a no-op function
  }
}
