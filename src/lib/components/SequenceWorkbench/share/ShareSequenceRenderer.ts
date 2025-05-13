/**
 * Utility for rendering a sequence to an image
 * This is used by the ShareButton component to generate images for sharing and downloading
 */
import { browser } from '$app/environment';
import { logger } from '$lib/core/logging';
import {
	renderSequenceToImage,
	type SequenceRenderResult
} from '$lib/components/SequenceWorkbench/share/utils/sequenceImageRenderer';
import { imageExportSettings, type ImageExportSettings } from '$lib/state/image-export-settings';
import { findBeatFrameElement, findRenderElement } from './utils/ShareElementFinder';

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
	console.log('ShareSequenceRenderer: renderSequence called with options:', options);

	if (!browser) {
		console.log('ShareSequenceRenderer: Not in browser environment, returning null');
		return null;
	}

	// Track if we created a fallback element that needs cleanup
	let createdFallbackElement = false;
	let renderElement: HTMLElement | null = null;

	try {
		// Find the BeatFrame element
		const beatFrameElement = await findBeatFrameElement(
			options.beatFrameElement || null,
			options.contextElement || null
		);

		if (!beatFrameElement) {
			console.error('ShareSequenceRenderer: BeatFrame element not found, cannot render sequence');
			return null;
		}

		// Find the actual element to render
		const renderElement = findRenderElement(beatFrameElement);
		console.log('ShareSequenceRenderer: Using render element:', renderElement);

		// Check if this is our fallback element
		if (renderElement && renderElement.classList.contains('export-fallback-element')) {
			createdFallbackElement = true;
		}

		// Validate the render element
		if (!renderElement) {
			console.error('ShareSequenceRenderer: No render element found');
			return null;
		}

		// Check if the element has valid dimensions
		const elementWidth = renderElement.offsetWidth;
		const elementHeight = renderElement.offsetHeight;

		console.log('ShareSequenceRenderer: Render element dimensions:', {
			width: elementWidth,
			height: elementHeight,
			clientWidth: renderElement.clientWidth,
			clientHeight: renderElement.clientHeight,
			scrollWidth: renderElement.scrollWidth,
			scrollHeight: renderElement.scrollHeight
		});

		// If the element has zero dimensions, try to fix it
		if (elementWidth <= 0 || elementHeight <= 0) {
			console.warn(
				'ShareSequenceRenderer: Render element has invalid dimensions, attempting to fix'
			);

			// Try to ensure the element is visible
			const originalDisplay = renderElement.style.display;
			const originalVisibility = renderElement.style.visibility;
			const originalPosition = renderElement.style.position;

			// Force the element to be visible with dimensions
			renderElement.style.display = 'block';
			renderElement.style.visibility = 'visible';
			renderElement.style.position = 'relative';
			renderElement.style.minWidth = '200px';
			renderElement.style.minHeight = '200px';

			// Log the updated dimensions
			console.log('ShareSequenceRenderer: Updated render element dimensions:', {
				width: renderElement.offsetWidth,
				height: renderElement.offsetHeight
			});

			// Clean up function to restore original styles
			setTimeout(() => {
				renderElement.style.display = originalDisplay;
				renderElement.style.visibility = originalVisibility;
				renderElement.style.position = originalPosition;
				renderElement.style.minWidth = '';
				renderElement.style.minHeight = '';
			}, 1000);
		}

		// Get the image export settings from the store
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

		// Additional settings not in the ImageExportSettings type
		const title = options.currentWord || options.sequenceName || 'Sequence';
		let userName = 'User';
		let notes = 'Created using The Kinetic Constructor';
		let cols = 4;
		let maxWidth: number | undefined = undefined;
		let maxHeight: number | undefined = undefined;

		// Get actual beat element size from DOM if available
		let scale = 1;
		try {
			if (renderElement) {
				// Try to find a beat element to measure
				const beatElement =
					renderElement.querySelector('.beat-frame') ||
					renderElement.querySelector('.pictograph-wrapper') ||
					renderElement.querySelector('.tka-glyph');

				if (beatElement) {
					const actualSize = Math.max(
						(beatElement as HTMLElement).clientWidth,
						(beatElement as HTMLElement).clientHeight
					);
					// Use a reasonable base size divisor (200 is a good starting point)
					scale = Math.max(0.5, Math.min(3, actualSize / 200));
					console.log(
						'ShareSequenceRenderer: Determined beat scale factor:',
						scale,
						'from element size:',
						actualSize
					);
				} else {
					// If we can't find a specific element, use the render element's size as a hint
					const containerSize = Math.max(renderElement.clientWidth, renderElement.clientHeight);
					scale = Math.max(0.5, Math.min(2, containerSize / 800));
					console.log(
						'ShareSequenceRenderer: Using container size for scale:',
						scale,
						'from size:',
						containerSize
					);
				}
			}
		} catch (err) {
			console.warn('ShareSequenceRenderer: Could not determine beat element size:', err);
		}

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

		console.log('ShareSequenceRenderer: Using export settings:', exportSettings);

		// Prepare render options
		const renderOptions: any = {
			// Get the sequence beats from the DOM
			beats: [], // This will be populated by the renderer based on the DOM

			// Layout options
			cols: cols,
			includeStartPosition: exportSettings.includeStartPosition !== false,

			// Content options
			addWord: exportSettings.addWord !== false,
			title: title,
			addBeatNumbers: exportSettings.addBeatNumbers !== false,
			addReversalSymbols: exportSettings.addReversalSymbols !== false,

			// User info options
			addUserInfo: exportSettings.addUserInfo !== false,
			userName: userName,
			notes: notes,
			exportDate: new Date().toLocaleDateString(),

			// Visual options
			backgroundColor: exportSettings.backgroundColor || '#ffffff',
			quality: exportSettings.quality || 0.9,

			// Advanced options
			maxWidth: maxWidth,
			maxHeight: maxHeight,
			scale: scale
		};

		console.log('ShareSequenceRenderer: Rendering sequence with options:', renderOptions);

		// Render the sequence
		const result = await renderSequenceToImage(renderElement, renderOptions);

		if (!result) {
			console.error('ShareSequenceRenderer: Failed to render sequence');
			return null;
		}

		console.log('ShareSequenceRenderer: Sequence rendered successfully:', {
			width: result.width,
			height: result.height,
			dataUrlLength: result.dataUrl.length
		});

		// Cache the result
		lastRenderResult = result;

		// Clean up fallback element if we created one
		if (createdFallbackElement && renderElement && document.body.contains(renderElement)) {
			console.log('ShareSequenceRenderer: Cleaning up fallback element');
			setTimeout(() => {
				try {
					document.body.removeChild(renderElement);
				} catch (cleanupError) {
					console.warn('ShareSequenceRenderer: Error cleaning up fallback element:', cleanupError);
				}
			}, 1000); // Delay cleanup to ensure rendering is complete
		}

		return result;
	} catch (error) {
		console.error('ShareSequenceRenderer: Error rendering sequence:', error);
		logger.error('Error rendering sequence', {
			error: error instanceof Error ? error : new Error(String(error))
		});
		return null;
	} finally {
		// Additional cleanup in case of errors
		if (createdFallbackElement && renderElement && document.body.contains(renderElement)) {
			console.log('ShareSequenceRenderer: Cleaning up fallback element in finally block');
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
