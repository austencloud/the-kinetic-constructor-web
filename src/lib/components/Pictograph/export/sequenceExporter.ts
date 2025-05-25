/**
 * Sequence Exporter
 *
 * This module provides functionality to export a sequence of beats as an image.
 * It builds on the single beat exporter to create a reliable sequence export.
 */

import { browser } from '$app/environment';
import { logger } from '$lib/core/logging';
import { renderSvgToImage } from './svgRenderer';
import type { EnhancedExportOptions, EnhancedExportResult } from './exportTypes';

/**
 * Exports a sequence of beats as an image
 *
 * @param containerElement The container element with SVG elements
 * @param options Export options
 * @returns Promise resolving to the export result
 */
export async function exportSequenceAsImage(
	containerElement: HTMLElement,
	options: EnhancedExportOptions
): Promise<EnhancedExportResult> {
	// Validate environment
	if (!browser) {
		return Promise.reject(new Error('Cannot export: not in browser environment'));
	}

	// Validate element
	if (!containerElement) {
		return Promise.reject(new Error('Cannot export: no container element provided'));
	}

	try {
		// Default options with required fields
		const defaultOptions: Required<Omit<EnhancedExportOptions, 'beats' | 'startPosition'>> = {
			backgroundColor: '#FFFFFF',
			scale: 2,
			quality: 0.92,
			format: 'png',
			columns: 4,
			spacing: 20,
			includeStartPosition: true,
			addBeatNumbers: true,
			addReversalSymbols: true,
			addWord: false,
			addUserInfo: false,
			addDifficultyLevel: false,
			title: '',
			userName: '',
			notes: '',
			exportDate: '',
			difficultyLevel: 1
		};

		// Merge options with type safety
		const mergedOptions = {
			...defaultOptions,
			...options,
			beats: options.beats,
			startPosition: options.startPosition || null
		};

		// Find all SVG elements in the container
		const svgElements = Array.from(containerElement.querySelectorAll('svg'));

		if (svgElements.length === 0) {
			throw new Error('No SVG elements found in container');
		}

		// Calculate dimensions
		const beatSize = 950; // Base size of each beat
		const spacing = mergedOptions.spacing;
		const columns = mergedOptions.columns;

		// Calculate rows based on number of beats and columns
		// Always include start position if it exists
		const totalBeats = mergedOptions.beats.length + (mergedOptions.startPosition ? 1 : 0);
		const rows = Math.ceil(totalBeats / columns);

		// Calculate canvas dimensions
		const canvasWidth = columns * beatSize + (columns - 1) * spacing;
		const canvasHeight = rows * beatSize + (rows - 1) * spacing;

		// Create a canvas
		const canvas = document.createElement('canvas');
		canvas.width = canvasWidth * mergedOptions.scale;
		canvas.height = canvasHeight * mergedOptions.scale;

		// Get canvas context
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Failed to get canvas context');
		}

		// Fill background
		ctx.fillStyle = mergedOptions.backgroundColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Scale the context
		ctx.scale(mergedOptions.scale, mergedOptions.scale);

		// Process each SVG element
		let processedCount = 0;

		// Helper function to render a single SVG element
		const renderSvgElement = async (svgElement: SVGElement, index: number) => {
			try {
				// Calculate position
				const col = index % columns;
				const row = Math.floor(index / columns);
				const x = col * (beatSize + spacing);
				const y = row * (beatSize + spacing);

				// Render the SVG to an image
				const result = await renderSvgToImage({
					element: svgElement,
					backgroundColor: 'transparent', // Use transparent for individual beats
					scale: 1, // We'll handle scaling at the canvas level
					quality: mergedOptions.quality,
					format: mergedOptions.format
				});

				// Create an image from the data URL
				const img = new Image();
				img.src = result.dataUrl;

				// Wait for the image to load
				await new Promise<void>((resolve, reject) => {
					img.onload = () => resolve();
					img.onerror = () => reject(new Error('Failed to load image'));
				});

				// Draw the image on the canvas
				ctx.drawImage(img, x, y, beatSize, beatSize);

				// Increment processed count
				processedCount++;
			} catch (error) {
				console.error(`SequenceExporter: Error processing SVG element ${index}:`, error);
				throw error;
			}
		};

		// Process all SVG elements in parallel
		await Promise.all(svgElements.map(renderSvgElement));

		// Convert canvas to data URL
		const format = mergedOptions.format === 'jpeg' ? 'image/jpeg' : 'image/png';
		const dataUrl = canvas.toDataURL(format, mergedOptions.quality);

		// Return the result
		return {
			dataUrl,
			width: canvas.width,
			height: canvas.height,
			format: mergedOptions.format
		};
	} catch (error) {
		// Log detailed error information
		logger.error('Error exporting sequence image', {
			error: error instanceof Error ? error : new Error(String(error))
		});

		// Re-throw the error
		throw new Error(
			`Failed to export sequence image: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}
