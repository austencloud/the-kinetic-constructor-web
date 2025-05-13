// src/lib/components/SequenceWorkbench/share/imageExport/twoPassRenderer.ts

import { logger } from '$lib/core/logging';
import type { SequenceRenderOptions, SequenceRenderResult, CanvasDimensions } from './types';
import { prepareSvgElements, restoreSvgElements } from './svgHelper';
import { applyPreRenderStyles, restoreOriginalStyles } from './styleHelper';

/**
 * Two-pass renderer for sequence images
 * First pass: Measure the actual rendered elements
 * Second pass: Create the canvas with appropriate dimensions
 */
export async function renderWithTwoPasses(
  element: HTMLElement,
  options: SequenceRenderOptions
): Promise<SequenceRenderResult> {
  // Track timing for performance analysis
  const startTime = performance.now();
  
  // Create a clone of the element for measurement
  const measurementClone = element.cloneNode(true) as HTMLElement;
  
  // Add the clone to the document but make it invisible
  measurementClone.style.position = 'absolute';
  measurementClone.style.left = '-9999px';
  measurementClone.style.visibility = 'hidden';
  document.body.appendChild(measurementClone);
  
  try {
    // Log the start of the process
    console.log('TwoPassRenderer: Starting two-pass rendering process');
    
    // First pass: Prepare and measure
    console.log('TwoPassRenderer: First pass - preparing and measuring');
    
    // Apply styles to make everything visible
    applyPreRenderStyles(measurementClone, options);
    
    // Prepare SVG elements specifically
    prepareSvgElements(measurementClone);
    
    // Force layout calculation
    void measurementClone.offsetWidth;
    
    // Measure the element
    const measurements = measureElement(measurementClone);
    
    console.log('TwoPassRenderer: First pass measurements:', measurements);
    
    // Calculate dimensions based on measurements
    const dimensions = calculateDimensions(measurements, options);
    
    console.log('TwoPassRenderer: Calculated dimensions:', dimensions);
    
    // Second pass: Render with correct dimensions
    console.log('TwoPassRenderer: Second pass - rendering');
    
    // Prepare the actual element for rendering
    applyPreRenderStyles(element, options);
    prepareSvgElements(element);
    
    // Force layout calculation
    void element.offsetWidth;
    
    // Render the element to canvas
    const result = await renderToCanvas(element, dimensions, options);
    
    // Log timing information
    const endTime = performance.now();
    console.log(`TwoPassRenderer: Rendering completed in ${Math.round(endTime - startTime)}ms`);
    
    return result;
  } catch (error) {
    logger.error('TwoPassRenderer: Error in two-pass rendering', {
      error: error instanceof Error ? error : new Error(String(error))
    });
    throw error;
  } finally {
    // Clean up
    if (document.body.contains(measurementClone)) {
      document.body.removeChild(measurementClone);
    }
    
    // Restore original styles
    restoreOriginalStyles(element);
    restoreSvgElements(element);
  }
}

/**
 * Measure the element to determine its actual rendered dimensions
 */
function measureElement(element: HTMLElement): {
  width: number;
  height: number;
  beatSize: number;
  beatCount: number;
} {
  try {
    // Find all beat elements
    const beatElements = element.querySelectorAll('.beat-frame, .pictograph-wrapper, .tka-glyph');
    
    // Default values in case we can't find anything
    let beatSize = 200;
    let beatCount = 0;
    
    if (beatElements.length > 0) {
      beatCount = beatElements.length;
      
      // Calculate average beat size
      let totalWidth = 0;
      let totalHeight = 0;
      let validElements = 0;
      
      beatElements.forEach(beat => {
        const rect = beat.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          totalWidth += rect.width;
          totalHeight += rect.height;
          validElements++;
        }
      });
      
      if (validElements > 0) {
        const avgWidth = totalWidth / validElements;
        const avgHeight = totalHeight / validElements;
        beatSize = Math.max(avgWidth, avgHeight);
      }
    }
    
    // Get overall element dimensions
    const rect = element.getBoundingClientRect();
    const width = Math.max(rect.width, beatSize * (beatCount > 0 ? beatCount : 1));
    const height = Math.max(rect.height, beatSize);
    
    return {
      width,
      height,
      beatSize,
      beatCount
    };
  } catch (error) {
    logger.error('TwoPassRenderer: Error measuring element', {
      error: error instanceof Error ? error : new Error(String(error))
    });
    
    // Return fallback values
    return {
      width: 800,
      height: 600,
      beatSize: 200,
      beatCount: 0
    };
  }
}

/**
 * Calculate dimensions based on measurements and options
 */
function calculateDimensions(
  measurements: {
    width: number;
    height: number;
    beatSize: number;
    beatCount: number;
  },
  options: SequenceRenderOptions
): CanvasDimensions {
  // Get base beat size from measurements
  let beatSize = measurements.beatSize;
  
  // Apply scale factor from options
  if (options.scale && typeof options.scale === 'number') {
    beatSize = Math.round(beatSize * options.scale);
  }
  
  // Ensure minimum beat size
  beatSize = Math.max(beatSize, 100);
  
  // Calculate rows and columns
  const cols = options.cols || 4;
  const beatCount = measurements.beatCount || (options.beats?.length || 0);
  const rows = Math.max(1, Math.ceil(beatCount / cols));
  
  // Calculate width and height
  const width = cols * beatSize;
  const height = rows * beatSize;
  
  // Calculate margins
  const topMargin = options.addWord ? Math.min(beatSize * 0.7, 150) : 0;
  const bottomMargin = options.addUserInfo ? Math.min(beatSize * 0.3, 80) : 0;
  
  return {
    width,
    height,
    topMargin,
    bottomMargin,
    beatSize
  };
}

