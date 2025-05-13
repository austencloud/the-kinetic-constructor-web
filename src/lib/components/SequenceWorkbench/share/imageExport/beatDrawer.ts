// src/lib/components/SequenceWorkbench/share/imageExport/beatDrawer.ts

import type { SequenceRenderOptions, CanvasDimensions } from './types';

/**
 * Draws the sequence beats onto the canvas
 */
export function drawBeats(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  dimensions: CanvasDimensions,
  options: SequenceRenderOptions
): void {
  const { width, topMargin, beatSize } = dimensions;
  
  // Center the content horizontally like in the Python version
  // This ensures content is centered rather than pushed to the left
  const contentX = Math.max(0, Math.floor((width - sourceCanvas.width) / 2));
  
  // Draw the beat canvas at the calculated position
  ctx.drawImage(sourceCanvas, contentX, topMargin);
  
  // Log the placement
  console.log('BeatDrawer: Placed beats at', {
    x: contentX,
    y: topMargin,
    sourceWidth: sourceCanvas.width,
    sourceHeight: sourceCanvas.height,
    beatSize
  });
}

/**
 * Creates HTML2Canvas options for capturing the beat elements
 */
export function createCanvasOptions(backgroundColor: string): any {
  return {
    backgroundColor: backgroundColor || '#FFFFFF',
    scale: 2, // Higher scale for better quality
    logging: false,
    useCORS: true,
    allowTaint: true,
    // Capture SVG elements properly
    svgRendering: true,
    ignoreElements: (el: Element) => {
      // Don't ignore any SVG elements
      if (el.tagName.toLowerCase() === 'svg' || el.closest('svg')) {
        return false;
      }
      // Ignore elements with these classes
      return el.classList.contains('ignore-export');
    }
  };
}