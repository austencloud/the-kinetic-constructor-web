/**
 * Svelte 5 Runes Integration
 *
 * This module provides utilities for integrating our store-based state management
 * with Svelte 5 runes. This file has a .svelte.ts extension to enable runes support.
 */

import type { Readable, Writable } from 'svelte/store';

/**
 * Creates a reactive state variable from a Svelte store
 * 
 * @param store A Svelte store
 * @returns A reactive state variable that updates when the store changes
 */
export function useStore<T>(store: Readable<T>): T {
  // Create a reactive state variable
  const state = $state(store.get ? store.get() : undefined);
  
  // Set up an effect to update the state when the store changes
  $effect(() => {
    const unsubscribe = store.subscribe(value => {
      state = value;
    });
    
    return unsubscribe;
  });
  
  return state;
}

/**
 * Creates a reactive state variable from a container
 * 
 * @param container A state container
 * @returns A reactive state variable that updates when the container changes
 */
export function useContainer<T extends object>(container: { state: T; subscribe: Readable<T>['subscribe'] }): T {
  // Create a reactive state variable
  const state = $state(container.state);
  
  // Set up an effect to update the state when the container changes
  $effect(() => {
    const unsubscribe = container.subscribe(value => {
      Object.assign(state, value);
    });
    
    return unsubscribe;
  });
  
  return state;
}

/**
 * Creates a derived value from a reactive state variable
 * 
 * @param fn A function that computes the derived value
 * @returns A derived value that updates when dependencies change
 */
export function useDerived<T>(fn: () => T): T {
  return $derived(fn());
}

/**
 * Creates an effect that runs when dependencies change
 * 
 * @param fn A function that performs side effects
 * @returns A cleanup function
 */
export function useEffect(fn: () => void | (() => void)): void {
  $effect(() => {
    return fn();
  });
}

/**
 * Creates a reactive state variable from an XState machine container
 * 
 * @param container A machine container
 * @returns A reactive state object with machine state and helper methods
 */
export function useMachine<T extends object, E extends { type: string }>(
  container: {
    state: T;
    subscribe: Readable<T>['subscribe'];
    send: (event: E) => void;
    can: (eventType: string) => boolean;
    matches: (stateValue: string) => boolean;
    hasTag: (tag: string) => boolean;
  }
) {
  // Create a reactive state variable
  const state = $state(container.state);
  
  // Set up an effect to update the state when the container changes
  $effect(() => {
    const unsubscribe = container.subscribe(value => {
      Object.assign(state, value);
    });
    
    return unsubscribe;
  });
  
  // Create helper methods that use the reactive state
  const can = (eventType: string) => container.can(eventType);
  const matches = (stateValue: string) => container.matches(stateValue);
  const hasTag = (tag: string) => container.hasTag(tag);
  const send = (event: E) => container.send(event);
  
  return {
    state,
    can,
    matches,
    hasTag,
    send
  };
}
