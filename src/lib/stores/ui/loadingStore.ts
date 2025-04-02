// src/lib/stores/loadingStateStore.ts
import { writable, get } from 'svelte/store';

export type LoadingState = {
  isLoading: boolean;
  progress: number; // 0-100
  message: string;
  error: string | null;
};

// Global loading state
export const loadingState = writable<LoadingState>({
  isLoading: true,
  progress: 0,
  message: 'Initializing...',
  error: null
});

// Component-specific loading states
export const pictographLoadingState = writable<Record<string, boolean>>({});

// Track loading timeouts
let safetyTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Update the loading progress and message
 */
export function updateLoadingProgress(progress: number, message: string) {
  loadingState.update(state => ({
    ...state,
    progress,
    message
  }));
  
  // Reset safety timer whenever progress updates
  if (safetyTimer) {
    clearTimeout(safetyTimer);
  }
  
  // Set a new safety timer that will force loading to complete after 30 seconds total
  safetyTimer = setTimeout(() => {
    const currentState = get(loadingState);
    if (currentState.isLoading) {
      console.warn("⚠️ Global loading safety timeout triggered");
      
      // Force stop loading with error message
      loadingState.set({
        isLoading: false,
        progress: 100,
        message: "Loading complete (timeout)",
        error: "Loading took too long. Some features may not work correctly."
      });
    }
  }, 30000); // 30 second timeout
}

/**
 * Set the loading state
 */
export function setLoading(isLoading: boolean, errorMessage?: string) {
  loadingState.update(state => ({
    ...state,
    isLoading,
    error: errorMessage || null
  }));
  
  // Clear safety timer if loading completes
  if (!isLoading && safetyTimer) {
    clearTimeout(safetyTimer);
    safetyTimer = null;
  }
}

/**
 * Track loading state of individual pictographs
 */
export function setPictographLoaded(id: string, isLoaded: boolean) {
  pictographLoadingState.update(states => ({
    ...states,
    [id]: isLoaded
  }));
  
  // Check if all pictographs are loaded
  if (isLoaded && allPictographsLoaded()) {
    // Advance loading progress when all pictographs have loaded
    const currentState = get(loadingState);
    if (currentState.isLoading && currentState.progress < 95) {
      updateLoadingProgress(95, "Finalizing...");
    }
  }
}

/**
 * Check if all tracked pictographs are loaded
 */
export function allPictographsLoaded(): boolean {
  let allLoaded = true;
  pictographLoadingState.subscribe(states => {
    // Only return true if there are pictographs being tracked and all are loaded
    const entries = Object.entries(states);
    allLoaded = entries.length > 0 && entries.every(([_, loaded]) => loaded);
  })();
  return allLoaded;
}

/**
 * Handle errors during loading
 */
export function setLoadingError(error: string) {
  loadingState.update(state => ({
    ...state,
    error,
    // Don't automatically stop loading, let the application decide
  }));
  
  console.error("[Loading Error]", error);
}

// Clean up on module unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (safetyTimer) {
      clearTimeout(safetyTimer);
    }
  });
}