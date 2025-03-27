// src/lib/utils/appInitializer.ts
import { loadPictographData } from '$lib/stores/pictographDataStore';
import { updateLoadingProgress, setLoading } from '$lib/stores/loadingStateStore';
import { initSvgPreloading } from './SvgPreloader';

/**
 * Initialize the application with loading indicators
 */
export async function initializeApplication(): Promise<boolean> {
  // Start with loading at 0%
  updateLoadingProgress(0, "Starting initialization...");
  setLoading(true);
  
  try {
    // Phase 1: Begin SVG preloading (don't await completion)
    const preloadingPromise = initSvgPreloading();
    updateLoadingProgress(10, "Preloading SVG resources...");
    
    // Phase 2: Load pictograph data
    updateLoadingProgress(20, "Loading pictograph data...");
    const pictographData = await loadPictographData();
    updateLoadingProgress(60, "Processing pictograph data...");
    
    // Phase 3: Wait for SVG preloading to complete
    updateLoadingProgress(70, "Finalizing resource loading...");
    await preloadingPromise;
    
    // Phase 4: Final preparations
    updateLoadingProgress(90, "Preparing user interface...");
    
    // Small delay for UI to catch up
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Complete loading
    updateLoadingProgress(100, "Ready!");
    
    // Small delay before hiding loading screen for smoother transition
    await new Promise(resolve => setTimeout(resolve, 300));
    setLoading(false);
    
    return true;
  } catch (error) {
    console.error("Initialization failed:", error);
    
    // Update loading state to show error
    updateLoadingProgress(100, "Error loading application. Please try refreshing.");
    
    // Keep showing the loading screen with the error for a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    
    return false;
  }
}