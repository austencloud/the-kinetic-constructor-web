/**
 * Svelte 5 Runes Utilities
 * 
 * This module provides utilities for working with Svelte 5 runes,
 * particularly for state management and persistence.
 */

import { browser } from '$app/environment';

/**
 * Creates a persistent state variable that syncs with localStorage
 * 
 * @param key The localStorage key to use
 * @param initialValue The initial value if nothing is in localStorage
 * @param options Additional options
 * @returns A state variable that persists to localStorage
 */
export function createPersistentState<T>(
  key: string,
  initialValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    debounceMs?: number;
    validateData?: (data: any) => boolean;
  } = {}
): T {
  // Default options
  const serialize = options.serialize || JSON.stringify;
  const deserialize = options.deserialize || JSON.parse;
  const debounceMs = options.debounceMs || 100;
  const validateData = options.validateData || (() => true);

  // Load initial value from localStorage if available
  let loadedValue = initialValue;
  if (browser) {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        const parsedValue = deserialize(storedValue);
        if (validateData(parsedValue)) {
          loadedValue = parsedValue;
        }
      }
    } catch (error) {
      console.error(`Error loading state from localStorage (${key}):`, error);
    }
  }

  // Create the state variable with the loaded or initial value
  const state = $state<T>(loadedValue);

  // Set up debounced persistence
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  
  // Set up effect to save to localStorage when state changes
  $effect(() => {
    if (!browser) return;
    
    // Get the current state value
    const currentValue = state;
    
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set new timer
    debounceTimer = setTimeout(() => {
      try {
        const serialized = serialize(currentValue);
        localStorage.setItem(key, serialized);
      } catch (error) {
        console.error(`Error saving state to localStorage (${key}):`, error);
      }
    }, debounceMs);
  });

  return state;
}

/**
 * Creates a persistent object state that syncs with localStorage
 * and allows selective persistence of fields
 * 
 * @param key The localStorage key to use
 * @param initialValue The initial value if nothing is in localStorage
 * @param options Additional options
 * @returns An object state that persists to localStorage
 */
export function createPersistentObjectState<T extends object>(
  key: string,
  initialValue: T,
  options: {
    persistFields?: (keyof T)[];
    debounceMs?: number;
    validateData?: (data: any) => boolean;
  } = {}
): T {
  // Default options
  const debounceMs = options.debounceMs || 100;
  const persistFields = options.persistFields;
  const validateData = options.validateData || (() => true);

  // Load initial value from localStorage if available
  let loadedValue = { ...initialValue };
  if (browser) {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        const parsedValue = JSON.parse(storedValue);
        if (validateData(parsedValue)) {
          // If we have specific fields to persist, only update those
          if (persistFields && persistFields.length > 0) {
            persistFields.forEach(field => {
              if (field in parsedValue) {
                (loadedValue as any)[field] = parsedValue[field];
              }
            });
          } else {
            // Otherwise merge the entire object
            loadedValue = { ...initialValue, ...parsedValue };
          }
        }
      }
    } catch (error) {
      console.error(`Error loading state from localStorage (${key}):`, error);
    }
  }

  // Create the state variable with the loaded or initial value
  const state = $state<T>({ ...loadedValue });

  // Set up debounced persistence
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastPersistedJson: string | null = null;
  
  // Set up effect to save to localStorage when state changes
  $effect(() => {
    if (!browser) return;
    
    // Get the current state value
    const currentValue = state;
    
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set new timer
    debounceTimer = setTimeout(() => {
      try {
        let dataToStore: any;

        // If selective persistence is enabled
        if (persistFields && persistFields.length > 0) {
          // Only persist specified fields
          dataToStore = {};
          persistFields.forEach((field) => {
            if (field in currentValue) {
              dataToStore[field] = currentValue[field];
            }
          });
        } else {
          // Persist the entire state
          dataToStore = currentValue;
        }

        // Only persist if data has changed
        const currentJson = JSON.stringify(dataToStore);
        if (currentJson !== lastPersistedJson) {
          localStorage.setItem(key, currentJson);
          lastPersistedJson = currentJson;
        }
      } catch (error) {
        console.error(`Error saving state to localStorage (${key}):`, error);
      }
    }, debounceMs);
  });

  return state;
}

/**
 * Creates a shared context value that can be accessed across components
 * 
 * @param key The context key
 * @param initialValue The initial value
 * @returns The context value
 */
export function createSharedContext<T>(key: symbol | string, initialValue: T): T {
  // Create a state variable to hold the context value
  const contextValue = $state<T>(initialValue);
  
  // Return the context value
  return contextValue;
}
