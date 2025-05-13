<!-- src/lib/components/SequenceWorkbench/ShareDownloader.svelte -->
<script lang="ts">
  import { browser } from '$app/environment';
  import { showError, showSuccess } from '$lib/components/shared/ToastManager.svelte';
  import { logger } from '$lib/core/logging';
	import { generateFilename, getLastRenderResult, renderSequence } from './ShareSequenceRenderer';

  // Props
  export let sequenceName: string = '';
  export let contextElement: HTMLElement | null = null;
  export let currentWord: string = '';
  export let onComplete: () => void = () => {};

  // State
  let isDownloading = false;
  let lastDownloadAttemptTime = 0;
  const MIN_DOWNLOAD_INTERVAL_MS = 1000; // Minimum 1 second between download attempts

  /**
   * Download the sequence as an image
   */
  async function downloadSequenceImage(): Promise<void> {
    console.log('ShareDownloader: downloadSequenceImage called');

    // Check if we're already in the process of downloading
    if (isDownloading) {
      console.log('ShareDownloader: Already downloading, returning early');
      showError('Download already in progress, please wait');
      return;
    }

    // Check if we've attempted to download too recently
    const now = Date.now();
    const timeSinceLastAttempt = now - lastDownloadAttemptTime;
    if (timeSinceLastAttempt < MIN_DOWNLOAD_INTERVAL_MS) {
      console.log(`ShareDownloader: Download attempted too soon (${timeSinceLastAttempt}ms since last attempt)`);
      showError('Please wait a moment before downloading again');
      return;
    }

    // Update the last attempt time
    lastDownloadAttemptTime = now;
    isDownloading = true;

    try {
      console.log('ShareDownloader: Rendering sequence for download');
      showSuccess('Preparing image for download...');
      
      // Try to use the last render result first
      let result = getLastRenderResult();
      
      // If no cached result, render the sequence
      if (!result) {
        console.log('ShareDownloader: No cached render result, rendering sequence');
        result = await renderSequence({
          contextElement,
          sequenceName,
          currentWord
        });
      }
      
      if (!result) {
        console.log('ShareDownloader: Failed to render sequence image for download');
        showError('Failed to generate image for download');
        return;
      }
      
      // Generate a filename
      const filename = generateFilename(sequenceName);
      
      console.log(`ShareDownloader: Downloading image as "${filename}"`);

      // Create a download link
      const downloadLink = document.createElement('a');
      downloadLink.href = result.dataUrl;
      downloadLink.download = filename;
      downloadLink.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(downloadLink);
      
      // Use a small timeout to ensure the browser has time to process
      setTimeout(() => {
        try {
          downloadLink.click();
          console.log('ShareDownloader: Download initiated');
          showSuccess('Image download started');
          
          // Remove the download link after a delay
          setTimeout(() => {
            if (document.body.contains(downloadLink)) {
              document.body.removeChild(downloadLink);
            }
          }, 1000);
        } catch (clickError) {
          console.error('ShareDownloader: Error clicking download link:', clickError);
          showError('Download failed. Please try again.');
        }
        
        // Call the onComplete callback
        onComplete();
      }, 100);
    } catch (error) {
      console.error('ShareDownloader: Error in downloadSequenceImage:', error);
      logger.error('Error downloading sequence image', {
        error: error instanceof Error ? error : new Error(String(error))
      });
      showError('Failed to download image. Please try again.');
      
      // Call the onComplete callback
      onComplete();
    } finally {
      // Reset the downloading state after a delay
      setTimeout(() => {
        isDownloading = false;
      }, 1000);
    }
  }

  // Export the download function for external use
  export function download(): Promise<void> {
    return downloadSequenceImage();
  }
</script>