/**
 * Render the element to canvas using html2canvas
 */
async function renderToCanvas(
  element: HTMLElement,
  dimensions: CanvasDimensions,
  options: SequenceRenderOptions
): Promise<SequenceRenderResult> {
  return new Promise(async (resolve, reject) => {
    try {
      // Import html2canvas dynamically
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;
      
      // Create canvas options
      const canvasOptions = {
        backgroundColor: options.backgroundColor || '#FFFFFF',
        scale: 2, // Higher scale for better quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        // Ensure SVG elements are rendered properly
        svgRendering: true,
        // Don't ignore any SVG elements
        ignoreElements: (el: Element) => {
          if (el.tagName.toLowerCase() === 'svg' || el.closest('svg')) {
            return false;
          }
          return el.classList.contains('ignore-export');
        },
        // Add a small delay to ensure everything is rendered
        onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
          // Ensure all SVG elements in the clone are properly prepared
          prepareSvgElements(clonedElement);
          return new Promise(resolve => setTimeout(resolve, 100));
        }
      };
      
      // Render the element to canvas
      console.log('TwoPassRenderer: Rendering element to canvas with html2canvas');
      const canvas = await html2canvas(element, canvasOptions);
      
      // Create the final canvas with margins
      const { width, height, topMargin, bottomMargin } = dimensions;
      
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = width;
      outputCanvas.height = height + topMargin + bottomMargin;
      
      const ctx = outputCanvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Fill with background color
      ctx.fillStyle = options.backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
      
      // Draw title if needed
      if (options.addWord && options.title) {
        drawTitle(ctx, options.title, width, topMargin);
      }
      
      // Draw the content from the rendered canvas
      // Center the content horizontally
      const contentX = Math.max(0, Math.floor((width - canvas.width) / 2));
      ctx.drawImage(canvas, contentX, topMargin);
      
      // Draw user info if needed
      if (options.addUserInfo) {
        drawUserInfo(ctx, options, width, height, bottomMargin);
      }
      
      // Generate data URL
      const format = options.format === 'jpeg' ? 'jpeg' : 'png';
      const quality = options.quality !== undefined ? Math.max(0, Math.min(1, options.quality)) : 0.92;
      
      try {
        // Add a small delay to ensure the canvas is fully rendered
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const dataUrl = outputCanvas.toDataURL(`image/${format}`, quality);
        
        // Validate data URL
        if (!dataUrl || !dataUrl.startsWith('data:image/')) {
          reject(new Error('Invalid data URL generated'));
          return;
        }
        
        // Return the result
        resolve({
          dataUrl,
          width: outputCanvas.width,
          height: outputCanvas.height,
          aspectRatio: outputCanvas.width / outputCanvas.height
        });
      } catch (dataUrlError) {
        reject(new Error(`Failed to generate data URL: ${dataUrlError instanceof Error ? dataUrlError.message : String(dataUrlError)}`));
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Draw title on the canvas
 */
function drawTitle(
  ctx: CanvasRenderingContext2D,
  title: string,
  width: number,
  topMargin: number
): void {
  // Start with a reasonable base font size proportional to margin
  let fontSize = Math.min(width * 0.08, topMargin * 0.6);
  
  // Set initial font to measure text
  ctx.font = `bold ${fontSize}px Georgia`;
  let textWidth = ctx.measureText(title).width;
  
  // Reduce font size until it fits within 80% of canvas width
  while (textWidth > width * 0.8 && fontSize > 16) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px Georgia`;
    textWidth = ctx.measureText(title).width;
  }
  
  // Draw title with subtle shadow for better readability
  ctx.save();
  
  // Draw shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, width / 2 + 2, topMargin / 2 + 2);
  
  // Draw main text
  ctx.fillStyle = '#000000';
  ctx.fillText(title, width / 2, topMargin / 2);
  
  // Add a subtle underline
  textWidth = ctx.measureText(title).width;
  const lineY = topMargin / 2 + fontSize * 0.6;
  const lineWidth = textWidth * 0.8;
  
  ctx.beginPath();
  ctx.moveTo(width / 2 - lineWidth / 2, lineY);
  ctx.lineTo(width / 2 + lineWidth / 2, lineY);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Draw user info on the canvas
 */
function drawUserInfo(
  ctx: CanvasRenderingContext2D,
  options: SequenceRenderOptions,
  width: number,
  height: number,
  bottomMargin: number
): void {
  const userName = options.userName || 'User';
  const notes = options.notes || 'Created using The Kinetic Constructor';
  const exportDate = options.exportDate || new Date().toLocaleDateString();
  
  ctx.save();
  
  // Set font and color
  ctx.font = `${Math.min(bottomMargin * 0.3, 16)}px Arial`;
  ctx.fillStyle = '#333333';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Position for the text
  const textY = height + topMargin + bottomMargin / 2;
  
  // Draw the text
  ctx.fillText(`${userName} • ${exportDate} • ${notes}`, width / 2, textY);
  
  ctx.restore();
}
