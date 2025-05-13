/**
 * Utility functions for sharing and downloading sequences
 * This is used by the ShareButton component
 */
import { browser } from '$app/environment';
import { logger } from '$lib/core/logging';
import { showError, showSuccess } from '$lib/components/shared/ToastManager.svelte';
import { 
  shareSequence, 
  shareSequenceWithImage, 
  isWebShareSupported, 
  isFileShareSupported,
  type ShareData
} from '$lib/utils/shareUtils';
import type { SequenceRenderResult } from '$lib/utils/sequenceImageRenderer';

// Track the last time a share API call was made
let lastShareApiCallTime = 0;
const MIN_SHARE_API_INTERVAL_MS = 1500; // Minimum 1.5 seconds between Web Share API calls

// Track the last time a download was attempted
let lastDownloadAttemptTime = 0;
const MIN_DOWNLOAD_INTERVAL_MS = 1000; // Minimum 1 second between download attempts

/**
 * Download a sequence image
 * @param result The rendered image result
 * @param sequenceName The name of the sequence
 * @returns True if the download was successful
 */
export async function downloadSequenceImage(
  result: SequenceRenderResult,
  sequenceName: string
): Promise<boolean> {
  console.log('ShareUtils: downloadSequenceImage called');

  // Check if we've attempted to download too recently
  const now = Date.now();
  const timeSinceLastAttempt = now - lastDownloadAttemptTime;
  if (timeSinceLastAttempt < MIN_DOWNLOAD_INTERVAL_MS) {
    console.log(`ShareUtils: Download attempted too soon (${timeSinceLastAttempt}ms since last attempt)`);
    showError('Please wait a moment before downloading again');
    return false;
  }

  // Update the last attempt time
  lastDownloadAttemptTime = now;

  try {
    // Generate a filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `kinetic-sequence-${sequenceName ? sequenceName.replace(/[^a-z0-9]/gi, '-').toLowerCase() : timestamp}.png`;
    
    console.log(`ShareUtils: Downloading image as "${filename}"`);

    // Create a download link
    const downloadLink = document.createElement('a');
    downloadLink.href = result.dataUrl;
    downloadLink.download = filename;
    downloadLink.style.display = 'none';
    
    // Add to DOM, click, and remove
    document.body.appendChild(downloadLink);
    
    // Use a small timeout to ensure the browser has time to process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      downloadLink.click();
      console.log('ShareUtils: Download initiated');
      showSuccess('Image download started');
      
      // Remove the download link after a delay
      setTimeout(() => {
        if (document.body.contains(downloadLink)) {
          document.body.removeChild(downloadLink);
        }
      }, 1000);
      
      return true;
    } catch (clickError) {
      console.error('ShareUtils: Error clicking download link:', clickError);
      showError('Download failed. Please try again.');
      return false;
    }
  } catch (error) {
    console.error('ShareUtils: Error in downloadSequenceImage:', error);
    logger.error('Error downloading sequence image', {
      error: error instanceof Error ? error : new Error(String(error))
    });
    showError('Failed to download image. Please try again.');
    return false;
  }
}

/**
 * Share a sequence with image
 * @param result The rendered image result
 * @param sequenceName The name of the sequence
 * @param shareUrl The shareable URL
 * @returns True if sharing was successful
 */
export async function shareWithImage(
  result: SequenceRenderResult,
  sequenceName: string,
  shareUrl: string
): Promise<boolean> {
  console.log('ShareUtils: shareWithImage called');

  if (!browser) {
    console.log('ShareUtils: Not in browser environment, returning false');
    return false;
  }

  // Check if Web Share API is supported
  if (!isWebShareSupported()) {
    console.log('ShareUtils: Web Share API not supported');
    showError("Your device doesn't support sharing");
    return false;
  }

  // Check if we've attempted to use the Web Share API too recently
  const now = Date.now();
  const timeSinceLastApiCall = now - lastShareApiCallTime;
  if (timeSinceLastApiCall < MIN_SHARE_API_INTERVAL_MS) {
    console.log(`ShareUtils: Web Share API called too soon (${timeSinceLastApiCall}ms since last attempt)`);
    showError('Please wait a moment before sharing again');
    return false;
  }

  // Update the last API call time
  lastShareApiCallTime = now;

  try {
    // Reset any sharing state before calling navigator.share
    // This is important for desktop browsers where the share dialog might not appear
    // if there's a pending share operation
    
    // Use a small timeout to ensure the browser is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Try to directly share with image using shareSequenceWithImage function
    console.log('ShareUtils: Attempting to share with image');
    const success = await shareSequenceWithImage(result, sequenceName, shareUrl);
    
    if (success) {
      console.log('ShareUtils: Share with image successful');
      return true;
    } else {
      console.log('ShareUtils: Share with image failed or was cancelled, trying without image');
      
      // Fallback to sharing without image
      if (isWebShareSupported()) {
        console.log('ShareUtils: Attempting text-only share');
        
        // Create share data with the image file
        const shareData: ShareData = {
          title: 'Kinetic Constructor Sequence',
          text: `Check out this sequence${sequenceName ? ': ' + sequenceName : ''}\n\nOpen this link to reconstruct: ${shareUrl}`,
          url: shareUrl
        };
        
        // Use a small timeout to ensure the browser is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const textOnlySuccess = await shareSequence(shareData);
        if (textOnlySuccess) {
          console.log('ShareUtils: Text-only share successful');
          return true;
        } else {
          console.log('ShareUtils: Text-only share failed or was cancelled');
          return false;
        }
      } else {
        // This shouldn't happen as we check in the UI, but just in case
        console.log('ShareUtils: Web Share API not supported');
        showError("Your device doesn't support sharing");
        return false;
      }
    }
  } catch (error) {
    // Don't show error for user cancellation
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('ShareUtils: User cancelled sharing');
      return false;
    }
    
    console.error('ShareUtils: Error in shareWithImage:', error);
    logger.error('Error sharing sequence', {
      error: error instanceof Error ? error : new Error(String(error))
    });
    showError('Failed to share sequence. Please try again.');
    return false;
  } finally {
    // Ensure we update the last share time even if there was an error
    lastShareApiCallTime = Date.now();
  }
}
