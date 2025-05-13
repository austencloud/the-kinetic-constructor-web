/**
 * Download Utilities
 * 
 * This module provides utilities for downloading images.
 */

import { browser } from '$app/environment';
import { logger } from '$lib/core/logging';

/**
 * Options for downloading an image
 */
export interface DownloadOptions {
  dataUrl: string;
  filename: string;
  mimeType?: string;
}

/**
 * Downloads an image from a data URL
 * 
 * @param options Download options
 * @returns Promise resolving to true if successful
 */
export async function downloadImage(options: DownloadOptions): Promise<boolean> {
  // Validate environment
  if (!browser) {
    return Promise.reject(new Error('Cannot download: not in browser environment'));
  }

  try {
    console.log(`DownloadUtils: Downloading image as "${options.filename}"`);
    
    // Extract MIME type from data URL if not provided
    const mimeType = options.mimeType || options.dataUrl.split(',')[0].match(/:(.*?);/)?.[1] || 'image/png';
    
    // Try the Blob approach first (more reliable)
    try {
      // Convert data URL to Blob
      const byteString = atob(options.dataUrl.split(',')[1]);
      const mimeString = options.dataUrl.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      const blob = new Blob([ab], { type: mimeString });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = options.filename;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      
      // Small delay to ensure the browser is ready
      await new Promise(resolve => setTimeout(resolve, 50));
      
      link.click();
      
      // Clean up
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 100);
      
      return true;
    } catch (blobError) {
      console.warn('DownloadUtils: Blob approach failed, falling back to direct data URL', blobError);
      
      // Fall back to direct data URL approach
      const link = document.createElement('a');
      link.href = options.dataUrl;
      link.download = options.filename;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      
      // Small delay to ensure the browser is ready
      await new Promise(resolve => setTimeout(resolve, 50));
      
      link.click();
      
      // Clean up
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 100);
      
      return true;
    }
  } catch (error) {
    // Log detailed error information
    logger.error('Error downloading image', {
      error: error instanceof Error ? error : new Error(String(error))
    });
    
    // Re-throw the error
    throw new Error(
      `Failed to download image: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Converts a data URL to a Blob
 * 
 * @param dataUrl The data URL to convert
 * @returns The resulting Blob
 */
export function dataURLtoBlob(dataUrl: string): Blob {
  // Split the data URL into the data and MIME type
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  // Convert to Uint8Array
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  // Create and return Blob
  return new Blob([u8arr], { type: mime });
}
