/**
 * Canvas Dimensions Calculator
 *
 * This module calculates the dimensions for the canvas used in image export.
 */

import { autoAdjustLayout } from '$lib/components/SequenceWorkbench/BeatFrame/beatFrameHelpers';
import type { CanvasDimensions, EnhancedExportOptions } from './exportTypes';

/**
 * Calculates dimensions for the canvas
 *
 * @param options Export options
 * @returns Canvas dimensions
 */
export function calculateDimensions(options: EnhancedExportOptions): CanvasDimensions {
	// Base beat size
	const beatSize = 950;

	// Determine if we have a start position
	// Only include the start position if:
	// 1. The includeStartPosition option is true
	// 2. There is actually a start position provided
	const hasStartPosition = options.includeStartPosition && !!options.startPosition;

	// Get the beat count (excluding start position)
	const beatCount = options.beats.length;

	// Determine optimal number of columns based on beat count
	// For small sequences, use fewer columns to avoid empty space
	let columnsForBeats;
	if (options.columns && options.columns > 0) {
		// Use provided columns if specified
		columnsForBeats = options.columns;
	} else {
		// Automatically adjust columns based on beat count
		if (beatCount <= 1) {
			columnsForBeats = 1; // Use 1 column for 1 beat
		} else if (beatCount <= 2) {
			columnsForBeats = 2; // Use 2 columns for 2 beats
		} else if (beatCount <= 3) {
			columnsForBeats = 3; // Use 3 columns for 3 beats
		} else {
			// For 4+ beats, use the autoAdjustLayout function
			const [_, cols] = autoAdjustLayout(beatCount);
			columnsForBeats = cols;
		}
	}

	// Special case for 6 beats with start position
	// The beatCountGridMap shows 6 beats should use 2 rows and 4 columns
	// But we need to ensure we're using the full 4 columns for beats, not 3
	if (beatCount === 6 && hasStartPosition && columnsForBeats < 4) {
		// Force 4 columns for beats when we have 6 beats with start position
		columnsForBeats = 4;
	}

	// Calculate how many rows we need for the beats
	// When we have a start position, the beats are arranged in a grid starting from column 2, row 1
	// We need to ensure we have enough rows for all beats
	// For 6 beats with start position, we need 2 rows with 4 columns for beats (5 columns total)
	const rowsForBeats = Math.ceil(beatCount / columnsForBeats);

	// Calculate the total number of columns needed
	// If we have a start position, we need one column for it plus columns for the beats
	// For example, with 2 beats and start position, we need exactly 3 columns total (1 for start + 2 for beats)
	const totalColumns = hasStartPosition ? columnsForBeats + 1 : columnsForBeats;

	// Calculate width and height
	// Width includes all columns (including start position column if present)
	const width = totalColumns * beatSize;
	const height = rowsForBeats * beatSize;

	// Calculate margins with significantly improved sizing for better readability
	// Reserve more space for title (20%) and notes (15%) to accommodate larger text
	// Ensure a higher minimum size for text areas regardless of image dimensions
	const MIN_TOP_MARGIN = 180; // Significantly increased for better readability
	const MIN_BOTTOM_MARGIN = 150; // Significantly increased for better readability

	// Calculate margins with higher percentages
	const calculatedTopMargin = options.addWord ? Math.round(height * 0.2) : 0; // Increased from 15% to 20%
	const calculatedBottomMargin = options.addUserInfo ? Math.round(height * 0.15) : 0; // Increased from 10% to 15%

	// Use the larger of the calculated or minimum values
	const topMargin = options.addWord ? Math.max(calculatedTopMargin, MIN_TOP_MARGIN) : 0;
	const bottomMargin = options.addUserInfo
		? Math.max(calculatedBottomMargin, MIN_BOTTOM_MARGIN)
		: 0;

	// Log detailed information for debugging
	console.log('EnhancedExporter: Layout calculated', {
		beatCount,
		rowsForBeats,
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
		rows: rowsForBeats,
		columns: totalColumns,
		columnsForBeats
	};
}
