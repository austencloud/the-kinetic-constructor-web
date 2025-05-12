/**
 * Utilities for sharing sequences and generating shareable URLs
 * Includes ultra-compact sequence encoding for tiny URLs
 */
import type { BeatData } from '$lib/state/stores/sequence/SequenceContainer';
import type { MotionData } from '$lib/components/objects/Motion/MotionData';
import type { MotionType, Loc, PropRotDir, TKATurns, Orientation } from '$lib/types/Types';
import { browser } from '$app/environment';
import { showError, showSuccess } from '$lib/components/shared/ToastManager.svelte';
import { logger } from '$lib/core/logging';
import type { SequenceRenderResult } from './sequenceImageRenderer';

// Import LZString for compression if available
let LZString: any = null;
if (browser) {
  import('lz-string').then(module => {
    LZString = module.default;
  }).catch(err => {
    console.error('Failed to load LZString', err);
  });
}

/**
 * Interface for share data
 */
export interface ShareData {
  title: string;
  text: string;
  url: string;
  files?: File[]; // Support for image files in share data
}

/**
 * Encode a sequence of beats into a super-compact format
 * @param beats The beats to encode
 * @returns A compact string representation
 */
function encodeSequenceCompact(beats: BeatData[]): string {
  if (!beats || beats.length === 0) return '';
  
  // Format: VERSION|BEAT1|BEAT2|... where each BEAT is BLUE:RED
  return "2|" + beats.map(beat => {
    const blue = beat.blueMotionData;
    const red = beat.redMotionData;
    return encodeMotion(blue) + ":" + encodeMotion(red);
  }).join("|");
}

/**
 * Encode a single motion into a compact format
 * @param motion The motion data to encode
 * @returns A compact string representation
 */
function encodeMotion(motion: MotionData | null): string {
  if (!motion) return "_"; // Null motion
  
  // Locations
  const startLoc = motion.startLoc;
  const endLoc = motion.endLoc;
  
  // Rotation direction (c/u)
  const rotDir = motion.propRotDir === "cw" ? "c" : "u";
  
  // Turns - omit if 0, handle fractions cleanly
  let turnStr = "";
  if (motion.turns === "fl") {
    turnStr = "f";
  } else if (motion.turns !== 0) {
    // Convert to string and replace decimal point with 'p'
    turnStr = String(motion.turns).replace(".", "p");
  }
  
  return startLoc + endLoc + rotDir + turnStr;
}

/**
 * Decode a compact sequence string into beat objects
 * @param encoded The encoded sequence string
 * @returns An array of beat objects
 */
function decodeSequenceCompact(encoded: string): BeatData[] {
  if (!encoded) return [];
  
  const parts = encoded.split('|');
  const version = parts[0];
  
  // Version 2 is our ultra-compact format
  if (version === "2") {
    return parts.slice(1).map((beatStr, index) => {
      const [blueStr, redStr] = beatStr.split(':');
      
      // Decode the motions
      const blueMotion = decodeMotion(blueStr, 'blue');
      const redMotion = decodeMotion(redStr, 'red');
      
      // Determine the positions from the motions
      const startPos = inferPosition(blueMotion, redMotion);
      const endPos = inferEndPosition(blueMotion, redMotion);
      
      // Create the beat
      return createBeatFromMotions(blueMotion, redMotion, startPos, endPos, index);
    });
  }
  
  throw new Error(`Unknown sequence format version: ${version}`);
}

/**
 * Decode a compact motion string into a full motion object
 * @param encoded The encoded motion string
 * @param color The color of the motion (blue/red)
 * @returns A motion data object
 */
