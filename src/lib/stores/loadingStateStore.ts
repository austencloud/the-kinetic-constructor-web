// src/lib/stores/loadingStateStore.ts
import { writable } from 'svelte/store';

export type LoadingState = {
  isLoading: boolean;
  progress: number; // 0-100
  message: string;
};

// Global loading state
export const loadingState = writable<LoadingState>({
  isLoading: true,
  progress: 0,
  message: 'Initializing...'
});

// Component-specific loading states
export const pictographLoadingState = writable<Record<string, boolean>>({});

/**
 * Update the loading progress and message
 */
export function updateLoadingProgress(progress: number, message: string) {
  loadingState.update(state => ({
    ...state,
    progress,
    message
  }));
}

/**
 * Set the loading state
 */
export function setLoading(isLoading: boolean) {
  loadingState.update(state => ({
    ...state,
    isLoading
  }));
}

/**
 * Track loading state of individual pictographs
 */
export function setPictographLoaded(id: string, isLoaded: boolean) {
  pictographLoadingState.update(states => ({
    ...states,
    [id]: isLoaded
  }));
}

/**
 * Check if all tracked pictographs are loaded
 */
export function allPictographsLoaded(): boolean {
  let allLoaded = true;
  pictographLoadingState.subscribe(states => {
    // Only return true if there are pictographs being tracked and all are loaded
    allLoaded = Object.keys(states).length > 0 && 
                Object.values(states).every(loaded => loaded);
  })();
  return allLoaded;
}