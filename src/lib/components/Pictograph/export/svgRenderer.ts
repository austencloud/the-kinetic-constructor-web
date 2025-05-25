/**
 * SVG Renderer
 *
 * This module provides utilities for rendering SVG elements to images.
 * It focuses on reliable rendering of SVG content for export.
 */

import { browser } from '$app/environment';
import { logger } from '$lib/core/logging';

/**
 * Converts a string to a base64 encoded data URL
 * This is a replacement for the deprecated unescape function
 *
 * @param svgString The SVG string to convert
 * @returns The base64 encoded data URL
 */
function svgToBase64DataUrl(svgString: string): string {
	return `data:image/svg+xml;base64,${btoa(
		encodeURIComponent(svgString).replace(/%([0-9A-F]{2})/g, (_, p1) =>
			String.fromCharCode(parseInt(p1, 16))
		)
	)}`;
}

/**
 * Options for rendering an SVG element
 */
export interface SVGRenderOptions {
	// Source element
	element: SVGElement;

	// Dimensions
	width?: number;
	height?: number;

	// Visual options
	backgroundColor?: string;
	scale?: number;
	quality?: number;
	format?: 'png' | 'jpeg';

	// Processing options
	ensureGridVisibility?: boolean;
	fixSvgNamespace?: boolean;
}

/**
 * Result of rendering an SVG element
 */
export interface SVGRenderResult {
	dataUrl: string;
	width: number;
	height: number;
	format: string;
}

/**
 * Renders an SVG element to an image
 *
 * @param options Render options
 * @returns Promise resolving to the render result
 */
export async function renderSvgToImage(options: SVGRenderOptions): Promise<SVGRenderResult> {
	// Validate environment
	if (!browser) {
		return Promise.reject(new Error('Cannot render: not in browser environment'));
	}

	// Validate element
	if (!options.element) {
		return Promise.reject(new Error('Cannot render: no element provided'));
	}

	// Store URL for cleanup
	let svgUrl: string | null = null;

	try {
		// Default options with required fields
		const defaultOptions: Required<Omit<SVGRenderOptions, 'element'>> = {
			backgroundColor: '#FFFFFF',
			scale: 2,
			quality: 0.92,
			format: 'png',
			width: 950,
			height: 950,
			ensureGridVisibility: true,
			fixSvgNamespace: true
		};

		// Merge options with type safety
		const mergedOptions: Required<SVGRenderOptions> = {
			...defaultOptions,
			...options,
			element: options.element
		};

		// Get dimensions
		const width = mergedOptions.width;
		const height = mergedOptions.height;

		// Create a clone of the SVG element
		const svgClone = options.element.cloneNode(true) as SVGElement;

		// Set explicit dimensions on the SVG
		svgClone.setAttribute('width', `${width}`);
		svgClone.setAttribute('height', `${height}`);

		// Ensure the SVG has a proper viewBox
		if (!svgClone.getAttribute('viewBox')) {
			svgClone.setAttribute('viewBox', '0 0 950 950');
		}

		// Fix SVG namespace if needed
		if (mergedOptions.fixSvgNamespace) {
			svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
			svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
		}

		// Ensure grid visibility if needed
		if (mergedOptions.ensureGridVisibility) {
			await ensureGridVisibility(svgClone);
		}

		// Ensure TKAGlyph components are fully rendered
		await ensureTKAGlyphVisibility(svgClone);

		// Convert SVG to string
		const svgString = new XMLSerializer().serializeToString(svgClone);

		// Create a canvas
		const canvas = document.createElement('canvas');
		canvas.width = width * mergedOptions.scale;
		canvas.height = height * mergedOptions.scale;

		// Get canvas context
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Failed to get canvas context');
		}

		// Fill background
		ctx.fillStyle = mergedOptions.backgroundColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Create an image from the SVG
		const img = new Image();

		// Create a promise to handle the image loading
		const imageLoadPromise = new Promise<SVGRenderResult>((resolve, reject) => {
			// Set up a timeout to catch hanging loads
			const timeout = setTimeout(() => {
				reject(new Error('Image load timed out after 5 seconds'));
			}, 5000);

			// Set up onload handler
			img.onload = () => {
				clearTimeout(timeout);

				// Draw the image on the canvas
				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

				// Convert canvas to data URL
				const format = mergedOptions.format === 'jpeg' ? 'image/jpeg' : 'image/png';
				const dataUrl = canvas.toDataURL(format, mergedOptions.quality);

				// Validate the data URL
				if (!dataUrl || dataUrl === 'data:,') {
					reject(new Error('Failed to generate valid data URL'));
					return;
				}

				// Return the result
				resolve({
					dataUrl,
					width: canvas.width,
					height: canvas.height,
					format: mergedOptions.format
				});
			};

			// Set up error handler
			img.onerror = (error) => {
				clearTimeout(timeout);
				reject(new Error(`Failed to load SVG image: ${error}`));
			};
		});

		// Set the image source to the SVG data URL
		// Use a more reliable method to create the SVG data URL
		try {
			// First try using Blob and URL.createObjectURL
			const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
			svgUrl = URL.createObjectURL(svgBlob);
			img.src = svgUrl;
		} catch (blobError) {
			// Fall back to data URL approach
			try {
				const dataUrl = svgToBase64DataUrl(svgString);
				img.src = dataUrl;
			} catch (dataUrlError) {
				throw new Error('Failed to create SVG source URL');
			}
		}

		// Wait for the image to load
		const result = await imageLoadPromise;

		// Clean up URL only if it was created
		if (svgUrl) {
			URL.revokeObjectURL(svgUrl);
		}

		return result;
	} catch (error) {
		// Clean up URL if it was created, even in case of error
		if (svgUrl) {
			URL.revokeObjectURL(svgUrl);
		}

		// Log detailed error information
		logger.error('Error rendering SVG image', {
			error: error instanceof Error ? error : new Error(String(error))
		});

		// Re-throw the error
		throw new Error(
			`Failed to render SVG image: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * Fetches an SVG file and returns it as a data URL
 *
 * @param url The URL of the SVG file to fetch
 * @returns Promise resolving to a data URL
 */
async function fetchSvgAsDataUrl(url: string): Promise<string> {
	// Fetch the SVG file
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch SVG: ${response.statusText}`);
	}

	// Get the SVG content
	const svgContent = await response.text();

	// Convert to data URL
	return svgToBase64DataUrl(svgContent);
}

