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
import { autoAdjustLayout } from '$lib/components/SequenceWorkbench/BeatFrame/beatFrameHelpers';

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
	rows: number;
	columns: number; // Total columns including start position column if present
	columnsForBeats: number; // Columns available for regular beats
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

/**
 * Calculates dimensions for the canvas
 */
function calculateDimensions(options: EnhancedExportOptions): CanvasDimensions {
	// Base beat size
	const beatSize = 950;

	// Determine if we have a start position
	// We need to be more aggressive in detecting start positions
	// If includeStartPosition is true, we'll assume there is a start position
	// This ensures we always have the correct layout
	const hasStartPosition = options.includeStartPosition;

	// Get the beat count (excluding start position)
	const beatCount = options.beats.length;

	// Use the same layout algorithm as BeatFrame component
	// This returns [rows, cols]
	const [rows, cols] = autoAdjustLayout(beatCount);

	// IMPORTANT: For a 4x4 grid with start position, we need 5 columns total
	// Use provided columns if specified and not zero, otherwise use the calculated columns
	// This is the number of columns for regular beats (excluding start position column)
	const columnsForBeats = options.columns && options.columns > 0 ? options.columns : cols;

	// Calculate the total number of columns needed
	// If we have a start position, we need one column for it plus columns for the beats
	// If we don't have a start position, we just need columns for the beats
	const totalColumns = hasStartPosition ? columnsForBeats + 1 : columnsForBeats;

	// Force 5 columns for a 4x4 grid with start position
	// This ensures we have exactly 5 columns: 1 for start position + 4 for beats
	if (hasStartPosition && columnsForBeats === 4) {
		console.log('EnhancedExporter: Forcing 5 columns for 4x4 grid with start position');
	}

	console.log('EnhancedExporter: Column calculation', {
		beatCount,
		calculatedCols: cols,
		columnsForBeats,
		totalColumns,
		hasStartPosition
	});

	// Calculate width and height
	// Width includes all columns (including start position column if present)
	// For a 4x4 grid with start position, we need exactly 5 columns of width
	const width = totalColumns * beatSize;

	// Log the exact dimensions we're using
	console.log('EnhancedExporter: Final dimensions', {
		totalColumns,
		columnsForBeats,
		width: `${width}px`,
		beatSize: `${beatSize}px`,
		totalWidth: `${totalColumns * beatSize}px`
	});

	// Height is determined by the maximum number of rows needed
	const height = rows * beatSize;

	// Calculate margins
	const topMargin = options.addWord ? Math.min(beatSize * 0.7, 150) : 0;
	// Increase bottom margin to create more space between pictographs and notes
	const bottomMargin = options.addUserInfo ? Math.min(beatSize * 0.5, 120) : 0;

	console.log('EnhancedExporter: Layout calculated', {
		beatCount,
		rows,
		columnsForBeats,
		totalColumns,
		hasStartPosition,
		width,
		height
	});

	return {
		width,
		height,
		topMargin,
		bottomMargin,
		beatSize,
		rows,
		columns: totalColumns,
		columnsForBeats
	};
}

/**
 * Renders SVG elements to the canvas
 */
