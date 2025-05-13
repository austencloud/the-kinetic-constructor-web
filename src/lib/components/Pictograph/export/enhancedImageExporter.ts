/**
 * Enhanced Image Exporter
 *
 * This module provides functionality to export images with additional elements
 * like title, user info, and difficulty label.
 */

import { browser } from '$app/environment';
import { logger } from '$lib/core/logging';
import type { Beat } from '$lib/types/Beat';
import { renderSvgToImage } from './svgRenderer';
import { drawDifficultyCircle } from './difficultyCircleDrawer';

/**
 * Options for enhanced image export
 */
export interface EnhancedExportOptions {
	// Content options
	beats: Beat[];
	startPosition?: Beat | null;

	// Layout options
	columns?: number;
	spacing?: number;
	includeStartPosition?: boolean;

	// Visual options
	backgroundColor?: string;
	scale?: number;
	quality?: number;
	format?: 'png' | 'jpeg';

	// Content flags
	addWord?: boolean;
	addUserInfo?: boolean;
	addDifficultyLevel?: boolean;
	addBeatNumbers?: boolean;
	addReversalSymbols?: boolean;

	// Content values
	title?: string;
	userName?: string;
	notes?: string;
	exportDate?: string;
	difficultyLevel?: number;
}

/**
 * Result of exporting an image
 */
export interface EnhancedExportResult {
	dataUrl: string;
	width: number;
	height: number;
	format: string;
}

/**
 * Canvas dimensions information
 */
interface CanvasDimensions {
	width: number;
	height: number;
	topMargin: number;
	bottomMargin: number;
	beatSize: number;
}

/**
 * Exports a sequence with enhanced features
 *
 * @param containerElement The container element with SVG elements
 * @param options Export options
 * @returns Promise resolving to the export result
 */
