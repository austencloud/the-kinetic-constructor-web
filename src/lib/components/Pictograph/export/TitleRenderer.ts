/**
 * Title Renderer
 *
 * This module provides functionality to render a title on the canvas.
 */

import type { CanvasDimensions } from './exportTypes';

/**
 * Draws the title on the canvas with responsive sizing
 * 
 * @param ctx The canvas rendering context
 * @param title The title to draw
 * @param dimensions Canvas dimensions
 */
export function drawTitle(
  ctx: CanvasRenderingContext2D,
  title: string,
  dimensions: CanvasDimensions
): void {
  if (!title) return;

  const { width, topMargin } = dimensions;

  // Calculate padding (5% of container width)
  const padding = Math.round(width * 0.05);

  // Calculate font size using the formula: fontSize = containerWidth * 0.06
  // Increased from 0.05 to 0.06 for better readability
  // Enforce min/max constraints
  const MIN_FONT_SIZE = 18; // Increased from 14 for better readability
  const MAX_FONT_SIZE = 42; // Increased from 32 for better readability
  let fontSize = Math.round(width * 0.06);
  fontSize = Math.max(MIN_FONT_SIZE, Math.min(fontSize, MAX_FONT_SIZE));

  // Set initial font to measure text
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  let textWidth = ctx.measureText(title).width;

  // Adaptive font sizing - keep reducing until it fits within available space
  // Available space is container width minus double padding
  const availableWidth = width - padding * 2;
  while (textWidth > availableWidth && fontSize > MIN_FONT_SIZE) {
    fontSize -= 1;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    textWidth = ctx.measureText(title).width;
  }

  // Save context for restoration
  ctx.save();

  // Create high-contrast text with shadow for legibility
  // Apply text shadow (2px blur, 50% opacity)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  // Center-align text horizontally
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Position text in the center of the allocated space
  const centerX = width / 2;
  const centerY = topMargin / 2;

  // Draw main text directly on white background for better contrast
  // No background rectangle, just black text on white
  ctx.fillStyle = '#000000';
  ctx.fillText(title, centerX, centerY);

  // Restore context
  ctx.restore();
}
