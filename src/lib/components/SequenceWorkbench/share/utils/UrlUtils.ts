/**
 * Utilities for URL handling and sequence URL generation
 */
import type { BeatData } from '$lib/state/stores/sequence/SequenceContainer';
import { browser } from '$app/environment';
import { logger } from '$lib/core/logging';
import { showSuccess } from '$lib/components/shared/ToastManager.svelte';
import { encodeSequenceCompact } from './SequenceEncoder';
import { decodeSequenceCompact } from './SequenceDecoder';

// Import LZString for compression if available
let LZString: any = null;
if (browser) {
    import('lz-string')
        .then((module) => {
            LZString = module.default;
        })
        .catch((err) => {
            console.error('Failed to load LZString', err);
        });
}

/**
 * Generate a compact shareable URL for a sequence
 * @param {BeatData[]} beats - The sequence beats
 * @param {string} _sequenceName - The name of the sequence (unused, kept for API compatibility)
 * @returns {string} The shareable URL
 */
export function generateShareableUrl(beats: BeatData[], _sequenceName: string): string {
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
                logger.warn('LZString compression failed, using uncompressed format', {
                    error: e instanceof Error ? e : new Error(String(e))
                });
            }
        }

        // Create URL with data
        const url = new URL(window.location.href);
        url.searchParams.set('seq', encoded);

        return url.toString();
    } catch (error) {
        logger.error('Failed to generate shareable URL', {
            error: error instanceof Error ? error : new Error(String(error))
        });
        return window.location.href;
    }
}

/**
 * Check for a sequence in the URL and load it if found
 * @param {any} sequenceContainer - The sequence container to load the sequence into
 * @returns {boolean} True if a sequence was found and loaded
 */
export function checkForSequenceInUrl(sequenceContainer: any): boolean {
    if (!browser) return false;

    try {
        // Get the URL parameters
        const url = new URL(window.location.href);
        const seqParam = url.searchParams.get('seq');

        // If no sequence parameter, return false
        if (!seqParam) {
            return false;
        }

        // Try to decode the sequence
        const reconstructedBeats = decodeSequenceCompact(seqParam);

        // If no beats were reconstructed, return false
        if (!reconstructedBeats || reconstructedBeats.length === 0) {
            return false;
        }

        // Load the sequence into the app
        sequenceContainer.setSequence(reconstructedBeats);

        // Show success message
        const moveCount = reconstructedBeats.length - 1; // Subtract start position
        showSuccess(`Loaded sequence with ${moveCount} move${moveCount !== 1 ? 's' : ''}`);

        // Remove the parameter from URL (optional)
        const url2 = new URL(window.location.href);
        url2.searchParams.delete('seq');
        window.history.replaceState({}, '', url2);

        return true;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to reconstruct sequence from URL: ${errorMsg}`);
        return false;
    }
}
