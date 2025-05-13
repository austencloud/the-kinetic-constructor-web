/**
 * Utility for testing image export functionality
 * This helps diagnose issues with image generation and download
 */
import { browser } from '$app/environment';
import { logger } from '$lib/core/logging';
import {
	renderSequenceToImage,
} from '../imageExport/sequenceImageRenderer';

/**
 * Test result interface
 */
export interface ImageExportTestResult {
	success: boolean;
	stage: string;
	dataUrl?: string;
	dataUrlLength?: number;
	mimeType?: string;
	error?: string;
	blob?: Blob;
	blobSize?: number;
	blobType?: string;
	imageWidth?: number;
	imageHeight?: number;
}

/**
 * Test the image export functionality with a simple canvas
 * This creates a minimal test image to verify the export pipeline
 */
export async function testImageExport(): Promise<ImageExportTestResult> {
	if (!browser) {
		return {
			success: false,
			stage: 'browser-check',
			error: 'Not in browser environment'
		};
	}

	try {
		// Create a simple test element
		const testElement = document.createElement('div');
		testElement.style.width = '200px';
		testElement.style.height = '200px';
		testElement.style.backgroundColor = '#ff0000';
		testElement.style.position = 'absolute';
		testElement.style.left = '-9999px';
		testElement.style.top = '-9999px';
		testElement.innerHTML =
			'<p style="color: white; text-align: center; padding: 20px;">Test Image</p>';

		// Add to DOM temporarily
		document.body.appendChild(testElement);

		try {
			// Step 1: Render to canvas
			const result = await renderSequenceToImage(testElement, {
				beats: [],
				startPosition: null,
				rows: 1,
				cols: 1,
				title: 'Test Image',
				addWord: true,
				addUserInfo: true,
				format: 'png',
				quality: 0.92
			});

			// Step 2: Validate data URL
			if (!result || !result.dataUrl) {
				return {
					success: false,
					stage: 'data-url-generation',
					error: 'Failed to generate data URL'
				};
			}

			// Check data URL format
			if (!result.dataUrl.startsWith('data:image/')) {
				return {
					success: false,
					stage: 'data-url-format',
					error: `Invalid data URL format: ${result.dataUrl.substring(0, 30)}...`,
					dataUrlLength: result.dataUrl.length
				};
			}

			// Extract MIME type
			const mimeType = result.dataUrl.split(',')[0].match(/:(.*?);/)?.[1] || '';

			// Step 3: Convert to Blob
			try {
				const blob = dataURLtoBlob(result.dataUrl);

				// Step 4: Validate Blob
				if (!blob) {
					return {
						success: false,
						stage: 'blob-conversion',
						error: 'Failed to convert data URL to Blob',
						dataUrlLength: result.dataUrl.length,
						mimeType
					};
				}

				// Return success with diagnostic info
				return {
					success: true,
					stage: 'complete',
					dataUrlLength: result.dataUrl.length,
					mimeType,
					blob,
					blobSize: blob.size,
					blobType: blob.type,
					imageWidth: result.width,
					imageHeight: result.height,
					// Include a small sample of the data URL for debugging
					dataUrl: result.dataUrl.substring(0, 100) + '...'
				};
			} catch (blobError) {
				return {
					success: false,
					stage: 'blob-conversion',
					error: `Error converting to Blob: ${blobError instanceof Error ? blobError.message : String(blobError)}`,
					dataUrlLength: result.dataUrl.length,
					mimeType
				};
			}
		} catch (renderError) {
			return {
				success: false,
				stage: 'rendering',
				error: `Error rendering image: ${renderError instanceof Error ? renderError.message : String(renderError)}`
			};
		} finally {
			// Clean up
			if (document.body.contains(testElement)) {
				document.body.removeChild(testElement);
			}
		}
	} catch (error) {
		return {
			success: false,
			stage: 'setup',
			error: `Setup error: ${error instanceof Error ? error.message : String(error)}`
		};
	}
}

/**
 * Improved version of dataURLtoBlob with better error handling
 */
export function dataURLtoBlob(dataUrl: string): Blob {
	try {
		// Validate data URL format
		if (!dataUrl.startsWith('data:')) {
			throw new Error('Invalid data URL format: does not start with "data:"');
		}

		const parts = dataUrl.split(',');
		if (parts.length !== 2) {
			throw new Error(`Invalid data URL format: expected 2 parts, got ${parts.length}`);
		}

		// Extract MIME type with better error handling
		const mimeMatch = parts[0].match(/:(.*?);/);
		if (!mimeMatch) {
			throw new Error('Could not extract MIME type from data URL');
		}

		const mime = mimeMatch[1] || 'image/png';

		// Validate base64 encoding
		if (!parts[0].endsWith(';base64')) {
			throw new Error('Data URL is not base64 encoded');
		}

		// Decode base64 data
		try {
			const bstr = atob(parts[1]);
			const n = bstr.length;
			const u8arr = new Uint8Array(n);

			for (let i = 0; i < n; i++) {
				u8arr[i] = bstr.charCodeAt(i);
			}

			return new Blob([u8arr], { type: mime });
		} catch (decodeError) {
			throw new Error(
				`Failed to decode base64 data: ${decodeError instanceof Error ? decodeError.message : String(decodeError)}`
			);
		}
	} catch (error) {
		logger.error('Error in dataURLtoBlob', {
			error: error instanceof Error ? error : new Error(String(error))
		});
		throw error;
	}
}

/**
 * Test downloading a simple image
 * This creates a minimal test image and attempts to download it
 */
export async function testImageDownload(): Promise<ImageExportTestResult> {
	const testResult = await testImageExport();

	if (!testResult.success) {
		return testResult;
	}

	try {
		// Create a download link
		const downloadLink = document.createElement('a');
		const blob = testResult.blob as Blob;

		// Create object URL from blob
		const objectUrl = URL.createObjectURL(blob);
		downloadLink.href = objectUrl;
		downloadLink.download = 'test-image.png';
		downloadLink.style.display = 'none';

		// Add to DOM, click, and remove
		document.body.appendChild(downloadLink);

		// Use a small timeout to ensure the browser has time to process
		await new Promise((resolve) => setTimeout(resolve, 100));

		try {
			downloadLink.click();

			// Clean up
			setTimeout(() => {
				if (document.body.contains(downloadLink)) {
					document.body.removeChild(downloadLink);
				}
				URL.revokeObjectURL(objectUrl);
			}, 1000);

			return {
				...testResult,
				stage: 'download-complete'
			};
		} catch (clickError) {
			return {
				...testResult,
				success: false,
				stage: 'download-click',
				error: `Error clicking download link: ${clickError instanceof Error ? clickError.message : String(clickError)}`
			};
		}
	} catch (downloadError) {
		return {
			...testResult,
			success: false,
			stage: 'download-setup',
			error: `Error setting up download: ${downloadError instanceof Error ? downloadError.message : String(downloadError)}`
		};
	}
}
