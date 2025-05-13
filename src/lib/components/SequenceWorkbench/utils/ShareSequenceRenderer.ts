/**
 * Utility for rendering a sequence to an image
 * This is used by the ShareButton component to generate images for sharing and downloading
 */
import { browser } from '$app/environment';
import { logger } from '$lib/core/logging';
import { renderSequenceToImage, type SequenceRenderResult } from '$lib/utils/sequenceImageRenderer';
import { findBeatFrameElement, findRenderElement } from './ShareElementFinder';
import { imageExportSettings, type ImageExportSettings } from '$lib/state/image-export-settings';

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
		let wordText = options.currentWord || options.sequenceName || 'Sequence';
		let userName = 'User';
		let notes = 'Created using The Kinetic Constructor';
		let cols = 4;
		let maxWidth: number | undefined = undefined;
		let maxHeight: number | undefined = undefined;
		let scale = 1;

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
			wordText: options.currentWord || options.sequenceName || 'Sequence',
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
