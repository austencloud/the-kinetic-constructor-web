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
	import('lz-string')
		.then((module) => {
			LZString = module.default;
		})
		.catch((err) => {
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

	// Extract start position info from first beat if available
	const startPosData = extractStartPositionData(beats);

	// Format: VERSION|START_POS_DATA|BEAT1|BEAT2|...
	// where START_POS_DATA is BLUE_LOC,RED_LOC,BLUE_ORI,RED_ORI
	// and each BEAT is BLUE:RED

	const startPosStr = encodeStartPosition(startPosData);

	return (
		'3|' +
		startPosStr +
		'|' +
		beats
			.map((beat) => {
				const blue = beat.blueMotionData;
				const red = beat.redMotionData;
				return encodeMotion(blue) + ':' + encodeMotion(red);
			})
			.join('|')
	);
}

/**
 * Extract start position data from beats or metadata
 */
function extractStartPositionData(beats: BeatData[]): any {
	// Look for start position in metadata or first beat
	let startPosData: any = {
		bluePos: 's', // Default start positions
		redPos: 's',
		blueOri: 'in', // Default orientations
		redOri: 'in'
	};

	// Check if first beat contains start position info
	if (beats && beats.length > 0) {
		const firstBeat = beats[0];

		// Look for start position in various places
		if (firstBeat.metadata?.startPos) {
			// If we have explicit start position in metadata
			startPosData.position = firstBeat.metadata.startPos;
		}

		// Look for blue/red positions and orientations
		if (firstBeat.blueMotionData) {
			startPosData.bluePos = firstBeat.blueMotionData.startLoc || 's';
			startPosData.blueOri = firstBeat.blueMotionData.startOri || 'in';
		}

		if (firstBeat.redMotionData) {
			startPosData.redPos = firstBeat.redMotionData.startLoc || 's';
			startPosData.redOri = firstBeat.redMotionData.startOri || 'in';
		}
	}

	return startPosData;
}

/**
 * Encode start position data
 */
function encodeStartPosition(startPosData: any): string {
	// Format: BLUE_LOC,RED_LOC,BLUE_ORI,RED_ORI

	// Encode locations
	const bluePos = startPosData.bluePos || 's';
	const redPos = startPosData.redPos || 's';

	// Encode orientations - compact single-char versions
	const blueOri = encodeOrientation(startPosData.blueOri || 'in');
	const redOri = encodeOrientation(startPosData.redOri || 'in');

	// Encode start position if available (use first char of greek letter + number)
	let positionStr = '';
	if (startPosData.position) {
		positionStr = ',' + encodePosition(startPosData.position);
	}

	return `${bluePos},${redPos},${blueOri},${redOri}${positionStr}`;
}

/**
 * Encode an orientation to a single character
 */
function encodeOrientation(ori: string): string {
	const oriMap: Record<string, string> = {
		in: 'i',
		out: 'o',
		clock: 'c',
		counter: 'u'
	};

	return oriMap[ori] || 'i'; // Default to 'i' for 'in'
}

/**
 * Decode a single character to an orientation
 */
function decodeOrientation(encoded: string): string {
	const oriMap: Record<string, string> = {
		i: 'in',
		o: 'out',
		c: 'clock',
		u: 'counter'
	};

	return oriMap[encoded] || 'in';
}

/**
 * Encode a position (e.g., "alpha5" -> "a5")
 */
function encodePosition(pos: string): string {
	if (!pos) return '';
	// "alpha5" -> "a5"
	return pos.charAt(0) + pos.substring(pos.search(/\d/));
}

/**
 * Decode a position (e.g., "a5" -> "alpha5")
 */
function decodePosition(pos: string): string {
	if (!pos) return '';

	// Check if it's already a full position
	if (pos.startsWith('alpha') || pos.startsWith('beta') || pos.startsWith('gamma')) {
		return pos;
	}

	// Decode the first character to the full greek letter
	const posMap: Record<string, string> = {
		a: 'alpha',
		b: 'beta',
		g: 'gamma'
	};

	const greek = posMap[pos.charAt(0)] || 'beta';
	const num = pos.substring(1);

	return `${greek}${num}`;
}

/**
 * Encode a single motion into a compact format
 * @param motion The motion data to encode
 * @returns A compact string representation
 */
function encodeMotion(motion: MotionData | null): string {
	if (!motion) return '_'; // Null motion

	// Locations
	const startLoc = motion.startLoc;
	const endLoc = motion.endLoc;

	// Rotation direction (c/u)
	const rotDir = motion.propRotDir === 'cw' ? 'c' : 'u';

	// Turns - omit if 0, handle fractions cleanly
	let turnStr = '';
	if (motion.turns === 'fl') {
		turnStr = 'f';
	} else if (motion.turns !== 0) {
		// Convert to string and replace decimal point with 'p'
		turnStr = String(motion.turns).replace('.', 'p');
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

	// Version 3 is our format with start position
	if (version === '3') {
		// Parse start position data
		const startPosStr = parts[1];
		const startPosData = decodeStartPosition(startPosStr);

		// Parse beat data
		const beatData = parts.slice(2).map((beatStr, index) => {
			const [blueStr, redStr] = beatStr.split(':');

			// Decode the motions
			const blueMotion = decodeMotion(blueStr, 'blue', startPosData.blueOri);
			const redMotion = decodeMotion(redStr, 'red', startPosData.redOri);

			// Determine the positions from the motions or start position
			const startPos = index === 0 ? startPosData.position : inferPosition(blueMotion, redMotion);
			const endPos = inferEndPosition(blueMotion, redMotion);

			// Create the beat
			return createBeatFromMotions(blueMotion, redMotion, startPos, endPos, index + 1); // +1 to skip the start position
		});

		// Create start position beat if we have valid data
		const startPosBeat = createStartPositionBeat(startPosData);

		// Return the beats with the start position as the first beat
		return [startPosBeat, ...beatData];
	}

	// Version 2 is our previous ultra-compact format (without start position)
	if (version === '2') {
		return parts.slice(1).map((beatStr, index) => {
			const [blueStr, redStr] = beatStr.split(':');

			// Decode the motions
			const blueMotion = decodeMotion(blueStr, 'blue', 'in');
			const redMotion = decodeMotion(redStr, 'red', 'in');

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
 * Decode start position data
 */
function decodeStartPosition(encoded: string): any {
	const parts = encoded.split(',');

	// Handle the basic 4-part format: BLUE_LOC,RED_LOC,BLUE_ORI,RED_ORI
	const startPosData: any = {
		bluePos: parts[0] || 's',
		redPos: parts[1] || 's',
		blueOri: decodeOrientation(parts[2] || 'i'),
		redOri: decodeOrientation(parts[3] || 'i')
	};

	// If we have a 5th part, it's the position name
	if (parts.length > 4) {
		startPosData.position = decodePosition(parts[4]);
	} else {
		// Infer position from blue/red locations
		startPosData.position = inferPositionFromLocations(startPosData.bluePos, startPosData.redPos);
	}

	return startPosData;
}

/**
 * Infer a position name from blue/red locations
 */
function inferPositionFromLocations(blueLoc: string, redLoc: string): string {
	// Common positions based on blue/red locations
	const positionMap: Record<string, Record<string, string>> = {
		n: { n: 'alpha1' },
		s: { s: 'alpha5' },
		e: { e: 'beta1' },
		w: { w: 'beta5' },
		ne: { ne: 'gamma1' },
		se: { se: 'gamma5' },
		sw: { sw: 'gamma9' },
		nw: { nw: 'gamma13' }
	};

	// If we have a known mapping, use it
	if (positionMap[blueLoc]?.[redLoc]) {
		return positionMap[blueLoc][redLoc];
	}

	// Fallback - construct a generic position
	return `beta${Math.floor(Math.random() * 8) + 1}`;
}

/**
 * Create a start position beat
 */
function createStartPositionBeat(startPosData: any): BeatData {
	// Generate a unique ID
	const id = `beat-start-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

	// Create blue motion data for start position
	const blueMotionData: Partial<MotionData> = {
		id: `motion-start-blue-${Date.now()}`,
		color: 'blue',
		motionType: 'static',
		startLoc: startPosData.bluePos as Loc,
		endLoc: startPosData.bluePos as Loc,
		startOri: startPosData.blueOri as Orientation,
		endOri: startPosData.blueOri as Orientation,
		propRotDir: 'no_rot',
		turns: 0,
		handRotDir: 'static',
		leadState: 'leading',
		prefloatMotionType: null,
		prefloatPropRotDir: null
	};

	// Create red motion data for start position
	const redMotionData: Partial<MotionData> = {
		id: `motion-start-red-${Date.now()}`,
		color: 'red',
		motionType: 'static',
		startLoc: startPosData.redPos as Loc,
		endLoc: startPosData.redPos as Loc,
		startOri: startPosData.redOri as Orientation,
		endOri: startPosData.redOri as Orientation,
		propRotDir: 'no_rot',
		turns: 0,
		handRotDir: 'static',
		leadState: 'leading',
		prefloatMotionType: null,
		prefloatPropRotDir: null
	};

	return {
		id,
		number: 0, // Start position is always beat 0
		letter: '',
		position: startPosData.position,
		orientation: '',
		turnsTuple: '',
		redPropData: null,
		bluePropData: null,
		redArrowData: null,
		blueArrowData: null,
		redMotionData: redMotionData as MotionData,
		blueMotionData: blueMotionData as MotionData,
		metadata: {
			isStartPosition: true,
			startPos: startPosData.position,
			endPos: startPosData.position
		}
	};
}

/**
 * Decode a compact motion string into a full motion object
 * @param encoded The encoded motion string
 * @param color The color of the motion (blue/red)
 * @param defaultOri Default orientation to use if not inferred
 * @returns A motion data object
 */
function decodeMotion(
	encoded: string,
	color: 'blue' | 'red',
	defaultOri: string = 'in'
): MotionData | null {
	if (encoded === '_') return null;

	// Extract components
	const startLoc = encoded.charAt(0) as Loc;
	const endLoc = encoded.charAt(1) as Loc;
	const rotDir = encoded.charAt(2) === 'c' ? 'cw' : ('ccw' as PropRotDir);

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
	const { startOri, endOri } = inferOrientations(startLoc, endLoc, motionType, defaultOri);

	// Create the motion object
	return {
		id: `motion-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
		color,
		motionType,
		startLoc,
		endLoc,
		startOri: startOri as Orientation,
		endOri: endOri as Orientation,
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
		n: 's',
		s: 'n',
		e: 'w',
		w: 'e',
		ne: 'sw',
		sw: 'ne',
		nw: 'se',
		se: 'nw'
	};

	// If ending at the opposite position, it's definitely a dash
	if (oppositePairs[startLoc] === endLoc) {
		return 'dash';
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
function inferOrientations(
	startLoc: Loc,
	endLoc: Loc,
	motionType: string,
	defaultOri: string = 'in'
): { startOri: string; endOri: string } {
	// Use the provided default orientation
	const defaults = { startOri: defaultOri, endOri: defaultOri };

	// Cardinal positions (n,s,e,w) often start and end with 'in' orientation
	const cardinals = ['n', 's', 'e', 'w'];
	if (cardinals.includes(startLoc) && cardinals.includes(endLoc)) {
		return defaults;
	}

	// For diagonal positions, the pattern depends on the motion type
	const diagonals = ['ne', 'se', 'sw', 'nw', '1', '2', '3', '4'];
	if (diagonals.includes(startLoc) || diagonals.includes(endLoc)) {
		if (motionType === 'pro') {
			return { startOri: 'in', endOri: 'in' };
		} else if (motionType === 'anti') {
			return { startOri: 'out', endOri: 'out' };
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
		return inferPositionFromLocations(blueMotion.startLoc, redMotion.startLoc);
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
		return inferPositionFromLocations(blueMotion.endLoc, redMotion.endLoc);
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
		number: index,
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
	if (
		blueMotion.startLoc === 's' &&
		blueMotion.endLoc === 'w' &&
		redMotion.startLoc === 's' &&
		redMotion.endLoc === 'w'
	) {
		return 'I';
	}

	if (
		blueMotion.startLoc === 'w' &&
		blueMotion.endLoc === 'n' &&
		redMotion.startLoc === 'w' &&
		redMotion.endLoc === 's'
	) {
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
	if (!browser) {
		return false;
	}

	try {
		// Basic check for Web Share API support
		const hasShareAPI = 'share' in navigator && typeof navigator.share === 'function';

		// Additional check for mobile devices where sharing is most commonly supported
		const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent
		);

		// Log detailed information for debugging
		console.log('shareUtils: Web Share API check:', {
			hasShareAPI,
			isMobile,
			userAgent: navigator.userAgent
		});

		return hasShareAPI;
	} catch (error) {
		console.warn('shareUtils: Error checking Web Share API support:', error);
		return false;
	}
}

/**
 * Check if Web Share API with files is supported
 * @returns {boolean} True if Web Share API with files is supported
 */
export function isFileShareSupported(): boolean {
	if (!browser) {
		return false;
	}

	try {
		// First check if basic Web Share API is supported
		if (!isWebShareSupported()) {
			return false;
		}

		// Then check if canShare method exists
		if (!('canShare' in navigator && typeof navigator.canShare === 'function')) {
			return false;
		}

		// Create a dummy file for testing
		const dummyFile = new File(['test'], 'test.png', { type: 'image/png' });

		// Check if the browser can share files
		const canShareFiles = navigator.canShare({ files: [dummyFile] });

		// Log result for debugging
		console.log('shareUtils: File sharing support check:', {
			canShareFiles,
			userAgent: navigator.userAgent
		});

		return canShareFiles;
	} catch (error) {
		// If any error occurs, assume file sharing is not supported
		console.warn('shareUtils: File sharing check failed:', error);
		return false;
	}
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
			logger.info(`Found sequence parameter in URL (length: ${seqParam.length})`);
			let sequenceData: string;

			// Try to decompress with LZString if available
			if (LZString) {
				try {
					logger.debug('Attempting to decompress sequence data with LZString');
					sequenceData = LZString.decompressFromEncodedURIComponent(seqParam);
					if (!sequenceData) {
						// If decompression returns null, it might not be compressed
						logger.debug('LZString decompression returned null, using raw parameter');
						sequenceData = seqParam;
					} else {
						logger.debug(
							`Successfully decompressed sequence data (${seqParam.length} → ${sequenceData.length})`
						);
					}
				} catch (e) {
					// If decompression fails, use raw parameter
					logger.warn('LZString decompression failed, using raw parameter');
					sequenceData = seqParam;
				}
			} else {
				// No LZString, assume it's not compressed
				logger.debug('LZString not available, using raw parameter');
				sequenceData = seqParam;
			}

			// Validate the sequence data format before decoding
			if (!validateSequenceFormat(sequenceData)) {
				throw new Error('Invalid sequence format');
			}

			// Decode the sequence
			const reconstructedBeats = decodeSequenceCompact(sequenceData);

			if (reconstructedBeats.length === 0) {
				throw new Error('No beats found in sequence data');
			}

			// Log detailed information about the reconstructed sequence
			const hasStartPos = reconstructedBeats[0]?.metadata?.isStartPosition === true;
			const seqVersion = sequenceData.split('|')[0];
			logger.info(
				`Successfully decoded sequence from URL: ${reconstructedBeats.length} beats, version ${seqVersion}, ${hasStartPos ? 'has' : 'no'} start position`
			);

			// Load the sequence into the app
			sequenceContainer.setSequence(reconstructedBeats);

			// Show success message
			const moveCount = reconstructedBeats.length - 1; // Subtract start position
			showSuccess(`Loaded sequence with ${moveCount} move${moveCount !== 1 ? 's' : ''}`);

			// Remove the parameter from URL (optional)
			const url = new URL(window.location.href);
			url.searchParams.delete('seq');
			window.history.replaceState({}, '', url);

			return true;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			const preview = seqParam.substring(0, 50) + (seqParam.length > 50 ? '...' : '');
			logger.error(
				`Failed to reconstruct sequence from URL: ${errorMsg} (length: ${seqParam.length}, preview: ${preview})`
			);
			showError('Failed to load sequence from URL');
		}
	}
	return false;
}

/**
 * Validate the sequence data format before attempting to decode
 * @param sequenceData The sequence data string to validate
 * @returns True if the format appears valid
 */
function validateSequenceFormat(sequenceData: string): boolean {
	if (!sequenceData) return false;

	// Check for basic format: VERSION|START_POS_DATA|BEAT1|BEAT2|...
	const parts = sequenceData.split('|');

	// Must have at least version and start position
	if (parts.length < 2) {
		logger.warn(`Sequence data has too few parts: ${parts.length}`);
		return false;
	}

	// Version must be a number
	const version = parts[0];
	if (version !== '2' && version !== '3') {
		logger.warn(`Unsupported sequence version: ${version}`);
		return false;
	}

	// For version 3, validate start position format
	if (version === '3') {
		const startPosData = parts[1];
		const startPosParts = startPosData.split(',');

		// Start position should have at least 4 parts: BLUE_LOC,RED_LOC,BLUE_ORI,RED_ORI
		if (startPosParts.length < 4) {
			logger.warn(
				`Invalid start position format: ${startPosData} (parts: ${startPosParts.length})`
			);
			return false;
		}
	}

	// For each beat, check basic format: BLUE:RED
	for (let i = version === '3' ? 2 : 1; i < parts.length; i++) {
		const beatData = parts[i];
		if (!beatData.includes(':')) {
			logger.warn(`Invalid beat format at index ${i}: ${beatData}`);
			return false;
		}
	}

	return true;
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

// Track the last time a share was attempted to prevent issues with multiple rapid calls
let lastShareApiCallTime = 0;
const MIN_SHARE_API_INTERVAL_MS = 1000; // Minimum 1 second between Web Share API calls

/**
 * Share a sequence image with a reconstruction URL
 * This is the primary sharing function that handles both image and URL sharing
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
	console.log('shareUtils: shareSequenceWithImage called with:', { sequenceName, shareUrl });

	if (!browser) {
		console.log('shareUtils: Not in browser environment, returning false');
		return false;
	}

	// First check if Web Share API is supported at all
	if (!isWebShareSupported()) {
		console.log('shareUtils: Web Share API not supported, returning false');
		showError("Your device doesn't support sharing");
		return false;
	}

	// Check if we've attempted to share too recently
	const now = Date.now();
	const timeSinceLastAttempt = now - lastShareApiCallTime;
	if (timeSinceLastAttempt < MIN_SHARE_API_INTERVAL_MS) {
		console.log(
			`shareUtils: Share API called too soon (${timeSinceLastAttempt}ms since last attempt)`
		);
		showError('Please wait a moment before sharing again');
		return false;
	}

	// Update the last attempt time
	lastShareApiCallTime = now;

	try {
		// Prepare the share text
		const shareTitle = 'Kinetic Constructor Sequence';
		const shareText = `Check out this sequence${sequenceName ? ': ' + sequenceName : ''}\n\nOpen this link to reconstruct: ${shareUrl}`;

		// First try to share with image if file sharing is supported
		const fileShareSupported = isFileShareSupported();
		console.log('shareUtils: File sharing supported:', fileShareSupported);

		if (fileShareSupported && imageResult && imageResult.dataUrl) {
			try {
				// Convert the data URL to a Blob
				console.log('shareUtils: Converting data URL to Blob');
				const blob = dataURLtoBlob(imageResult.dataUrl);

				// Create a File from the Blob
				console.log('shareUtils: Creating File from Blob');
				const fileName = `${sequenceName || 'kinetic-sequence'}.png`;
				const file = new File([blob], fileName, { type: 'image/png' });

				// Create share data with the image file
				const shareData: ShareData = {
					title: shareTitle,
					text: shareText,
					url: shareUrl,
					files: [file]
				};

				// Check if the device can share this content with files
				if (navigator.canShare && navigator.canShare(shareData)) {
					console.log('shareUtils: Device can share with files, calling navigator.share');

					// Use a small timeout to ensure the browser is ready
					await new Promise((resolve) => setTimeout(resolve, 100));

					await navigator.share(shareData);
					console.log('shareUtils: Share with files completed successfully');
					showSuccess('Sequence shared successfully');
					return true;
				} else {
					console.log('shareUtils: Device cannot share with files, falling back to text+URL only');
					// Fall through to text+URL sharing
				}
			} catch (fileError) {
				// If there's an error with file sharing, log it and fall back to text+URL sharing
				if (fileError instanceof Error && fileError.name === 'AbortError') {
					console.log('shareUtils: User cancelled file sharing');
					return false;
				}

				console.warn(
					'shareUtils: Error sharing with file, falling back to text+URL only:',
					fileError
				);
				// Fall through to text+URL sharing
			}
		}

		// Fallback to sharing just the text and URL
		console.log('shareUtils: Attempting to share with text and URL only');
		const textOnlyShareData: ShareData = {
			title: shareTitle,
			text: shareText,
			url: shareUrl
		};

		// Use a small timeout to ensure the browser is ready
		await new Promise((resolve) => setTimeout(resolve, 100));

		await navigator.share(textOnlyShareData);
		console.log('shareUtils: Text+URL share completed successfully');
		showSuccess('Sequence shared successfully');
		return true;
	} catch (error) {
		// Don't show error for user cancellation
		if (error instanceof Error && error.name === 'AbortError') {
			console.log('shareUtils: User cancelled sharing');
			return false;
		}

		console.error('shareUtils: Error in shareSequenceWithImage:', error);
		logger.error('Error sharing sequence', {
			error: error instanceof Error ? error : new Error(String(error))
		});

		// Only show error if it's not a user cancellation
		showError('Unable to share sequence. Please try again.');
		return false;
	} finally {
		// Ensure we update the last share time even if there was an error
		lastShareApiCallTime = Date.now();
	}
}

/**
 * Share a sequence using the Web Share API
 * @param {ShareData} shareData - The data to share
 * @returns {Promise<boolean>} True if sharing was successful
 */
export async function shareSequence(shareData: ShareData): Promise<boolean> {
	if (!browser) {
		console.log('shareUtils: Not in browser environment, returning false');
		return false;
	}

	if (!isWebShareSupported()) {
		console.log('shareUtils: Web Share API not supported, returning false');
		showError("Your device doesn't support sharing");
		return false;
	}

	// Check if we've attempted to share too recently
	const now = Date.now();
	const timeSinceLastAttempt = now - lastShareApiCallTime;
	if (timeSinceLastAttempt < MIN_SHARE_API_INTERVAL_MS) {
		console.log(
			`shareUtils: Share API called too soon (${timeSinceLastAttempt}ms since last attempt)`
		);
		showError('Please wait a moment before sharing again');
		return false;
	}

	// Update the last attempt time
	lastShareApiCallTime = now;

	try {
		// Use a small timeout to ensure the browser is ready
		await new Promise((resolve) => setTimeout(resolve, 100));

		await navigator.share(shareData);
		console.log('shareUtils: Share completed successfully');
		logger.info('Sequence shared successfully');
		showSuccess('Sequence shared successfully');
		return true;
	} catch (error) {
		// Don't show error for user cancellation
		if (error instanceof Error && error.name === 'AbortError') {
			console.log('shareUtils: User cancelled sharing');
			logger.info('User cancelled sharing');
			return false;
		}

		console.error('shareUtils: Error in shareSequence:', error);
		logger.error('Error sharing sequence', {
			error: error instanceof Error ? error : new Error(String(error))
		});
		showError('Failed to share sequence');
		return false;
	} finally {
		// Ensure we update the last share time even if there was an error
		lastShareApiCallTime = Date.now();
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
		logger.error('Failed to copy to clipboard', {
			error: error instanceof Error ? error : new Error(String(error))
		});
		showError('Failed to copy link to clipboard');
		return false;
	}
}

/**
 * Send an email with sequence information
 * @param {string} sequenceName - The name of the sequence
 * @param {string} url - The shareable URL
 */
/**
 * Test utility for verifying URL parameter encoding/decoding
 * This function is exposed for testing purposes only
 * @param beats The sequence beats to test
 * @returns Test results with encoded URL and decoded beats
 */
export function testSequenceUrlEncoding(beats: BeatData[]): {
	success: boolean;
	originalBeats: BeatData[];
	encodedUrl: string;
	decodedBeats: BeatData[];
	encodedLength: number;
	compressedLength: number;
	compressionRatio: number;
} {
	try {
		// Generate a shareable URL
		const url = generateShareableUrl(beats, 'Test Sequence');

		// Extract the sequence parameter
		const urlObj = new URL(url);
		const seqParam = urlObj.searchParams.get('seq') || '';

		// Get the raw encoded sequence (before compression)
		const rawEncoded = encodeSequenceCompact(beats);

		// Decode the sequence parameter
		let sequenceData: string;
		if (LZString) {
			try {
				sequenceData = LZString.decompressFromEncodedURIComponent(seqParam);
				if (!sequenceData) {
					sequenceData = seqParam;
				}
			} catch (e) {
				sequenceData = seqParam;
			}
		} else {
			sequenceData = seqParam;
		}

		// Decode the sequence
		const decodedBeats = decodeSequenceCompact(sequenceData);

		// Calculate compression ratio
		const compressionRatio = rawEncoded.length > 0 ? seqParam.length / rawEncoded.length : 1;

		return {
			success: decodedBeats.length > 0,
			originalBeats: beats,
			encodedUrl: url,
			decodedBeats,
			encodedLength: rawEncoded.length,
			compressedLength: seqParam.length,
			compressionRatio
		};
	} catch (error) {
		logger.error('Error in testSequenceUrlEncoding', {
			error: error instanceof Error ? error : new Error(String(error))
		});

		return {
			success: false,
			originalBeats: beats,
			encodedUrl: '',
			decodedBeats: [],
			encodedLength: 0,
			compressedLength: 0,
			compressionRatio: 0
		};
	}
}
