/**
 * Utility for rendering a sequence to an image
 * This is used by the ShareButton component to generate images for sharing and downloading
 *
 * This implementation uses a two-pass approach for more reliable rendering:
 * 1. First pass: Measure the actual rendered elements
 * 2. Second pass: Create the canvas with appropriate dimensions
 */
import { browser } from '$app/environment';
import { logger } from '$lib/core/logging';
import { renderSequenceToImage } from '$lib/components/SequenceWorkbench/share/imageExport/sequenceImageRenderer';
import { imageExportSettings, type ImageExportSettings } from '$lib/state/image-export-settings';
import { findBeatFrameElement, findRenderElement } from './utils/ShareElementFinder';
import type { SequenceRenderResult } from './imageExport/types';

// Cache for the last render result
let lastRenderResult: SequenceRenderResult | null = null;

/**
 * Render the sequence to an image
 * @param options Additional options for rendering
 * @returns The render result, or null if rendering failed
 */
export async function renderSequence(
	options: {
		beatFrameElement?: HTMLElement | null;
		contextElement?: HTMLElement | null;
		sequenceName?: string;
		currentWord?: string;
	} = {}
): Promise<SequenceRenderResult | null> {
	// Start timing for performance analysis
	const startTime = performance.now();

	console.log('ShareSequenceRenderer: renderSequence called with options:', options);

	if (!browser) {
		console.log('ShareSequenceRenderer: Not in browser environment, returning null');
		return null;
	}

	// Track if we created a fallback element that needs cleanup
	let createdFallbackElement = false;
	let renderElement: HTMLElement | null = null;

	try {
		// Find the BeatFrame element with retry logic
		console.log('ShareSequenceRenderer: Finding BeatFrame element');
		const beatFrameElement = await findBeatFrameElement(
			options.beatFrameElement || null,
			options.contextElement || null
		);

		if (!beatFrameElement) {
			console.error('ShareSequenceRenderer: BeatFrame element not found, cannot render sequence');
			return null;
		}

		// Find the actual element to render
		console.log('ShareSequenceRenderer: Finding render element');
		renderElement = findRenderElement(beatFrameElement);

		if (!renderElement) {
			console.error('ShareSequenceRenderer: No render element found');
			return null;
		}

		console.log('ShareSequenceRenderer: Using render element:', renderElement);

		// Check if this is our fallback element
		if (renderElement.classList.contains('export-fallback-element')) {
			createdFallbackElement = true;
			console.log('ShareSequenceRenderer: Using fallback element');
		}

		// Get the image export settings from the store
		console.log('ShareSequenceRenderer: Getting export settings');
		let exportSettings: ImageExportSettings = {
			includeStartPosition: true,
			addUserInfo: true,
			addWord: true,
			addDifficultyLevel: false,
			addBeatNumbers: true,
			addReversalSymbols: true,
			combinedGrids: false,
			backgroundColor: '#2a2a2e',
			quality: 0.92
		};

		// Try to get current settings from the store
		try {
			const unsubscribe = imageExportSettings.subscribe((value) => {
				exportSettings = {
					...exportSettings,
					...value
				};
			});
			unsubscribe();
		} catch (err) {
			console.warn(
				'ShareSequenceRenderer: Error getting image export settings, using defaults:',
				err
			);
		}

		// Prepare render options
		console.log('ShareSequenceRenderer: Preparing render options');
		const renderOptions = {
			// Core data
			beats: [], // This will be populated by the renderer based on the DOM

			// Layout options
			cols: 4,
			includeStartPosition: exportSettings.includeStartPosition !== false,

			// Content options
			addWord: exportSettings.addWord !== false,
			title: options.currentWord || options.sequenceName || 'Sequence',
			addBeatNumbers: exportSettings.addBeatNumbers !== false,
			addReversalSymbols: exportSettings.addReversalSymbols !== false,

			// User info options
			addUserInfo: exportSettings.addUserInfo !== false,
			userName: 'User',
			notes: 'Created using The Kinetic Constructor',
			exportDate: new Date().toLocaleDateString(),

			// Visual options
			backgroundColor: exportSettings.backgroundColor || '#ffffff',
			quality: exportSettings.quality || 0.9,

			// Scale is determined automatically in the two-pass renderer
			// but we can provide a hint based on the UI
			scale: 1
		};

		console.log('ShareSequenceRenderer: Rendering sequence with options:', renderOptions);

		// Render the sequence using the two-pass renderer
		console.log('ShareSequenceRenderer: Starting rendering process');
		const result = await renderSequenceToImage(renderElement, renderOptions);

		if (!result) {
			console.error('ShareSequenceRenderer: Failed to render sequence');
			return null;
		}

		// Calculate and log performance metrics
		const endTime = performance.now();
		const renderTime = Math.round(endTime - startTime);

		console.log(`ShareSequenceRenderer: Sequence rendered successfully in ${renderTime}ms:`, {
			width: result.width,
			height: result.height,
			dataUrlLength: result.dataUrl.length
		});

		// Cache the result
		lastRenderResult = result;

		return result;
	} catch (error) {
		console.error('ShareSequenceRenderer: Error rendering sequence:', error);
		logger.error('Error rendering sequence', {
			error: error instanceof Error ? error : new Error(String(error))
		});
		return null;
	} finally {
		// Clean up fallback element if we created one
		if (createdFallbackElement && renderElement && document.body.contains(renderElement)) {
			console.log('ShareSequenceRenderer: Cleaning up fallback element');
			try {
				document.body.removeChild(renderElement);
			} catch (cleanupError) {
				console.warn('ShareSequenceRenderer: Error cleaning up fallback element:', cleanupError);
			}
		}
	}
}

/**
 * Get the last render result
 * @returns The last render result, or null if no render has been performed
 */
export function getLastRenderResult(): SequenceRenderResult | null {
	return lastRenderResult;
}

/**
 * Clear the last render result
 */
export function clearLastRenderResult(): void {
	lastRenderResult = null;
}

/**
 * Convert a data URL to a Blob
 * @param dataUrl The data URL to convert
 * @returns The converted Blob
 */
export function dataURLtoBlob(dataUrl: string): Blob {
	const arr = dataUrl.split(',');
	const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
	const bstr = atob(arr[1]);
	let n = bstr.length;
	const u8arr = new Uint8Array(n);

	while (n--) {
		u8arr[n] = bstr.charCodeAt(n);
	}

	return new Blob([u8arr], { type: mime });
}

/**
 * Generate a filename for the sequence image
 * @param sequenceName The name of the sequence
 * @returns A filename for the sequence image
 */
export function generateFilename(sequenceName?: string): string {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
	return `kinetic-sequence-${sequenceName ? sequenceName.replace(/[^a-z0-9]/gi, '-').toLowerCase() : timestamp}.png`;
}
