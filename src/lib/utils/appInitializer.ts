// src/lib/utils/appInitializer.ts
import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
import { checkForSequenceInUrl } from '$lib/components/SequenceWorkbench/share/utils/ShareUtils';
import { logger } from '$lib/core/logging';
import { resourcePreloader } from '$lib/services/ResourcePreloader';
import { resourceCache } from '$lib/services/ResourceCache';
import { glyphContainer } from '$lib/stores/glyphContainer.svelte';
import { toAppError } from '$lib/types/ErrorTypes';
import SvgManager from '$lib/components/SvgManager/SvgManager';
import { PropType } from '$lib/types/Types';
import { preloadCommonArrows } from '$lib/utils/embeddedArrowSvgs';

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

			// Set the progress callback to update the UI with detailed information
			resourcePreloader.setProgressCallback((progress, message) => {
				// Map the resource loading progress to 10-80% of the overall progress
				// This gives more weight to the resource loading phase
				const mappedProgress = 10 + Math.floor(progress * 0.7);
				reportProgress(mappedProgress, message);
			});

			// Preload critical SVGs first (highest priority)
			const svgManager = new SvgManager();

			// Preload embedded SVGs first (fastest, no network requests)
			reportProgress(12, 'Preloading embedded SVGs...');
			preloadCommonArrows();

			// Preload staff props
			const staffPreloadPromise = svgManager.preloadPropSvgs([
				{ propType: PropType.STAFF, color: 'red' },
				{ propType: PropType.STAFF, color: 'blue' }
			]);

			// Preload common arrows (especially the ones with turns)
			const arrowPreloadPromise = svgManager.preloadArrowSvgs([
				// Pro arrows with different turns - RADIAL (in)
				{ motionType: 'pro', startOri: 'in', turns: 0, color: 'red' },
				{ motionType: 'pro', startOri: 'in', turns: 0, color: 'blue' },
				{ motionType: 'pro', startOri: 'in', turns: 0.5, color: 'red' },
				{ motionType: 'pro', startOri: 'in', turns: 0.5, color: 'blue' },
				{ motionType: 'pro', startOri: 'in', turns: 1, color: 'red' },
				{ motionType: 'pro', startOri: 'in', turns: 1, color: 'blue' },
				{ motionType: 'pro', startOri: 'in', turns: 1.5, color: 'red' },
				{ motionType: 'pro', startOri: 'in', turns: 1.5, color: 'blue' },
				{ motionType: 'pro', startOri: 'in', turns: 2, color: 'red' },
				{ motionType: 'pro', startOri: 'in', turns: 2, color: 'blue' },
				{ motionType: 'pro', startOri: 'in', turns: 2.5, color: 'red' },
				{ motionType: 'pro', startOri: 'in', turns: 2.5, color: 'blue' },
				{ motionType: 'pro', startOri: 'in', turns: 3, color: 'red' },
				{ motionType: 'pro', startOri: 'in', turns: 3, color: 'blue' },

				// Pro arrows with different turns - RADIAL (out)
				{ motionType: 'pro', startOri: 'out', turns: 0, color: 'red' },
				{ motionType: 'pro', startOri: 'out', turns: 0, color: 'blue' },
				{ motionType: 'pro', startOri: 'out', turns: 0.5, color: 'red' },
				{ motionType: 'pro', startOri: 'out', turns: 0.5, color: 'blue' },
				{ motionType: 'pro', startOri: 'out', turns: 1, color: 'red' },
				{ motionType: 'pro', startOri: 'out', turns: 1, color: 'blue' },

				// Pro arrows with different turns - NON-RADIAL (clock)
				{ motionType: 'pro', startOri: 'clock', turns: 0, color: 'red' },
				{ motionType: 'pro', startOri: 'clock', turns: 0, color: 'blue' },
				{ motionType: 'pro', startOri: 'clock', turns: 0.5, color: 'red' },
				{ motionType: 'pro', startOri: 'clock', turns: 0.5, color: 'blue' },
				{ motionType: 'pro', startOri: 'clock', turns: 1, color: 'red' },
				{ motionType: 'pro', startOri: 'clock', turns: 1, color: 'blue' },
				{ motionType: 'pro', startOri: 'clock', turns: 1.5, color: 'red' },
				{ motionType: 'pro', startOri: 'clock', turns: 1.5, color: 'blue' },

				// Pro arrows with different turns - NON-RADIAL (counter)
				{ motionType: 'pro', startOri: 'counter', turns: 0, color: 'red' },
				{ motionType: 'pro', startOri: 'counter', turns: 0, color: 'blue' },
				{ motionType: 'pro', startOri: 'counter', turns: 0.5, color: 'red' },
				{ motionType: 'pro', startOri: 'counter', turns: 0.5, color: 'blue' },
				{ motionType: 'pro', startOri: 'counter', turns: 1, color: 'red' },
				{ motionType: 'pro', startOri: 'counter', turns: 1, color: 'blue' },

				// Anti arrows with different turns - RADIAL (in)
				{ motionType: 'anti', startOri: 'in', turns: 0, color: 'red' },
				{ motionType: 'anti', startOri: 'in', turns: 0, color: 'blue' },
				{ motionType: 'anti', startOri: 'in', turns: 0.5, color: 'red' },
				{ motionType: 'anti', startOri: 'in', turns: 0.5, color: 'blue' },
				{ motionType: 'anti', startOri: 'in', turns: 1, color: 'red' },
				{ motionType: 'anti', startOri: 'in', turns: 1, color: 'blue' },
				{ motionType: 'anti', startOri: 'in', turns: 1.5, color: 'red' },
				{ motionType: 'anti', startOri: 'in', turns: 1.5, color: 'blue' },

				// Anti arrows with different turns - NON-RADIAL (clock/counter)
				{ motionType: 'anti', startOri: 'clock', turns: 0, color: 'red' },
				{ motionType: 'anti', startOri: 'clock', turns: 0, color: 'blue' },
				{ motionType: 'anti', startOri: 'clock', turns: 0.5, color: 'red' },
				{ motionType: 'anti', startOri: 'clock', turns: 0.5, color: 'blue' },
				{ motionType: 'anti', startOri: 'clock', turns: 1, color: 'red' },
				{ motionType: 'anti', startOri: 'clock', turns: 1, color: 'blue' },

				// Static arrows
				{ motionType: 'static', startOri: 'in', turns: 0, color: 'red' },
				{ motionType: 'static', startOri: 'in', turns: 0, color: 'blue' },

				// Dash arrows
				{ motionType: 'dash', startOri: 'clock', turns: 0, color: 'red' },
				{ motionType: 'dash', startOri: 'clock', turns: 0, color: 'blue' },

				// Float arrows
				{ motionType: 'float', startOri: 'in', turns: 'fl', color: 'red' },
				{ motionType: 'float', startOri: 'in', turns: 'fl', color: 'blue' }
			]);

			// Wait for critical SVGs to load first
			await Promise.all([staffPreloadPromise, arrowPreloadPromise]);

			// Start preloading all resources - this now includes all pictograph components
			// including arrows, props, grids, and glyphs
			const preloadingPromise = resourcePreloader.preloadAll();

			// Also preload glyph assets in parallel
			const glyphPreloadingPromise = glyphContainer.preloadCommonAssets();

			// Wait for preloading to complete
			await Promise.all([preloadingPromise, glyphPreloadingPromise]);

			// Log completion of preloading phase
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
