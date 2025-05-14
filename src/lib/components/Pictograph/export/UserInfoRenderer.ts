/**
 * User Info Renderer
 *
 * This module provides functionality to render user information on the canvas.
 */

import type { CanvasDimensions, EnhancedExportOptions } from './exportTypes';

/**
 * Draws user info at the bottom of the canvas with responsive sizing
 * 
 * @param ctx The canvas rendering context
 * @param options Export options
 * @param dimensions Canvas dimensions
 */
export function drawUserInfo(
  ctx: CanvasRenderingContext2D,
  options: EnhancedExportOptions,
  dimensions: CanvasDimensions
): void {
  const { width, height, topMargin, bottomMargin } = dimensions;

  // Get user info text
  const userName = options.userName || 'User';
  const notes = options.notes || 'Created using The Kinetic Alphabet';
  const exportDate = options.exportDate || new Date().toLocaleDateString();

  // Calculate padding (5% of container width)
  const padding = Math.round(width * 0.05);

  // Calculate font size using the formula: fontSize = containerWidth * 0.04
  // Increased from 0.03 to 0.04 for better readability
  // Enforce min/max constraints
  const MIN_FONT_SIZE = 16; // Increased from 14 for better readability
  const MAX_FONT_SIZE = 32; // Increased from 24 for better readability
  let fontSize = Math.round(width * 0.04); // Increased from 0.03 for better readability
  fontSize = Math.max(MIN_FONT_SIZE, Math.min(fontSize, MAX_FONT_SIZE));

  // Calculate base Y position for text - center in the bottom margin
  const baseY = height + topMargin + bottomMargin / 2;

  // Save context for restoration
  ctx.save();

  // Apply subtle text shadow for better legibility
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  // Set the font for notes text
  ctx.font = `${fontSize}px Arial, sans-serif`;

  // Draw notes text (center)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';
  ctx.fillText(notes, width / 2, baseY);

  // Optional: Draw username and date in smaller font
  const smallerFontSize = Math.max(MIN_FONT_SIZE, fontSize * 0.9);
  ctx.font = `${smallerFontSize}px Arial, sans-serif`;

  // Draw username text (left)
  ctx.textAlign = 'left';
  ctx.fillStyle = '#000000';
  ctx.fillText(userName, padding, baseY);

  // Draw export date text (right)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#000000';
  ctx.fillText(exportDate, width - padding, baseY);

  // Restore context
  ctx.restore();
}
