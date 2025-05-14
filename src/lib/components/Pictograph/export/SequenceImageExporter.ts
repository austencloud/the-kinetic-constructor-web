/**
 * Enhanced Image Exporter
 *
 * This module provides functionality to export images with additional elements
 * like title, user info, and difficulty label.
 */

import { browser } from '$app/environment';
import { logger } from '$lib/core/logging';
import { drawDifficultyCircle } from './difficultyCircleDrawer';
import { calculateDimensions } from './CanvasDimensionsCalculator';
import { drawTitle } from './TitleRenderer';
import { drawUserInfo } from './UserInfoRenderer';
import { renderSvgElements } from './SvgElementRenderer';
import type {
	EnhancedExportOptions,
	EnhancedExportResult,
	RequiredExportOptions
} from './exportTypes';

/**
 * Exports a sequence with enhanced features
 *
 * @param containerElement The container element with SVG elements
 * @param options Export options
 * @returns Promise resolving to the export result
 */
export async function exportSequenceImage(
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
		console.log('EnhancedExporter: Starting export process');

		// Default options with required fields
		const defaultOptions: Required<Omit<EnhancedExportOptions, 'beats' | 'startPosition'>> = {
			backgroundColor: 'white',
			scale: 2,
			quality: 0.92,
			format: 'png',
			columns: 0, // Value will be ignored, autoAdjustLayout will determine columns
			spacing: 0, // No spacing between cells, consistent with BeatFrame
			includeStartPosition: true, // Always include start position if it exists
			// Enable all enhancement features by default
			addWord: true, // Add sequence title at the top
			addUserInfo: true, // Add user info at the bottom
			addDifficultyLevel: true, // Add difficulty level indicator in top-left
			addBeatNumbers: true, // Add beat numbers
			addReversalSymbols: true, // Add reversal symbols
			title: '',
			userName: 'User',
			notes: 'Created using The Kinetic Alphabet',
			exportDate: new Date().toLocaleDateString(),
			difficultyLevel: 1
		};

		// Merge options with type safety
		const mergedOptions: RequiredExportOptions = {
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

		console.log(`EnhancedExporter: Found ${svgElements.length} SVG elements`);

		// Find all reversal indicators
		const reversalIndicators = Array.from(containerElement.querySelectorAll('.reversal-indicator'));
		console.log(`EnhancedExporter: Found ${reversalIndicators.length} reversal indicators`);

		// Log detailed information about the start position
		console.log('EnhancedExporter: Start position details', {
			hasStartPosition: mergedOptions.includeStartPosition && mergedOptions.startPosition,
			startPositionData: mergedOptions.startPosition,
			firstBeatMetadata: mergedOptions.beats[0]?.metadata,
			totalBeats: mergedOptions.beats.length
		});

		// Calculate dimensions
		const dimensions = calculateDimensions(mergedOptions);

		// Create a canvas
		const canvas = document.createElement('canvas');
		const { width, height, topMargin, bottomMargin } = dimensions;
		canvas.width = width;
		canvas.height = height + topMargin + bottomMargin;

		// Get canvas context
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Failed to get canvas context');
		}

		// Fill background with white to ensure consistent background
		ctx.fillStyle = '#FFFFFF';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw title if needed
		if (mergedOptions.addWord && mergedOptions.title) {
			drawTitle(ctx, mergedOptions.title, dimensions);
		}

		// Draw difficulty circle if needed
		if (mergedOptions.addDifficultyLevel) {
			// Draw circular difficulty indicator in the top-left corner
			// with appropriate size and position
			drawDifficultyCircle(
				ctx,
				mergedOptions.difficultyLevel,
				60, // x position
				60, // y position
				40 // radius
			);
		}

		// Process each SVG element
		await renderSvgElements(ctx, svgElements, mergedOptions, dimensions, containerElement);

		// Draw user info if needed
		if (mergedOptions.addUserInfo) {
			drawUserInfo(ctx, mergedOptions, dimensions);
		}

		// Convert canvas to data URL
		const format = mergedOptions.format === 'jpeg' ? 'image/jpeg' : 'image/png';
		const dataUrl = canvas.toDataURL(format, mergedOptions.quality);

		console.log('EnhancedExporter: Export completed successfully', {
			width: canvas.width,
			height: canvas.height,
			dataUrlLength: dataUrl.length
		});

		// Return the result
		return {
			dataUrl,
			width: canvas.width,
			height: canvas.height,
			format: mergedOptions.format
		};
	} catch (error) {
		// Log detailed error information
		logger.error('Error exporting enhanced image', {
			error: error instanceof Error ? error : new Error(String(error))
		});

		// Re-throw the error
		throw new Error(
			`Failed to export enhanced image: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}