function decodeMotion(encoded: string, color: 'blue' | 'red'): MotionData | null {
  if (encoded === "_") return null;
  
  // Extract components
  const startLoc = encoded.charAt(0) as Loc;
  const endLoc = encoded.charAt(1) as Loc;
  const rotDir = encoded.charAt(2) === 'c' ? 'cw' : 'ccw' as PropRotDir;
  
  // Handle turns - could be empty (0), 'f' (fl), or a number with 'p' as decimal
  let turns: TKATurns = 0;
  if (encoded.length > 3) {
    const turnStr = encoded.substring(3);
    if (turnStr === 'f') {
      turns = 'fl';
    } else {
      // Replace 'p' with '.' and convert to number
      turns = parseFloat(turnStr.replace('p', '.')) as TKATurns;
    }
  }
  
  // Infer motion type from the other data
  const motionType = inferMotionType(startLoc, endLoc, rotDir) as MotionType;
  
  // Infer orientations based on common patterns
  const { startOri, endOri } = inferOrientations(startLoc, endLoc, motionType);
  
  // Create the motion object
  return {
    id: `motion-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    color,
    motionType,
    startLoc,
    endLoc,
    startOri,
    endOri,
    propRotDir: rotDir,
    turns,
    // Default values for other fields
    handRotDir: rotDir === 'cw' ? 'cw_shift' : 'ccw_shift',
    leadState: 'leading',
    prefloatMotionType: null,
    prefloatPropRotDir: null
  };
}

/**
 * Infer the motion type based on the motion properties
 */
function inferMotionType(startLoc: Loc, endLoc: Loc, rotDir: PropRotDir): string {
  // Static if same location
  if (startLoc === endLoc) return 'static';
  
  // Simple heuristic for pro/anti based on common patterns
  // This is a simplified approach - you might need to adjust based on your exact rules
  const oppositePairs: Record<string, string> = {
    'n': 's', 's': 'n', 'e': 'w', 'w': 'e',
    'ne': 'sw', 'sw': 'ne', 'nw': 'se', 'se': 'nw',
    '1': '3', '3': '1', '2': '4', '4': '2' // If using numeric representations
  };
  
  // If ending at the opposite position, it's likely pro or anti
  if (oppositePairs[startLoc] === endLoc) {
    // For typical diagonal-to-diagonal or cardinal-to-cardinal, cw is often pro
    return rotDir === 'cw' ? 'pro' : 'anti';
  }
  
  // For adjacent movements (e.g., n to e)
  // This is harder to infer automatically - might need better heuristics
  const isCrossing = (startLoc === 'n' || startLoc === 's') && (endLoc === 'e' || endLoc === 'w');
  if (isCrossing) {
    return rotDir === 'cw' ? 'pro' : 'anti';
  }
  
  // Default to anti for most moves for safety
  return 'anti';
}

/**
 * Infer orientations based on locations and motion type
 */
function inferOrientations(startLoc: Loc, endLoc: Loc, motionType: string): { startOri: Orientation, endOri: Orientation } {
  // Default to 'in' for both as a safe fallback
  const defaults = { startOri: 'in' as Orientation, endOri: 'in' as Orientation };
  
  // Cardinal positions (n,s,e,w) often start and end with 'in' orientation
  const cardinals = ['n', 's', 'e', 'w'];
  if (cardinals.includes(startLoc) && cardinals.includes(endLoc)) {
    return defaults;
  }
  
  // For diagonal positions, the pattern depends on the motion type
  const diagonals = ['ne', 'se', 'sw', 'nw', '1', '2', '3', '4'];
  if (diagonals.includes(startLoc) || diagonals.includes(endLoc)) {
    if (motionType === 'pro') {
      return { startOri: 'in' as Orientation, endOri: 'in' as Orientation };
    } else if (motionType === 'anti') {
      return { startOri: 'out' as Orientation, endOri: 'out' as Orientation };
    }
  }
  
  return defaults;
}

/**
 * Infer a TKA position from motions
 */
function inferPosition(blueMotion: MotionData | null, redMotion: MotionData | null): string {
  // If we have actual motions, use their locations
  if (blueMotion && redMotion) {
    // Common positions based on blue/red start locations
    const positionMap: Record<string, Record<string, string>> = {
      'n': { 'n': 'alpha1' },
      's': { 's': 'alpha5' },
      'e': { 'e': 'beta1' },
      'w': { 'w': 'beta5' },
      'ne': { 'ne': 'gamma1' },
      'se': { 'se': 'gamma5' },
      'sw': { 'sw': 'gamma9' },
      'nw': { 'nw': 'gamma13' }
    };
    
    // If we have a known mapping, use it
    if (positionMap[blueMotion.startLoc]?.[redMotion.startLoc]) {
      return positionMap[blueMotion.startLoc][redMotion.startLoc];
    }
    
    // Fallback - construct a generic position
    return `beta${Math.floor(Math.random() * 8) + 1}`;
  }
  
  // Default
  return 'alpha1';
}

/**
 * Infer the end position from motions
 */
function inferEndPosition(blueMotion: MotionData | null, redMotion: MotionData | null): string {
  // Similar to inferPosition but using end locations
  if (blueMotion && redMotion) {
    const positionMap: Record<string, Record<string, string>> = {
      'n': { 'n': 'alpha1' },
      's': { 's': 'alpha5' },
      'e': { 'e': 'beta1' },
      'w': { 'w': 'beta5' },
      'ne': { 'ne': 'gamma1' },
      'se': { 'se': 'gamma5' },
      'sw': { 'sw': 'gamma9' },
      'nw': { 'nw': 'gamma13' }
    };
    
    if (positionMap[blueMotion.endLoc]?.[redMotion.endLoc]) {
      return positionMap[blueMotion.endLoc][redMotion.endLoc];
    }
    
    return `beta${Math.floor(Math.random() * 8) + 1}`;
  }
  
  return 'alpha1';
}

/**
 * Create a beat object from motion data
 */
function createBeatFromMotions(
  blueMotion: MotionData | null, 
  redMotion: MotionData | null,
  startPos: string,
  endPos: string,
  index: number
): BeatData {
  // Generate a unique ID
  const id = `beat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${index}`;
  
  // Infer letter from motion patterns (simplified)
  const letter = inferLetter(blueMotion, redMotion);
  
  return {
    id,
    number: index + 1,
    letter,
    position: startPos,
    orientation: '',
    turnsTuple: '',
    redPropData: null,
    bluePropData: null,
    redArrowData: null,
    blueArrowData: null,
    redMotionData: redMotion,
    blueMotionData: blueMotion,
    metadata: {
      letter,
      startPos,
      endPos
    }
  };
}

/**
 * Infer a letter from motion patterns
 */
function inferLetter(blueMotion: MotionData | null, redMotion: MotionData | null): string {
  if (!blueMotion || !redMotion) return '';
  
  // This is a very simplified approach - you could add more sophisticated pattern matching
  // based on your letter definitions
  
  // Check for common patterns
  if (blueMotion.startLoc === 's' && blueMotion.endLoc === 'w' && 
      redMotion.startLoc === 's' && redMotion.endLoc === 'w') {
    return 'I';
  }
  
  if (blueMotion.startLoc === 'w' && blueMotion.endLoc === 'n' &&
      redMotion.startLoc === 'w' && redMotion.endLoc === 's') {
    return 'F';
  }
  
  // Default - use empty string and let the UI determine the letter
  return '';
}

/**
 * Check if Web Share API is supported
 * @returns {boolean} True if Web Share API is supported
 */
export function isWebShareSupported(): boolean {
  return browser && 'share' in navigator && typeof navigator.share === 'function';
}

/**
 * Check if Web Share API with files is supported
 * @returns {boolean} True if Web Share API with files is supported
 */
export function isFileShareSupported(): boolean {
  if (!browser) return false;
  return isWebShareSupported() && 'canShare' in navigator && navigator.canShare({ files: [] });
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
 * Generate a compact shareable URL for a sequence
 * @param {BeatData[]} beats - The sequence beats
 * @param {string} sequenceName - The name of the sequence
 * @returns {string} The shareable URL
 */
export function generateShareableUrl(beats: BeatData[], sequenceName: string): string {
  if (!browser) return '';
  
  try {
    // Generate compact format
    const compact = encodeSequenceCompact(beats);
    
    // Try to compress with LZString if available
    let encoded = compact;
    if (LZString) {
      try {
        const compressed = LZString.compressToEncodedURIComponent(compact);
        if (compressed && compressed.length < compact.length) {
          encoded = compressed;
        }
      } catch (e) {
        logger.warn('LZString compression failed, using uncompressed format', { error: e instanceof Error ? e : new Error(String(e)) });
      }
    }
    
    // Create URL with data
    const url = new URL(window.location.href);
    url.searchParams.set('seq', encoded);
    
    return url.toString();
  } catch (error) {
    logger.error('Failed to generate shareable URL', { error: error instanceof Error ? error : new Error(String(error)) });
    return window.location.href;
  }
}

/**
 * Check for a sequence in the URL and reconstruct it if found
 * @param sequenceContainer The sequence container to update
 * @returns True if a sequence was found and reconstructed
 */
export function checkForSequenceInUrl(sequenceContainer: any): boolean {
  if (!browser) return false;
  
  const params = new URLSearchParams(window.location.search);
  const seqParam = params.get('seq');
  
  if (seqParam) {
    try {
      let sequenceData: string;
      
      // Try to decompress with LZString if available
      if (LZString) {
        try {
          sequenceData = LZString.decompressFromEncodedURIComponent(seqParam);
          if (!sequenceData) {
            // If decompression returns null, it might not be compressed
            sequenceData = seqParam;
          }
        } catch (e) {
          // If decompression fails, use raw parameter
          sequenceData = seqParam;
        }
      } else {
        // No LZString, assume it's not compressed
        sequenceData = seqParam;
      }
      
      // Decode the sequence
      const reconstructedBeats = decodeSequenceCompact(sequenceData);
      
      if (reconstructedBeats.length === 0) {
        throw new Error('No beats found in sequence data');
      }
      
      // Load the sequence into the app
      sequenceContainer.setSequence(reconstructedBeats);
      
      // Show success message
      showSuccess(`Loaded sequence with ${reconstructedBeats.length} beats`);
      
      // Remove the parameter from URL (optional)
      const url = new URL(window.location.href);
      url.searchParams.delete('seq');
      window.history.replaceState({}, '', url);
      
      logger.info(`Reconstructed sequence from URL with ${reconstructedBeats.length} beats`);
      
      return true;
    } catch (error) {
      logger.error('Failed to reconstruct sequence from URL', { error: error instanceof Error ? error : new Error(String(error)) });
      showError('Failed to load sequence from URL');
    }
  }
  return false;
}

/**
 * Convert a data URL to a Blob
 * @param {string} dataUrl - The data URL to convert
 * @returns {Blob} The converted Blob
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
 * Share a sequence image with a reconstruction URL
 * @param {SequenceRenderResult} imageResult - The rendered image result
 * @param {string} sequenceName - The name of the sequence
 * @param {string} shareUrl - The shareable URL
 * @returns {Promise<boolean>} True if sharing was successful
 */
export async function shareSequenceWithImage(
  imageResult: SequenceRenderResult,
  sequenceName: string,
  shareUrl: string
): Promise<boolean> {
  if (!isFileShareSupported()) {
    logger.warn('File sharing not supported on this device');
    showError('Your device doesn\'t support sharing images');
    return false;
  }
  
  try {
    // Convert the data URL to a Blob
    const blob = dataURLtoBlob(imageResult.dataUrl);
    
    // Create a File from the Blob
    const file = new File([blob], `${sequenceName}.png`, { type: 'image/png' });
    
    // Create share data with the image file
    const shareData: ShareData = {
      title: 'Kinetic Constructor Sequence',
      text: `Check out this sequence: ${sequenceName}\n\nOpen this link to reconstruct: ${shareUrl}`,
      url: shareUrl,
      files: [file]
    };
    
    // Check if the device can share this content
    if (!navigator.canShare(shareData)) {
      logger.warn('Device cannot share this content');
      showError('Your device doesn\'t support sharing this type of content');
      return false;
    }
    
    // Share the content
    await navigator.share(shareData);
    logger.info('Sequence shared successfully with image');
    showSuccess('Sequence shared successfully with image');
    return true;
  } catch (error) {
    // Don't show error for user cancellation
    if (error instanceof Error && error.name === 'AbortError') {
      logger.info('User cancelled sharing');
      return false;
    }
    
    logger.error('Error sharing sequence with image', { error: error instanceof Error ? error : new Error(String(error)) });
    showError('Failed to share sequence with image');
    return false;
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
    
    logger.error('Error sharing sequence', { error: error instanceof Error ? error : new Error(String(error)) });
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
    logger.error('Failed to copy to clipboard', { error: error instanceof Error ? error : new Error(String(error)) });
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