/**
 * Ensures that TKAGlyph components are fully rendered in the SVG
 * This is a workaround for issues with TKAGlyph visibility in exported images
 *
 * @param svgElement The SVG element to process
 */
async function ensureTKAGlyphVisibility(svgElement: SVGElement): Promise<void> {
	try {
		// Find all TKAGlyph elements
		const tkaGlyphElements = svgElement.querySelectorAll('.tka-glyph');

		if (tkaGlyphElements.length > 0) {
			// Process each TKAGlyph element
			for (const glyphElement of Array.from(tkaGlyphElements)) {
				// Find letter elements within the glyph
				const letterElements = glyphElement.querySelectorAll('.tka-letter image');

				// Make sure all letter images are visible
				for (const letterElement of Array.from(letterElements)) {
					letterElement.setAttribute('opacity', '1');
					letterElement.setAttribute('visibility', 'visible');

					// Ensure the href attribute is properly set
					const href =
						letterElement.getAttribute('href') || letterElement.getAttribute('xlink:href');
					if (href && href.startsWith('/')) {
						// Convert relative URL to absolute for external references
						const fullUrl = window.location.origin + href;
						try {
							// Fetch the SVG and convert to data URL
							const dataUrl = await fetchSvgAsDataUrl(fullUrl);
							letterElement.setAttribute('href', dataUrl);
							// Also set xlink:href for compatibility
							letterElement.setAttribute('xlink:href', dataUrl);
						} catch (fetchError) {
							logger.error('SVGRenderer: Failed to fetch TKAGlyph letter SVG:', {
								error: fetchError instanceof Error ? fetchError : new Error(String(fetchError))
							});
						}
					}
				}
			}
		}
	} catch (error) {
		logger.error('SVGRenderer: Error ensuring TKAGlyph visibility:', {
			error: error instanceof Error ? error : new Error(String(error))
		});
	}
}

/**
 * Ensures that grid elements are visible in the SVG
 * This is a workaround for issues with grid visibility in exported images
 *
 * @param svgElement The SVG element to process
 */
async function ensureGridVisibility(svgElement: SVGElement): Promise<void> {
	try {
		// Find all image elements (grid is typically an image)
		const imageElements = svgElement.querySelectorAll('image');

		// Process each image element
		for (const imageElement of Array.from(imageElements)) {
			// Check both href and xlink:href attributes
			let href = imageElement.getAttribute('href');
			if (!href) {
				href = imageElement.getAttribute('xlink:href');
			}

			// Handle grid images
			if (href && href.includes('grid')) {
				// Make sure the image is visible
				imageElement.setAttribute('opacity', '1');
				imageElement.setAttribute('visibility', 'visible');

				// Ensure proper dimensions
				if (!imageElement.getAttribute('width')) {
					imageElement.setAttribute('width', '950');
				}
				if (!imageElement.getAttribute('height')) {
					imageElement.setAttribute('height', '950');
				}

				try {
					// Convert external reference to data URL
					// First, determine the full URL
					let fullUrl = href;
					if (href.startsWith('/')) {
						// Convert relative URL to absolute
						fullUrl = window.location.origin + href;
					}

					// Fetch the SVG and convert to data URL
					const dataUrl = await fetchSvgAsDataUrl(fullUrl);

					// Update both href attributes for compatibility
					imageElement.setAttribute('href', dataUrl);
					imageElement.setAttribute('xlink:href', dataUrl);
				} catch (fetchError) {
					logger.error('SVGRenderer: Failed to fetch grid SVG:', {
						error: fetchError instanceof Error ? fetchError : new Error(String(fetchError))
					});
				}
			}
		}

		// Find all grid-related elements
		const gridElements = Array.from(svgElement.querySelectorAll('*')).filter(
			(el) =>
				el.tagName.toLowerCase().includes('grid') ||
				(el.getAttribute('class') || '').includes('grid')
		);

		// Process each grid element
		gridElements.forEach((gridElement) => {
			// Make sure the grid element is visible
			gridElement.setAttribute('opacity', '1');
			gridElement.setAttribute('visibility', 'visible');
		});
	} catch (error) {
		logger.warn('Failed to ensure grid visibility:', {
			error: error instanceof Error ? error : new Error(String(error))
		});
	}
}
