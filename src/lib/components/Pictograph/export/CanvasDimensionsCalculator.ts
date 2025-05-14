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

  // Use the same layout algorithm as BeatFrame component
  // This returns [rows, cols]
  const [rows, cols] = autoAdjustLayout(beatCount);

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
      columnsForBeats = cols; // Use calculated columns for 4+ beats
    }
  }

  // Calculate the total number of columns needed
  // If we have a start position, we need one column for it plus columns for the beats
  // If we don't have a start position, we just need columns for the beats
  const totalColumns = hasStartPosition ? columnsForBeats + 1 : columnsForBeats;

  console.log('EnhancedExporter: Dynamic column calculation', {
    beatCount,
    calculatedCols: cols,
    adjustedColumnsForBeats: columnsForBeats,
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

  // Calculate margins with improved sizing for better readability
  // Reserve exactly 15% of image height for title and 10% for notes
  // Ensure a minimum size for text areas regardless of image dimensions
  const MIN_TOP_MARGIN = 120; // Increased from 100px for better readability
  const MIN_BOTTOM_MARGIN = 100; // Increased from 80px for better readability

  // Calculate margins with minimums
  const calculatedTopMargin = options.addWord ? Math.round(height * 0.15) : 0;
  const calculatedBottomMargin = options.addUserInfo ? Math.round(height * 0.1) : 0;

  // Use the larger of the calculated or minimum values
  const topMargin = options.addWord ? Math.max(calculatedTopMargin, MIN_TOP_MARGIN) : 0;
  const bottomMargin = options.addUserInfo
    ? Math.max(calculatedBottomMargin, MIN_BOTTOM_MARGIN)
    : 0;

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
