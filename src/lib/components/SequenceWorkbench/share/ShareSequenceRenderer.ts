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

		return result;
	} catch (error) {
		console.error('ShareSequenceRenderer: Error rendering sequence:', error);
		logger.error('Error rendering sequence', {
			error: error instanceof Error ? error : new Error(String(error))
		});
		return null;
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