async function renderSvgElements(
	ctx: CanvasRenderingContext2D,
	svgElements: SVGElement[],
	options: EnhancedExportOptions,
	dimensions: CanvasDimensions,
	containerElement: HTMLElement
): Promise<void> {
	const { beatSize, topMargin = 20, columns, rows, columnsForBeats } = dimensions;

	// Get the beat count
	const beatCount = options.beats.length;

	// Find the start position element index and determine if we have a start position
	// In BeatFrame.svelte, the start position is always in the first cell (top-left)
	let startPositionIndex = -1;

	// Try to find the start position element directly from the container
	const startPositionContainer = containerElement.querySelector('.start-position');

	// Force hasStartPosition to true if we found a start position container in the DOM
	// This ensures we always have the correct layout even if options.startPosition is null
	let hasStartPosition =
		options.includeStartPosition && (!!options.startPosition || !!startPositionContainer);

	if (startPositionContainer) {
		console.log(
			'EnhancedExporter: Found start position container in DOM, forcing hasStartPosition to true'
		);

		const startPositionSvg = startPositionContainer.querySelector('svg');
		if (startPositionSvg) {
			// Find the index of this SVG in our svgElements array
			startPositionIndex = svgElements.findIndex((svg) => svg === startPositionSvg);
			console.log(
				'EnhancedExporter: Found start position element directly at index',
				startPositionIndex
			);
		}
	}

	// If we couldn't find it directly, try looking at parent elements of each SVG
	if (startPositionIndex === -1) {
		for (let i = 0; i < svgElements.length; i++) {
			const element = svgElements[i];
			const parent = element.parentElement;
			const grandparent = parent?.parentElement;

			// Check if this is the start position element
			// The start position is in a container with class "start-position"
			if (grandparent?.classList.contains('start-position')) {
				startPositionIndex = i;
				console.log('EnhancedExporter: Found start position element at index', i);
				break;
			}
		}
	}

	console.log('EnhancedExporter: Rendering SVG elements', {
		svgCount: svgElements.length,
		hasStartPosition,
		startPositionIndex,
		columnsForBeats,
		beatCount,
		columns,
		rows
	});

	// Process each SVG element
	for (let i = 0; i < svgElements.length; i++) {
		let x, y;

		if (hasStartPosition && i === startPositionIndex) {
			// This is the start position - place it in its own column on the left (column 1)
			x = 0;
			y = topMargin;
			console.log('EnhancedExporter: Positioning start position at', { x, y });
		} else {
			// This is a regular beat - calculate position in the main grid
			// We need to map the SVG index to the correct beat index
			// If we have a start position, we need to adjust the index
			let beatIndex = i;

			// If we have a start position and this element comes after it in the DOM,
			// we need to subtract 1 to get the correct beat index
			if (hasStartPosition && startPositionIndex >= 0) {
				if (i > startPositionIndex) {
					beatIndex = i - 1;
				} else if (i < startPositionIndex) {
					// This element comes before the start position in the DOM
					// We need to adjust the index accordingly
					beatIndex = i;
				}
			}

			// IMPORTANT: For a 4x4 grid with start position, we need 5 columns total
			// Column 0 is reserved for start position only
			// Regular beats must be in columns 1-4
			// Each row after the first must start at column 1, not column 0

			// Calculate row and column indices
			const rowIndex = Math.floor(beatIndex / columnsForBeats);
			const colIndex = beatIndex % columnsForBeats;

			// ALWAYS add 1 to column index when we have a start position
			// This ensures beats start from column 1, not column 0
			const col = hasStartPosition ? colIndex + 1 : colIndex;
			const row = rowIndex;

			// Calculate x and y coordinates
			x = col * beatSize; // Column 0 is empty except for start position
			y = row * beatSize + topMargin;

			console.log('EnhancedExporter: Beat layout calculation', {
				beatIndex,
				rowIndex,
				colIndex,
				col,
				row,
				x,
				y,
				columnsForBeats
			});

			console.log('EnhancedExporter: Positioning beat', beatIndex, 'at', {
				x,
				y,
				row,
				col,
				rowIndex,
				colIndex,
				svgIndex: i
			});
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

		// If this is a regular beat (not start position), check if it has reversal indicators
		if (!(hasStartPosition && i === startPositionIndex) && options.addReversalSymbols) {
			// Calculate the beat index using the same logic as for positioning
			let beatIndex = i;
			if (hasStartPosition && startPositionIndex >= 0) {
				if (i > startPositionIndex) {
					beatIndex = i - 1;
				}
			}
			const beat = options.beats[beatIndex];

			// Check if the beat has reversal indicators
			if (beat && (beat.metadata?.blueReversal || beat.metadata?.redReversal)) {
				console.log(`EnhancedExporter: Beat ${beatIndex} has reversal indicators`, {
					blueReversal: beat.metadata?.blueReversal,
					redReversal: beat.metadata?.redReversal
				});

				// Draw reversal indicators
				const indicatorSize = beatSize * 0.1; // 10% of beat size
				const indicatorY = y + beatSize - indicatorSize * 1.5; // Position at bottom of beat
				const indicatorSpacing = indicatorSize * 0.5;

				// Calculate center position for the indicators
				const centerX = x + beatSize / 2;
				let currentX = centerX;

				// If both indicators are present, adjust starting position
				if (beat.metadata?.blueReversal && beat.metadata?.redReversal) {
					currentX = centerX - indicatorSize / 2 - indicatorSpacing / 2;
				}

				// Draw blue reversal indicator
				if (beat.metadata?.blueReversal) {
					ctx.fillStyle = 'blue';
					ctx.beginPath();
					ctx.arc(currentX, indicatorY, indicatorSize / 2, 0, Math.PI * 2);
					ctx.fill();

					// Move to next position if needed
					if (beat.metadata?.redReversal) {
						currentX += indicatorSize + indicatorSpacing;
					}
				}

				// Draw red reversal indicator
				if (beat.metadata?.redReversal) {
					ctx.fillStyle = 'red';
					ctx.beginPath();
					ctx.arc(currentX, indicatorY, indicatorSize / 2, 0, Math.PI * 2);
					ctx.fill();
				}
			}
		}
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