export async function exportEnhancedImage(
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
			columns: 4,
			spacing: 20,
			includeStartPosition: true,
			addWord: true,
			addUserInfo: true,
			addDifficultyLevel: false,
			addBeatNumbers: true,
			addReversalSymbols: true,
			title: '',
			userName: 'User',
			notes: 'Created using The Kinetic Constructor',
			exportDate: new Date().toLocaleDateString(),
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

		console.log(`EnhancedExporter: Found ${svgElements.length} SVG elements`);

		// Calculate dimensions
		const dimensions = calculateDimensions(mergedOptions, svgElements.length);

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

		// Fill background
		ctx.fillStyle = mergedOptions.backgroundColor;
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
		await renderSvgElements(ctx, svgElements, mergedOptions, dimensions);

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

/**
 * Calculates dimensions for the canvas
 */
function calculateDimensions(
	options: EnhancedExportOptions,
	elementCount: number
): CanvasDimensions {
	// Base beat size
	const beatSize = 950;
	const spacing = options.spacing || 20;

	// Determine if we have a start position
	const hasStartPosition = options.includeStartPosition && options.startPosition;

	// Calculate rows and columns
	const columns = options.columns || 4;

	// For the new layout:
	// - If we have a start position, it gets its own column on the left
	// - The remaining beats are arranged in a grid starting from column 1
	const effectiveColumns = hasStartPosition ? columns : columns;
	const beatsForGrid = options.beats.length;

	// Calculate rows needed for the beats (excluding start position)
	// We use columns-1 because one column is reserved for the start position
	const columnsForBeats = hasStartPosition ? columns - 1 : columns;
	const rows = Math.ceil(beatsForGrid / columnsForBeats);

	// Eliminate gaps between pictographs by setting spacing to 0
	// The 2px black border around each pictograph will provide visual separation
	const effectiveSpacing = 0; // No spacing between pictographs

	// Calculate width and height
	// Width includes all columns (including start position column if present)
	const width = effectiveColumns * beatSize + (effectiveColumns - 1) * effectiveSpacing;

	// Height is determined by the maximum number of rows needed
	const height = rows * beatSize + (rows - 1) * effectiveSpacing;

	// Calculate margins
	const topMargin = options.addWord ? Math.min(beatSize * 0.7, 150) : 0;
	// Increase bottom margin to create more space between pictographs and notes
	const bottomMargin = options.addUserInfo ? Math.min(beatSize * 0.5, 120) : 0;

	return {
		width,
		height,
		topMargin,
		bottomMargin,
		beatSize
	};
}

/**
 * Renders SVG elements to the canvas
 */
async function renderSvgElements(
	ctx: CanvasRenderingContext2D,
	svgElements: SVGElement[],
	options: EnhancedExportOptions,
	dimensions: CanvasDimensions
): Promise<void> {
	const { beatSize, topMargin = 20 } = dimensions;
	const columns = options.columns || 4;

	// Determine if we have a start position
	const hasStartPosition = options.includeStartPosition && options.startPosition;

	// Process each SVG element
	for (let i = 0; i < svgElements.length; i++) {
		let x, y;

		if (hasStartPosition && i === 0) {
			// This is the start position - place it in its own column on the left
			x = 0;
			y = topMargin;
		} else {
			// This is a regular beat - calculate position in the main grid
			// Adjust index to account for start position
			const beatIndex = hasStartPosition ? i - 1 : i;

			// Calculate column and row in the main grid (starting from column 1)
			const col = (beatIndex % (columns - 1)) + 1; // +1 to start from column 1
			const row = Math.floor(beatIndex / (columns - 1));

			// Calculate x and y coordinates
			// Use 0 spacing to position pictographs directly adjacent to each other
			// The 2px black border will provide visual separation
			x = col * beatSize;
			y = row * beatSize + topMargin;
		}

		// Render the SVG to an image
		const result = await renderSvgToImage({
			element: svgElements[i],
			backgroundColor: 'transparent', // Use transparent for individual beats
			scale: 1, // We'll handle scaling at the canvas level
			quality: options.quality || 0.92,
			format: options.format || 'png'
		});

		// Create an image from the data URL
		const img = new Image();
		img.src = result.dataUrl;

		// Wait for the image to load
		await new Promise<void>((resolve, reject) => {
			img.onload = () => resolve();
			img.onerror = () => reject(new Error('Failed to load image'));
		});

		// Draw a black border around the pictograph
		ctx.strokeStyle = 'black';
		ctx.lineWidth = 2;
		ctx.strokeRect(x, y, beatSize, beatSize);

		// Draw the image on the canvas
		ctx.drawImage(img, x, y, beatSize, beatSize);

		console.log(`EnhancedExporter: Processed SVG element ${i + 1}/${svgElements.length}`);
	}
}

/**
 * Draws the title on the canvas
 */
function drawTitle(
	ctx: CanvasRenderingContext2D,
	title: string,
	dimensions: CanvasDimensions
): void {
	if (!title) return;

	const { width, topMargin } = dimensions;

	// Start with a proportional font size
	let fontSize = Math.min(width * 0.08, topMargin * 0.6);

	// Set initial font to measure text
	ctx.font = `bold ${Math.round(fontSize)}px Georgia`;
	let textWidth = ctx.measureText(title).width;

	// Adaptive font sizing - keep reducing until it fits
	while (textWidth > width * 0.8 && fontSize > 20) {
		fontSize -= 4;
		ctx.font = `bold ${Math.round(fontSize)}px Georgia`;
		textWidth = ctx.measureText(title).width;
	}

	// Save context for restoration
	ctx.save();

	// Draw text shadow for depth
	ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	const centerX = width / 2;
	const centerY = topMargin / 2;

	// Draw shadow slightly offset
	ctx.fillText(title, centerX + 2, centerY + 2);

	// Draw main text
	ctx.fillStyle = '#000000';
	ctx.fillText(title, centerX, centerY);

	// Removed decorative underline as requested

	// Restore context
	ctx.restore();
}

/**
 * Draws user info at the bottom of the canvas
 */
function drawUserInfo(
	ctx: CanvasRenderingContext2D,
	options: EnhancedExportOptions,
	dimensions: CanvasDimensions
): void {
	const { width, height, topMargin, bottomMargin } = dimensions;

	// Get user info text
	const userName = options.userName || 'User';
	const notes = options.notes || 'Created using The Kinetic Constructor';
	const exportDate = options.exportDate || new Date().toLocaleDateString();

	// Calculate font size relative to overall image dimensions
	// This ensures text scales proportionally with the image size
	const fontSize = Math.min(
		width * 0.015, // Scale with width
		height * 0.02, // Scale with height
		bottomMargin * 0.5 // Don't exceed half the bottom margin
	);

	// Calculate margin proportional to image dimensions
	const margin = Math.max(
		width * 0.02, // Proportional to width
		bottomMargin * 0.2, // Proportional to bottom margin
		10 // Minimum margin
	);

	// Position calculation - add padding between separator line and text
	// The separator is at height + topMargin + 15
	// Add additional 15px padding below the separator line
	const baseY = height + topMargin + 15 + 15 + (bottomMargin - 30) / 2;

	// Save context for restoration
	ctx.save();

	// Draw a clear horizontal separator line
	// Position it with adequate spacing from the pictographs
	const separatorY = height + topMargin + 15; // 15px padding from the bottom of pictographs

	ctx.beginPath();
	ctx.moveTo(margin, separatorY);
	ctx.lineTo(width - margin, separatorY);
	ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'; // Slightly darker for better visibility
	ctx.lineWidth = 1;
	ctx.stroke();

	// Draw username (left)
	ctx.font = `bold ${fontSize}px Georgia`;
	ctx.fillStyle = '#000000';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'bottom';
	ctx.fillText(userName, margin, baseY);

	// Draw notes (center)
	ctx.font = `italic ${fontSize}px Georgia`;
	ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
	ctx.textAlign = 'center';
	ctx.fillText(notes, width / 2, baseY);

	// Draw export date (right)
	ctx.textAlign = 'right';
	ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
	ctx.fillText(exportDate, width - margin, baseY);

	// Restore context
	ctx.restore();
}
