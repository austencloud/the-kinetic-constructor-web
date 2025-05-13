// src/lib/components/SequenceWorkbench/share/imageExport/dimensionCalculator.ts

import type { SequenceRenderOptions, CanvasDimensions } from './types';

/**
 * Calculates all dimensions for the image export
 */
export function calculateDimensions(
	options: SequenceRenderOptions,
	element: HTMLElement
): CanvasDimensions {
	// Base dimensions from beats and layout
	const actualRows = Math.ceil((options.beats?.length || 0) / (options.cols || 4));
	const usedRows = options.includeStartPosition ? actualRows + 1 : actualRows;

	// Get a reasonable beat size from the element or fallback to default
	const baseBeatSize = getBeatSizeFromElement(element);

	// Apply scale factor from options
	let beatSize = Math.round(baseBeatSize * (options.scale || 1));

	// Adjust beat size based on sequence length (proportionally)
	const beatCount = options.beats?.length || 0;
	if (beatCount > 8) {
		// For longer sequences, make slightly smaller
		beatSize = Math.round(beatSize * 0.9);
	} else if (beatCount <= 4) {
		// For very short sequences, make slightly larger
		beatSize = Math.round(beatSize * 1.1);
	}

	// Calculate dimensions
	const width = (options.cols || 4) * beatSize;

	// Ensure we have at least 1 row
	const effectiveRows = Math.max(usedRows, 1);
	const height = effectiveRows * beatSize;

	// Calculate margins, proportional to beat size like in Python version
	const topMargin = calculateTopMargin(options, beatSize, beatCount);
	const bottomMargin = calculateBottomMargin(options, beatSize, beatCount);

	// Log for debugging
	console.log('DimensionCalculator: Result', {
		beatCount,
		beatSize,
		width,
		height,
		topMargin,
		bottomMargin
	});

	return { width, height, topMargin, bottomMargin, beatSize };
}

/**
 * Determines the beat size based on the element
 */
function getBeatSizeFromElement(element: HTMLElement): number {
	console.log('DEBUG: Using forced large beat size!');
	return 1000; // Force a large size for testing

	try {
		// Look for any of these selectors to determine size
		const selectors = ['.beat-frame', '.pictograph-wrapper', '.tka-glyph', '.sequence-widget'];

		// Try each selector
		for (const selector of selectors) {
			const beatElement = element.querySelector(selector) as HTMLElement;
			if (beatElement) {
				// Get dimensions from this element
				const width = beatElement.offsetWidth || beatElement.clientWidth;
				const height = beatElement.offsetHeight || beatElement.clientHeight;

				if (width > 10 && height > 10) {
					// Found a usable element with dimensions!
					console.log(`DimensionCalculator: Found ${selector} with size ${width}x${height}`);
					return Math.max(width, height);
				}
			}
		}

		// If we couldn't find any elements, check the element itself
		if (element.offsetWidth > 10 && element.offsetHeight > 10) {
			const size = Math.max(element.offsetWidth, element.offsetHeight) / 2;
			console.log(`DimensionCalculator: Using container size ${size}`);
			return size;
		}

		// No good dimensions found, use a reasonable default
		console.log('DimensionCalculator: Using default beat size 200px');
		return 200;
	} catch (err) {
		console.warn('DimensionCalculator: Error measuring element', err);
		return 200; // Fallback default
	}
}

/**
 * Calculates top margin similar to Python's height_determiner.py
 */
function calculateTopMargin(
	options: SequenceRenderOptions,
	beatSize: number,
	beatCount: number
): number {
	// No top margin if we don't need a title
	if (!options.addWord) return 0;

	// Base the margin on beat size, but with a max - similar to Python version
	const baseTopMargin = Math.min(beatSize * 0.7, 150);

	// Adjust based on sequence length like in Python
	if (beatCount === 0) {
		return Math.round(baseTopMargin * 0.7);
	} else if (beatCount === 1) {
		return Math.round(baseTopMargin * 0.8);
	} else if (beatCount === 2) {
		return Math.round(baseTopMargin * 0.9);
	} else {
		return Math.round(baseTopMargin);
	}
}

/**
 * Calculates bottom margin similar to Python's height_determiner.py
 */
function calculateBottomMargin(
	options: SequenceRenderOptions,
	beatSize: number,
	beatCount: number
): number {
	// No bottom margin if we don't need user info
	if (!options.addUserInfo) return 0;

	// Base the margin on beat size, but with a max - similar to Python version
	const baseBottomMargin = Math.min(beatSize * 0.3, 80);

	// Adjust based on sequence length like in Python
	if (beatCount <= 1) {
		return Math.round(baseBottomMargin * 0.7);
	} else if (beatCount === 2) {
		return Math.round(baseBottomMargin * 0.9);
	} else {
		return Math.round(baseBottomMargin);
	}
}
