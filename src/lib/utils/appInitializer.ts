// src/lib/utils/appInitializer.ts
import { loadPictographData } from '$lib/stores/pictographDataStore';
import { updateLoadingProgress, setLoading } from '$lib/stores/loadingStateStore';

/**
 * Initialize the application with loading indicators
 */
export async function initializeApplication(): Promise<boolean> {
	// Start with loading at 0%
	updateLoadingProgress(0, 'Starting initialization...');
	setLoading(true);

	try {
		// Check if we're in the browser
		const isBrowser = typeof window !== 'undefined';

		// Phase 1: Begin SVG preloading only in browser context
		let preloadingPromise = Promise.resolve();

		if (isBrowser) {
			updateLoadingProgress(10, 'Preloading SVG resources...');
			// Dynamically import to avoid SSR issues
			const { initSvgPreloading } = await import('./SvgPreloader');
			preloadingPromise = initSvgPreloading();
		} else {
			updateLoadingProgress(10, 'Server-side rendering...');
		}

		// Phase 2: Load pictograph data
		updateLoadingProgress(20, 'Loading pictograph data...');
		const pictographData = await loadPictographData();
		updateLoadingProgress(60, 'Processing pictograph data...');

		// Phase 3: Wait for SVG preloading to complete (only in browser)
		if (isBrowser) {
			updateLoadingProgress(70, 'Finalizing resource loading...');
			await preloadingPromise;
		}

		// Phase 4: Final preparations
		updateLoadingProgress(90, 'Preparing user interface...');

		// Small delay for UI to catch up (only in browser)
		if (isBrowser) {
			await new Promise((resolve) => setTimeout(resolve, 500));
		}

		// Complete loading
		updateLoadingProgress(100, 'Ready!');

		// Small delay before hiding loading screen for smoother transition (only in browser)
		if (isBrowser) {
			await new Promise((resolve) => setTimeout(resolve, 300));
		}

		setLoading(false);
		return true;
	} catch (error) {
		console.error('Initialization failed:', error);

		// Update loading state to show error
		updateLoadingProgress(100, 'Error loading application. Please try refreshing.');

		// Keep showing the loading screen with the error for a moment
		if (typeof window !== 'undefined') {
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}

		setLoading(false);
		return false;
	}
}
