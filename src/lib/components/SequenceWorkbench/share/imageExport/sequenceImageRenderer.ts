// src/lib/components/SequenceWorkbench/share/imageExport/sequenceImageRenderer.ts

import { browser } from '$app/environment';
import { logger } from '$lib/core/logging';
import type { SequenceRenderOptions, SequenceRenderResult } from './types';
import { renderWithTwoPasses } from './twoPassRenderer';

/**
 * Renders a sequence to an image
 * This is the main entry point for the image export functionality
 *
 * This implementation uses a two-pass approach:
 * 1. First pass: Measure the actual rendered elements
 * 2. Second pass: Create the canvas with appropriate dimensions
 */
export async function renderSequenceToImage(
	element: HTMLElement,
	options: SequenceRenderOptions
): Promise<SequenceRenderResult> {
	// Validate environment and inputs
	if (!browser) {
		return Promise.reject(new Error('Cannot render: not in browser environment'));
	}

	if (!element) {
		return Promise.reject(new Error('Cannot render: no element provided'));
	}

	try {
		console.log('SequenceImageRenderer: Starting rendering process');
		console.log('SequenceImageRenderer: Element dimensions:', {
			offsetWidth: element.offsetWidth,
			offsetHeight: element.offsetHeight,
			clientWidth: element.clientWidth,
			clientHeight: element.clientHeight,
			scrollWidth: element.scrollWidth,
			scrollHeight: element.scrollHeight
		});

		// Validate element dimensions
		if (element.offsetWidth <= 0 || element.offsetHeight <= 0) {
			console.warn(
				'SequenceImageRenderer: Element has invalid dimensions, will attempt to fix during rendering'
			);
		}

		// Use the two-pass renderer for better reliability
		const result = await renderWithTwoPasses(element, options);

		console.log('SequenceImageRenderer: Rendering completed successfully', {
			width: result.width,
			height: result.height,
			aspectRatio: result.aspectRatio,
			dataUrlLength: result.dataUrl.length
		});

		return result;
	} catch (error) {
		// Log detailed error information
		logger.error('Error rendering sequence image', {
			error: error instanceof Error ? error : new Error(String(error))
		});

		// Log additional details to console for debugging
		console.error('SequenceImageRenderer: Detailed error information:', {
			error: error instanceof Error ? error.message : String(error),
			elementInfo: {
				tagName: element.tagName,
				className: element.className,
				id: element.id,
				dimensions: {
					offsetWidth: element.offsetWidth,
					offsetHeight: element.offsetHeight,
					clientWidth: element.clientWidth,
					clientHeight: element.clientHeight
				}
			},
			options: {
				...options,
				// Don't log the full beats array
				beats: options.beats ? `[${options.beats.length} beats]` : 'none'
			}
		});

		// Re-throw the error
		throw new Error(
			`Failed to render sequence image: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * Helper to download a data URL as a file with improved error handling
 */
export function downloadDataUrl(dataUrl: string, filename: string): Promise<boolean> {
	return new Promise((resolve, reject) => {
		try {
			// Validate inputs
			if (!dataUrl) {
				reject(new Error('No data URL provided'));
				return;
			}

			if (!dataUrl.startsWith('data:image/')) {
				reject(new Error('Invalid data URL format'));
				return;
			}

			if (!filename) {
				filename = `sequence-${Date.now()}.png`;
			}

			console.log(`SequenceImageRenderer: Downloading image as "${filename}"`);

			// Try using Blob approach first (more reliable)
			try {
				// Convert data URL to Blob
				const parts = dataUrl.split(',');
				const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
				const binary = atob(parts[1]);
				const array = new Uint8Array(binary.length);

				for (let i = 0; i < binary.length; i++) {
					array[i] = binary.charCodeAt(i);
				}

				// Create Blob and Object URL
				const blob = new Blob([array], { type: mime });
				const objectUrl = URL.createObjectURL(blob);

				// Create download link
				const link = document.createElement('a');
				link.href = objectUrl;
				link.download = filename;
				link.style.display = 'none';

				// Add to DOM
				document.body.appendChild(link);

				// Small delay to ensure the browser is ready
				setTimeout(() => {
					link.click();

					// Clean up
					setTimeout(() => {
						if (document.body.contains(link)) {
							document.body.removeChild(link);
						}
						URL.revokeObjectURL(objectUrl);
						resolve(true);
					}, 100);
				}, 50);
			} catch (blobError) {
				console.warn(
					'SequenceImageRenderer: Blob approach failed, falling back to direct data URL',
					blobError
				);

				// Fallback to direct data URL approach
				const link = document.createElement('a');
				link.href = dataUrl;
				link.download = filename;
				link.style.display = 'none';

				// Add to DOM
				document.body.appendChild(link);

				// Small delay to ensure the browser is ready
				setTimeout(() => {
					link.click();

					// Clean up
					setTimeout(() => {
						if (document.body.contains(link)) {
							document.body.removeChild(link);
						}
						resolve(true);
					}, 100);
				}, 50);
			}
		} catch (error) {
			logger.error('Error downloading data URL', {
				error: error instanceof Error ? error : new Error(String(error))
			});
			reject(error);
		}
	});
}
