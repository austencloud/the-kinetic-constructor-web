/**
 * Utilities for sharing sequences and generating shareable URLs
 */
import type { BeatData } from '$lib/state/stores/sequence/SequenceContainer';
import { browser } from '$app/environment';
import { showError, showSuccess } from '$lib/components/shared/ToastManager.svelte';
import { logger } from '$lib/core/logging';

/**
 * Interface for share data
 */
export interface ShareData {
  title: string;
  text: string;
  url: string;
}

/**
 * Check if Web Share API is supported
 * @returns {boolean} True if Web Share API is supported
 */
export function isWebShareSupported(): boolean {
  return browser && 'share' in navigator && typeof navigator.share === 'function';
}

/**
 * Check if the device is mobile
 * @returns {boolean} True if the device is mobile
 */
export function isMobileDevice(): boolean {
  if (!browser) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Generate a shareable URL for a sequence
 * @param {BeatData[]} beats - The sequence beats
 * @param {string} sequenceName - The name of the sequence
 * @returns {string} The shareable URL
 */
export function generateShareableUrl(beats: BeatData[], sequenceName: string): string {
  if (!browser) return '';
  
  try {
    // Create a simplified representation of the sequence for the URL
    const sequenceData = {
      name: sequenceName,
      beatCount: beats.length,
      startPosition: beats.length > 0 && beats[0].metadata?.startPos ? beats[0].metadata.startPos : null,
      // Add any other relevant metadata that should be included in the URL
    };
    
    // Encode the data as a base64 string to keep the URL manageable
    const encodedData = btoa(JSON.stringify(sequenceData));
    
    // Create the URL with the encoded data
    const url = new URL(window.location.href);
    url.searchParams.set('sequence', encodedData);
    
    return url.toString();
  } catch (error) {
    logger.error('Failed to generate shareable URL', { error });
    return window.location.href;
  }
}

/**
 * Share a sequence using the Web Share API
 * @param {ShareData} shareData - The data to share
 * @returns {Promise<boolean>} True if sharing was successful
 */
export async function shareSequence(shareData: ShareData): Promise<boolean> {
  if (!isWebShareSupported()) {
    logger.warn('Web Share API not supported');
    return false;
  }
  
  try {
    await navigator.share(shareData);
    logger.info('Sequence shared successfully');
    showSuccess('Sequence shared successfully');
    return true;
  } catch (error) {
    // Don't show error for user cancellation
    if (error instanceof Error && error.name === 'AbortError') {
      logger.info('User cancelled sharing');
      return false;
    }
    
    logger.error('Error sharing sequence', { error });
    showError('Failed to share sequence');
    return false;
  }
}

/**
 * Copy a URL to the clipboard
 * @param {string} url - The URL to copy
 * @returns {Promise<boolean>} True if copying was successful
 */
export async function copyToClipboard(url: string): Promise<boolean> {
  if (!browser) return false;
  
  try {
    await navigator.clipboard.writeText(url);
    showSuccess('Link copied to clipboard');
    return true;
  } catch (error) {
    logger.error('Failed to copy to clipboard', { error });
    showError('Failed to copy link to clipboard');
    return false;
  }
}

/**
 * Send an email with sequence information
 * @param {string} sequenceName - The name of the sequence
 * @param {string} url - The shareable URL
 */
export function shareViaEmail(sequenceName: string, url: string): void {
  if (!browser) return;
  
  const subject = encodeURIComponent(`Kinetic Constructor Sequence: ${sequenceName}`);
  const body = encodeURIComponent(`Check out this Kinetic Constructor sequence: ${sequenceName}\n\n${url}`);
  
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}
