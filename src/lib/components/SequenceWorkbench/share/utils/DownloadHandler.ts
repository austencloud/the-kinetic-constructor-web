/**
 * Download Handler
 * 
 * This module provides functionality for downloading sequence images.
 */

import { browser } from '$app/environment';
import { logger } from '$lib/core/logging';
import { showError, showSuccess } from '$lib/components/shared/ToastManager.svelte';
import { downloadImage } from '$lib/components/Pictograph/export/downloadUtils';
import { fileSystemService } from '$lib/services/FileSystemService';
import { getImageExportSettings } from '$lib/state/image-export-settings.svelte';
import type { SequenceRenderResult } from './ImageUtils';

/**
 * Options for downloading a sequence image
 */
export interface DownloadOptions {
  sequenceName: string;
  imageResult: SequenceRenderResult;
}

/**
 * Download a sequence image
 * 
 * @param options Download options
 * @returns Promise resolving to true if download was successful
 */
export async function downloadSequenceImage(options: DownloadOptions): Promise<boolean> {
  const { sequenceName, imageResult } = options;

  if (!browser) {
    console.log('DownloadHandler: Not in browser environment, returning false');
    return false;
  }

  try {
    console.log('DownloadHandler: Starting download process');

    // Get export settings
    let settings: any = {};
    try {
      // Get settings directly using new function
      settings = getImageExportSettings();
      console.log('DownloadHandler: Using settings from getImageExportSettings()', settings);
    } catch (error) {
      console.error('DownloadHandler: Error getting export settings from function', error);

      // Fall back to localStorage if function fails
      try {
        // Get settings from localStorage as fallback
        const savedSettings = localStorage.getItem('image-export-settings');
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            if (parsed && typeof parsed === 'object') {
              settings = parsed;
              console.log('DownloadHandler: Using settings from localStorage', settings);
            }
          } catch (parseError) {
            console.error('DownloadHandler: Failed to parse settings from localStorage', parseError);
          }
        }
      } catch (localStorageError) {
        console.error(
          'DownloadHandler: Error getting export settings from localStorage',
          localStorageError
        );
        // Use empty object, which will fall back to defaults
        settings = {};
      }
    }

    // Get the exact sequence word from the UI
    const exactWordName = sequenceName || 'Sequence';

    // Log the exact word being used
    console.log('DownloadHandler: Using exact sequence word:', exactWordName);

    // Create a safe version of the word for the filename
    // This is only for the default filename, the word folder will use the exact word
    const safeSequenceName = exactWordName.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    // Create a basic filename (will be replaced with versioned name if versioning is enabled)
    const filename = `${exactWordName}.png`;

    // Get category from settings (metadata doesn't have category yet)
    const category = settings.defaultCategory || 'Sequences';

    console.log('DownloadHandler: Saving sequence:', {
      wordName: exactWordName,
      dataUrlLength: imageResult.dataUrl.length,
      category
    });

    // Use the FileSystemService to save the file with enhanced options
    const saveResult = await fileSystemService.saveFile(imageResult.dataUrl, {
      fileName: filename,
      fileType: 'image/png',
      rememberDirectory:
        settings.rememberLastSaveDirectory === undefined
          ? true
          : !!settings.rememberLastSaveDirectory,
      useCategories: settings.useCategories === undefined ? true : !!settings.useCategories,
      category: category,
      wordName: exactWordName,
      useVersioning: true // Enable intelligent versioning
    });

    if (saveResult.success) {
      // Show success message with the file path
      const message = saveResult.filePath
        ? `Image saved to: ${saveResult.filePath}`
        : 'Image saved successfully';

      showSuccess(message);
      console.log('DownloadHandler: File saved successfully:', saveResult);
      return true;
    } else {
      // Only show error if it wasn't a user cancellation
      if (saveResult.error && saveResult.error.message !== 'Operation cancelled by user') {
        console.error('DownloadHandler: Save error:', saveResult.error);
        showError(`Failed to save image: ${saveResult.error.message}`);

        // Fall back to the old download method if the FileSystemService fails
        try {
          console.log('DownloadHandler: Falling back to old download method');

          // Download the image with improved error handling
          const success = await downloadImage({
            dataUrl: imageResult.dataUrl,
            filename
          });

          if (success) {
            showSuccess('Image download started');
            console.log('DownloadHandler: Download initiated successfully');
            return true;
          } else {
            throw new Error('Download function returned false');
          }
        } catch (downloadError) {
          console.error('DownloadHandler: Download error:', downloadError);
          showError('Failed to download sequence. Please try again.');
          return false;
        }
      } else {
        console.log('DownloadHandler: User cancelled save operation');
        return false;
      }
    }
  } catch (error) {
    showError('Failed to download sequence');
    console.error('DownloadHandler: Download error:', error);
    logger.error('Error downloading sequence', {
      error: error instanceof Error ? error : new Error(String(error))
    });
    return false;
  }
}
