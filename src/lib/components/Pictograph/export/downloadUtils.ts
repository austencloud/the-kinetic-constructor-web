/**
 * Download Utilities
 *
 * This module provides utilities for downloading images.
 */

import { browser } from '$app/environment';
import { logger } from '$lib/core/logging';

/**
 * Options for downloading an image
 */
export interface DownloadOptions {
	dataUrl: string;
	filename: string;
	mimeType?: string;
}

/**
 * Downloads an image from a data URL
 *
 * @param options Download options
 * @returns Promise resolving to true if successful
 */
export async function downloadImage(options: DownloadOptions): Promise<boolean> {
	// Validate environment
	if (!browser) {
		return Promise.reject(new Error('Cannot download: not in browser environment'));
	}

	try {
		console.log(`DownloadUtils: Downloading image as "${options.filename}"`);
		console.log(`DownloadUtils: Data URL length: ${options.dataUrl.length}`);

		// Validate the data URL format
		if (!options.dataUrl || !options.dataUrl.startsWith('data:')) {
			throw new Error('Invalid data URL format');
		}

		// Extract MIME type from data URL if not provided
		const mimeType =
			options.mimeType || options.dataUrl.split(',')[0].match(/:(.*?);/)?.[1] || 'image/png';

		console.log(`DownloadUtils: Using MIME type: ${mimeType}`);

		// Create a new approach that works more reliably across browsers
		try {
			// Convert data URL to Blob using the dataURLtoBlob function
			const blob = dataURLtoBlob(options.dataUrl);
			console.log(`DownloadUtils: Created blob of size: ${blob.size} bytes`);

			// Create object URL from blob
			const url = URL.createObjectURL(blob);
			console.log(`DownloadUtils: Created object URL: ${url}`);

			// Create download link
			const link = document.createElement('a');
			link.href = url;
			link.download = options.filename;
			link.style.display = 'none';

			// Add to DOM
			document.body.appendChild(link);

			// Force a layout calculation to ensure the link is in the DOM
			link.getBoundingClientRect();

			// Longer delay to ensure the browser is ready
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Trigger click with a try/catch to handle any browser restrictions
			try {
				console.log(`DownloadUtils: Clicking download link`);
				link.click();
				console.log(`DownloadUtils: Download link clicked`);
			} catch (clickError) {
				console.error(`DownloadUtils: Error clicking link:`, clickError);
				throw clickError;
			}

			// Clean up with a longer timeout
			setTimeout(() => {
				if (document.body.contains(link)) {
					document.body.removeChild(link);
				}
				URL.revokeObjectURL(url);
				console.log(`DownloadUtils: Cleaned up resources`);
			}, 500);

			return true;
		} catch (blobError) {
			console.warn('DownloadUtils: Primary approach failed, trying alternative method', blobError);

			// Try an alternative approach using window.open
			try {
				// Create a new window/tab with the image
				const newWindow = window.open();
				if (!newWindow) {
					throw new Error('Failed to open new window. Popup might be blocked.');
				}

				// Write the image to the new window
				newWindow.document.write(`
					<html>
						<head>
							<title>${options.filename}</title>
							<style>
								body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f0f0; }
								img { max-width: 100%; max-height: 100%; }
								.download-instructions { position: fixed; top: 10px; left: 0; right: 0; text-align: center; background: rgba(0,0,0,0.7); color: white; padding: 10px; }
							</style>
						</head>
						<body>
							<div class="download-instructions">Right-click on the image and select "Save Image As..." to download</div>
							<img src="${options.dataUrl}" alt="${options.filename}">
						</body>
					</html>
				`);

				return true;
			} catch (windowError) {
				console.error('DownloadUtils: Alternative approach failed', windowError);

				// Last resort: direct data URL approach
				const link = document.createElement('a');
				link.href = options.dataUrl;
				link.download = options.filename;
				link.target = '_blank';
				link.style.display = 'none';

				document.body.appendChild(link);
				await new Promise((resolve) => setTimeout(resolve, 100));
				link.click();

				setTimeout(() => {
					if (document.body.contains(link)) {
						document.body.removeChild(link);
					}
				}, 500);

				return true;
			}
		}
	} catch (error) {
		// Log detailed error information
		logger.error('Error downloading image', {
			error: error instanceof Error ? error : new Error(String(error))
		});

		// Re-throw the error
		throw new Error(
			`Failed to download image: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * Converts a data URL to a Blob
 *
 * @param dataUrl The data URL to convert
 * @returns The resulting Blob
 */
export function dataURLtoBlob(dataUrl: string): Blob {
	// Split the data URL into the data and MIME type
	const arr = dataUrl.split(',');
	const mimeMatch = arr[0].match(/:(.*?);/);
	if (!mimeMatch || !mimeMatch[1]) {
		throw new Error('Invalid data URL format');
	}
	const mime = mimeMatch[1];
	const bstr = atob(arr[1]);
	let n = bstr.length;
	const u8arr = new Uint8Array(n);

	// Convert to Uint8Array
	while (n--) {
		u8arr[n] = bstr.charCodeAt(n);
	}

	// Create and return Blob
	return new Blob([u8arr], { type: mime });
}
