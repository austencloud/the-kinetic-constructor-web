/**
 * Modern state container utility
 * 
 * This module provides a simplified approach to state management using Svelte's runes.
 * It's designed to replace the more complex store/registry pattern with a more direct
 * and ergonomic API.
 * 
 * Note: This is a transitional utility that will work with both Svelte 4 and Svelte 5.
 * For Svelte 4, it falls back to using writable stores under the hood.
 */

import { writable, get, type Writable } from 'svelte/store';

// Check if we're running in a Svelte 5 environment with runes support
const hasRunes = typeof globalThis.$state !== 'undefined';

/**
 * Creates a state container with the given initial state and actions
 * 
 * @param initialState The initial state object
 * @param actions A function that receives the state and returns action functions
 * @returns A state container with getters and actions
 */
export function createContainer<T extends object, A extends Record<string, Function>>(
  initialState: T,
  actions: (state: T, update: (fn: (state: T) => void) => void) => A
): { state: T } & A & { reset: () => void } {
  // For Svelte 5 with runes
  if (hasRunes) {
    // @ts-ignore - $state is not recognized by TypeScript yet
    const state = $state(structuredClone(initialState));
    
    // Function to update state immutably
    const update = (fn: (state: T) => void) => {
      // Create a copy of the state
      const copy = structuredClone(state);
      // Apply the update function
      fn(copy);
      // Assign the updated copy back to state
      Object.assign(state, copy);
    };
    
    // Create actions with access to state
    const boundActions = actions(state, update);
    
    // Create a reset function
    const reset = () => {
      Object.assign(state, structuredClone(initialState));
    };
    
    return {
      // Getter for current state
      get state() { return state },
      
      // Actions
      ...boundActions,
      
      // Reset function
      reset
    };
  }
  
  // Fallback for Svelte 4 (no runes)
  else {
    // Create a writable store
    const store = writable<T>(structuredClone(initialState));
    
    // Function to update state immutably
    const update = (fn: (state: T) => void) => {
      store.update(currentState => {
        const copy = structuredClone(currentState);
        fn(copy);
        return copy;
      });
    };
    
    // Create actions with access to state via store.update
    const boundActions = actions(
      // Proxy that forwards property access to the store value
      new Proxy({} as T, {
        get: (_, prop: string) => {
          const value = get(store);
          return value[prop as keyof T];
        },
        set: (_, prop: string, value) => {
          store.update(state => {
            const newState = { ...state };
            (newState as any)[prop] = value;
            return newState;
          });
          return true;
        }
      }),
      update
    );
    
    // Create a reset function
    const reset = () => {
      store.set(structuredClone(initialState));
    };
    
    // Create a getter for the current state
    const stateGetter = {
      get state() { 
        return get(store);
      }
    };
    
    return {
      ...stateGetter,
      ...boundActions,
      reset,
      // Add subscribe method for compatibility with Svelte stores
      subscribe: store.subscribe
    } as any;
  }
}

/**
 * Creates a derived value from a state container
 * 
 * @param fn A function that computes the derived value
 * @returns The derived value
 */
export function createDerived<T>(fn: () => T): { value: T } | { value: T; _update: () => void } {
  if (hasRunes) {
    // @ts-ignore - $derived is not recognized by TypeScript yet
    const value = $derived(fn());
    
    return {
      get value() { return value; }
    };
  } else {
    // For Svelte 4, we need to manually track dependencies
    // This is a simplified implementation that won't track all dependencies correctly
    const store = writable<T>(fn());
    
    return {
      get value() { return get(store); },
      _update: () => { store.set(fn()); }
    };
  }
}

/**
 * Creates an effect that runs when dependencies change
 * 
 * @param fn A function that performs side effects
 */
export function createEffect(fn: () => void): void {
  if (hasRunes) {
    // @ts-ignore - $effect is not recognized by TypeScript yet
    $effect(fn);
  } else {
    // For Svelte 4, we need to manually set up the effect
    // This is a simplified implementation that won't track all dependencies correctly
    fn();
  }
}
