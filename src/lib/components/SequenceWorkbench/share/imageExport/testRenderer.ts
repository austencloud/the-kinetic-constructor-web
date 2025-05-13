// src/lib/components/SequenceWorkbench/share/imageExport/testRenderer.ts

import { browser } from '$app/environment';
import { logger } from '$lib/core/logging';
import { renderSequenceToImage } from './sequenceImageRenderer';
import type { SequenceRenderResult } from './types';

/**
 * Test result interface
 */
export interface ImageExportTestResult {
  success: boolean;
  stage: string;
  dataUrl?: string;
  dataUrlLength?: number;
  mimeType?: string;
  error?: string;
  blob?: Blob;
  blobSize?: number;
  blobType?: string;
  imageWidth?: number;
  imageHeight?: number;
  renderTime?: number;
}

/**
 * Test the image export functionality with a simple test element
 * This helps diagnose issues with the image generation process
 */
export async function testImageExport(): Promise<ImageExportTestResult> {
  if (!browser) {
    return {
      success: false,
      stage: 'browser-check',
      error: 'Not in browser environment'
    };
  }

  const startTime = performance.now();
  
  try {
    // Create a test element with SVG content
    const testElement = document.createElement('div');
    testElement.style.width = '400px';
    testElement.style.height = '400px';
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    testElement.style.top = '-9999px';
    testElement.className = 'beat-frame';
    
    // Add SVG content to simulate pictographs
    testElement.innerHTML = `
      <div class="pictograph-wrapper" style="width: 200px; height: 200px;">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="80" fill="red" />
          <text x="100" y="100" text-anchor="middle" fill="white" font-size="24">Test</text>
        </svg>
      </div>
    `;
    
    // Add to DOM temporarily
    document.body.appendChild(testElement);
    
    try {
      // Render the test element
      const result = await renderSequenceToImage(testElement, {
        beats: [],
        cols: 1,
        title: 'Test Image',
        addWord: true,
        addUserInfo: true,
        format: 'png',
        quality: 0.92,
        backgroundColor: '#FFFFFF'
      });
      
      // Calculate render time
      const endTime = performance.now();
      const renderTime = Math.round(endTime - startTime);
      
      // Validate data URL
      if (!result || !result.dataUrl) {
        return {
          success: false,
          stage: 'data-url-generation',
          error: 'Failed to generate data URL',
          renderTime
        };
      }
      
      // Check data URL format
      if (!result.dataUrl.startsWith('data:image/')) {
        return {
          success: false,
          stage: 'data-url-format',
          error: `Invalid data URL format: ${result.dataUrl.substring(0, 30)}...`,
          dataUrlLength: result.dataUrl.length,
          renderTime
        };
      }
      
      // Extract MIME type
      const mimeType = result.dataUrl.split(',')[0].match(/:(.*?);/)?.[1] || '';
      
      // Convert to Blob
      try {
        const blob = dataURLtoBlob(result.dataUrl);
        
        // Return success with diagnostic info
        return {
          success: true,
          stage: 'complete',
          dataUrlLength: result.dataUrl.length,
          mimeType,
          blob,
          blobSize: blob.size,
          blobType: blob.type,
          imageWidth: result.width,
          imageHeight: result.height,
          renderTime,
          // Include a small sample of the data URL for debugging
          dataUrl: result.dataUrl.substring(0, 100) + '...'
        };
      } catch (blobError) {
        return {
          success: false,
          stage: 'blob-conversion',
          error: `Error converting to Blob: ${blobError instanceof Error ? blobError.message : String(blobError)}`,
          dataUrlLength: result.dataUrl.length,
          mimeType,
          renderTime
        };
      }
    } catch (renderError) {
      return {
        success: false,
        stage: 'rendering',
        error: `Error rendering image: ${renderError instanceof Error ? renderError.message : String(renderError)}`,
        renderTime: Math.round(performance.now() - startTime)
      };
    } finally {
      // Clean up
      if (document.body.contains(testElement)) {
        document.body.removeChild(testElement);
      }
    }
  } catch (error) {
    return {
      success: false,
      stage: 'setup',
      error: `Setup error: ${error instanceof Error ? error.message : String(error)}`,
      renderTime: Math.round(performance.now() - startTime)
    };
  }
}

/**
 * Convert a data URL to a Blob
 */
function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

/**
 * Run the test and log the results to the console
 * This is useful for debugging in the browser console
 */
export async function runImageExportTest(): Promise<void> {
  console.log('Running image export test...');
  
  try {
    const result = await testImageExport();
    
    if (result.success) {
      console.log('✅ Image export test successful!');
      console.log(`Render time: ${result.renderTime}ms`);
      console.log(`MIME type: ${result.mimeType}`);
      console.log(`Data URL length: ${result.dataUrlLength}`);
      console.log(`Image dimensions: ${result.imageWidth}x${result.imageHeight}`);
      console.log(`Blob size: ${result.blobSize} bytes`);
    } else {
      console.error(`❌ Image export test failed at stage: ${result.stage}`);
      console.error(`Error: ${result.error}`);
      console.error(`Render time: ${result.renderTime}ms`);
    }
    
    console.log('Full test result:', result);
  } catch (error) {
    console.error('Error running test:', error);
  }
}
