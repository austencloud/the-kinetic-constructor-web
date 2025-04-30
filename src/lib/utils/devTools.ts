/**
 * Development tools for debugging and inspecting application state
 */

import { browser } from '$app/environment';
import { sequenceStore } from '$lib/state/stores/sequenceStore';
import { get } from 'svelte/store';

// TypeScript declarations for window properties
declare global {
  interface Window {
    __kineticDevTools?: any;
    __sequenceState?: any;
  }
}

/**
 * Initialize the sequence dev tools
 */
export function initSequenceDevTools() {
  if (!browser || typeof window === 'undefined') return;

  // Create a global object for our app state
  window.__kineticDevTools = window.__kineticDevTools || {};

  // Add the sequence store to the window object
  window.__kineticDevTools.stores = window.__kineticDevTools.stores || {};
  window.__kineticDevTools.stores.sequence = sequenceStore;

  // Add a function to get the current sequence state
  window.__kineticDevTools.getSequence = () => {
    return get(sequenceStore);
  };

  // Add a function to get the current sequence beats
  window.__kineticDevTools.getBeats = () => {
    const state = get(sequenceStore);
    return state.beats;
  };

  // Add a function to get the selected beats
  window.__kineticDevTools.getSelectedBeats = () => {
    const state = get(sequenceStore);
    return state.beats.filter((beat) => state.selectedBeatIds.includes(beat.id));
  };

  // Add a function to manually update the sequence in the dev tools
  window.__kineticDevTools.updateSequence = () => {
    const state = get(sequenceStore);
    console.log('[Dev Tools] Current sequence state:', state);
    return state;
  };

  // Create a proxy to expose the sequence directly
  if (!window.hasOwnProperty('__sequenceState')) {
    Object.defineProperty(window, '__sequenceState', {
      get: () => {
        return get(sequenceStore);
      },
      configurable: true
    });
  }

  // Log instructions
  console.log(`
    [Dev Tools] Sequence development tools initialized
    
    Available global objects:
    - window.__sequenceState: Current sequence state (reactive getter)
    - window.__kineticDevTools.stores.sequence: Sequence store
    
    Available global functions:
    - window.__kineticDevTools.getSequence(): Get current sequence state
    - window.__kineticDevTools.getBeats(): Get current sequence beats
    - window.__kineticDevTools.getSelectedBeats(): Get selected beats
    - window.__kineticDevTools.updateSequence(): Manually update sequence in dev tools
  `);

  // Set up a subscription to the sequence store
  const unsubscribe = sequenceStore.subscribe((_state) => {
    // Update the window.__sequenceState property
    if (window.hasOwnProperty('__sequenceState')) {
      // This will trigger the getter, which is fine
      console.log('[Dev Tools] Sequence state updated');
    }
  });

  // Return a cleanup function
  return unsubscribe;
}

// Export a function that initializes all dev tools
export function initDevTools() {
  if (!browser || typeof window === 'undefined') return () => {};

  // Only initialize in development mode
  if (import.meta.env.DEV) {
    // Initialize sequence dev tools
    const unsubscribeSequence = initSequenceDevTools();

    // Return a cleanup function
    return () => {
      if (unsubscribeSequence) {
        unsubscribeSequence();
      }
    };
  }

  return () => {}; // Return a no-op function
}
