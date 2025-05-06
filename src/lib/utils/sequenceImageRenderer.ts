// src/lib/utils/sequenceImageRenderer.ts
import type { BeatData } from '$lib/components/SequenceWorkbench/SequenceBeatFrame/BeatData';

/**
 * Options for rendering a sequence to an image
 */
export interface SequenceRenderOptions {
  beats: BeatData[];
  startPosition: any | null;
  rows: number;
  cols: number;
  padding?: number;
  backgroundColor?: string;
  includeTitle?: boolean;
  title?: string;
  quality?: number; // 0-1 for JPEG quality
  format?: 'png' | 'jpeg';
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Result of rendering a sequence to an image
 */
export interface SequenceRenderResult {
  dataUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Renders a sequence to an image
 * @param element The DOM element to render (the beat frame)
 * @param options Rendering options
 * @returns Promise that resolves to the render result
 */
export async function renderSequenceToImage(
  element: HTMLElement,
  options: SequenceRenderOptions
): Promise<SequenceRenderResult> {
  return new Promise((resolve, reject) => {
    try {
      // Use html2canvas to render the element to a canvas
      import('html2canvas').then(async (html2canvasModule) => {
        const html2canvas = html2canvasModule.default;
        
        // Calculate the actual rows needed based on beat count
        const actualRows = Math.ceil(options.beats.length / options.cols);
        const usedRows = options.startPosition ? actualRows + 1 : actualRows;
        
        // Calculate the aspect ratio based on the actual used rows and columns
        const aspectRatio = options.cols / usedRows;
        
        // Set up canvas options
        const canvasOptions = {
          backgroundColor: options.backgroundColor || 'transparent',
          scale: 2, // Higher scale for better quality
          logging: false,
          useCORS: true,
          allowTaint: true,
        };
        
        // Render the element to a canvas
        const canvas = await html2canvas(element, canvasOptions);
        
        // Get the original dimensions
        let width = canvas.width;
        let height = canvas.height;
        
        // Apply max dimensions if specified
        if (options.maxWidth && width > options.maxWidth) {
          height = (options.maxWidth / width) * height;
          width = options.maxWidth;
        }
        
        if (options.maxHeight && height > options.maxHeight) {
          width = (options.maxHeight / height) * width;
          height = options.maxHeight;
        }
        
        // Create a new canvas with the desired dimensions
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = width;
        outputCanvas.height = height;
        
        // Draw the original canvas onto the output canvas
        const ctx = outputCanvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Draw background if specified
        if (options.backgroundColor) {
          ctx.fillStyle = options.backgroundColor;
          ctx.fillRect(0, 0, width, height);
        }
        
        // Draw the sequence
        ctx.drawImage(canvas, 0, 0, width, height);
        
        // Add title if requested
        if (options.includeTitle && options.title) {
          ctx.font = `bold ${Math.round(width * 0.05)}px Arial`;
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.fillText(options.title, width / 2, height * 0.08);
        }
        
        // Convert to data URL
        const format = options.format || 'png';
        const quality = options.quality || 1.0;
        const dataUrl = outputCanvas.toDataURL(`image/${format}`, quality);
        
        // Return the result
        resolve({
          dataUrl,
          width,
          height,
          aspectRatio
        });
      }).catch(error => {
        reject(new Error(`Failed to load html2canvas: ${error.message}`));
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Downloads a data URL as a file
 * @param dataUrl The data URL to download
 * @param filename The filename to use
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
