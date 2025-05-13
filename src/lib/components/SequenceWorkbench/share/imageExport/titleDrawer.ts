// src/lib/components/SequenceWorkbench/share/imageExport/titleDrawer.ts

import type { CanvasDimensions } from './types';

/**
 * Draws the title (word) on the canvas
 */
export function drawTitle(
  ctx: CanvasRenderingContext2D,
  title: string,
  dimensions: CanvasDimensions
): void {
  if (!title) return;
  
  const { width, topMargin } = dimensions;
  
  // Start with a proportional font size - similar to Python's approach
  let fontSize = Math.min(width * 0.08, topMargin * 0.6);
  
  // Set initial font to measure text
  ctx.font = getFontString(fontSize);
  let textWidth = ctx.measureText(title).width;
  
  // Adaptive font sizing - keep reducing until it fits
  while (textWidth > width * 0.8 && fontSize > 20) {
    fontSize -= 4;
    ctx.font = getFontString(fontSize);
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
  
  // Add decorative underline
  drawUnderline(ctx, centerX, centerY, fontSize, textWidth);
  
  // Restore context
  ctx.restore();
}

/**
 * Draw an underline beneath the title
 */
function drawUnderline(
  ctx: CanvasRenderingContext2D, 
  centerX: number, 
  centerY: number, 
  fontSize: number, 
  textWidth: number
): void {
  const lineY = centerY + fontSize * 0.6;
  const lineWidth = textWidth * 0.8;
  
  ctx.beginPath();
  ctx.moveTo(centerX - lineWidth / 2, lineY);
  ctx.lineTo(centerX + lineWidth / 2, lineY);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

/**
 * Get the font string with given size
 */
function getFontString(fontSize: number): string {
  return `bold ${Math.round(fontSize)}px Georgia`;
}