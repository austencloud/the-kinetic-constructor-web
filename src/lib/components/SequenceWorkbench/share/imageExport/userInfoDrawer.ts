// src/lib/components/SequenceWorkbench/share/imageExport/userInfoDrawer.ts

import type { SequenceRenderOptions, CanvasDimensions } from './types';

/**
 * Draws user info at the bottom of the canvas
 */
export function drawUserInfo(
  ctx: CanvasRenderingContext2D,
  options: SequenceRenderOptions,
  dimensions: CanvasDimensions
): void {
  if (!options.addUserInfo) return;
  
  const { width, height, topMargin, bottomMargin } = dimensions;
  
  // Get user info text
  const userName = options.userName || 'User';
  const notes = options.notes || 'Created using The Kinetic Constructor';
  const exportDate = options.exportDate || new Date().toLocaleDateString();
  
  // Calculate font size relative to margin (similar to Python font_margin_helper)
  const fontSize = Math.min(width * 0.02, bottomMargin * 0.4, 16);
  const margin = Math.max(bottomMargin * 0.2, 10);
  
  // Position calculation - similar to Python implementation
  const baseY = height + topMargin + bottomMargin - margin;
  
  // Save context for restoration
  ctx.save();
  
  // Draw a subtle separator line
  drawSeparatorLine(ctx, margin, height, topMargin, width);
  
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

/**
 * Draw a subtle separator line above the user info
 */
function drawSeparatorLine(
  ctx: CanvasRenderingContext2D,
  margin: number,
  height: number,
  topMargin: number,
  width: number
): void {
  ctx.beginPath();
  ctx.moveTo(margin, height + topMargin + margin / 2);
  ctx.lineTo(width - margin, height + topMargin + margin / 2);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();
}