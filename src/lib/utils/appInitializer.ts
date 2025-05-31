// src/lib/utils/appInitializer.ts
import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
import { checkForSequenceInUrl } from '$lib/components/SequenceWorkbench/share/utils/ShareUtils';
import { logger } from '$lib/core/logging';
import { resourcePreloader } from '$lib/services/ResourcePreloader';
import { resourceCache } from '$lib/services/ResourceCache';
import { preloadCommonAssets } from '$lib/stores/glyphStore';
import { toAppError } from '$lib/types/ErrorTypes';

/**
 * Initialize the application, reporting progress via callback for XState
 * @param progressCallback Callback function provided by the XState actor for progress updates
 */
export async function initializeApplication(
	progressCallback?: (progress: number, message: string) => void
): Promise<boolean> {
	const reportProgress = (progress: number, message: string) => {
		progressCallback?.(progress, message);
	};

	reportProgress(0, 'Starting initialization...');

	try {
		const isBrowser = typeof window !== 'undefined';

		// Phase 1: Initialize Resource Cache (Browser only)
		if (isBrowser) {
			reportProgress(5, 'Initializing resource cache...');
			// Resource cache initializes automatically when imported
		}

		// Phase 2: Resource Preloading (Browser only)
		if (isBrowser) {
			reportProgress(10, 'Preloading application resources...');

			// Set the progress callback to update the UI
			resourcePreloader.setProgressCallback((progress, message) => {
				// Map the resource loading progress to 10-70% of the overall progress
				const mappedProgress = 10 + Math.floor(progress * 0.6);
				reportProgress(mappedProgress, message);
			});

			// Start preloading all resources
			const preloadingPromise = resourcePreloader.preloadAll();

			// Also preload glyph assets in parallel
			const glyphPreloadingPromise = preloadCommonAssets();

			// Wait for preloading to complete
			await Promise.all([preloadingPromise, glyphPreloadingPromise]);
		} else {
			reportProgress(10, 'Server-side rendering (skipping resource preload)...');
		}

		// Phase 3: Check for sequence in URL (Browser only)
		if (isBrowser) {
			reportProgress(75, 'Checking for shared sequence...');
			const foundSequenceInUrl = checkForSequenceInUrl(sequenceContainer);

			// If we didn't find a sequence in URL, load from localStorage
			if (!foundSequenceInUrl) {
				reportProgress(80, 'Loading saved sequence...');
				sequenceContainer.loadFromLocalStorage();
			}
		}

		// Phase 4: Final Preparations
		reportProgress(90, 'Preparing user interface...');
		if (isBrowser) {
			// Small delay to ensure UI is ready
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		// Phase 5: Complete
		reportProgress(100, 'Ready!');
		return true;
	} catch (error) {
		logger.error('Initialization failed:', { error: toAppError(error) });
		throw error;
	}
}
