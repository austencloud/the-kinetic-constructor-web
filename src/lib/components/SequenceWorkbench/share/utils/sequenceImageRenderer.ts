// Updated src/lib/utils/sequenceImageRenderer.ts

import type { BeatData } from '$lib/components/SequenceWorkbench/BeatFrame/BeatData';
import { browser } from '$app/environment';
import { logger } from '$lib/core/logging';
import type { ImageExportSettings } from '$lib/state/image-export-settings';

/**
 * Options for rendering a sequence to an image
 */
export interface SequenceRenderOptions {
	beats: BeatData[];
	startPosition: any | null;
	rows: number;
	cols: number;
	padding?: number;
	backgroundColor?: string;
	includeTitle?: boolean;
	title?: string;
	quality?: number; // 0-1 for JPEG quality
	format?: 'png' | 'jpeg';
	maxWidth?: number;
	maxHeight?: number;
	scale?: number; // Scale factor for beat size calculation

	// Image export settings
	includeStartPosition?: boolean;
	addUserInfo?: boolean;
	addWord?: boolean;
	addDifficultyLevel?: boolean;
	addBeatNumbers?: boolean;
	addReversalSymbols?: boolean;
	combinedGrids?: boolean;
	userName?: string;
	notes?: string;
	exportDate?: string;
	difficultyLevel?: number;
}

/**
 * Result of rendering a sequence to an image
 */
export interface SequenceRenderResult {
	dataUrl: string;
	width: number;
	height: number;
	aspectRatio: number;
}

/**
 * Renders a sequence to an image
 */
export async function renderSequenceToImage(
	element: HTMLElement,
	options: SequenceRenderOptions
): Promise<SequenceRenderResult> {
	return new Promise((resolve, reject) => {
		try {
			if (!browser) {
				reject(new Error('Cannot render in non-browser environment'));
				return;
			}

			// Load html2canvas dynamically
			import('html2canvas')
				.then(async (html2canvasModule) => {
					const html2canvas = html2canvasModule.default;

					// Pre-processing - ensure all elements are visible and properly styled
					applyPreRenderStyles(element, options);

					// Calculate layout dimensions
					const { width, height, topMargin, bottomMargin, beatSize } = calculateDimensions(options);

					// Log dimensions for debugging
					console.log('Rendering sequence image with dimensions:', {
						width,
						height,
						topMargin,
						bottomMargin,
						beatSize,
						totalWidth: width,
						totalHeight: height + topMargin + bottomMargin,
						beatCount: options.beats.length
					});

					// Canvas options - ALWAYS use white background like Python version
					const canvasOptions = {
						backgroundColor: '#FFFFFF',
						scale: 2, // Higher scale for better quality
						logging: false,
						useCORS: true,
						allowTaint: true,
						// Capture SVG elements properly
						svgRendering: true,
						ignoreElements: (el: Element) => {
							// Don't ignore any SVG elements
							if (el.tagName.toLowerCase() === 'svg' || el.closest('svg')) {
								return false;
							}
							// Ignore elements with these classes
							return el.classList.contains('ignore-export');
						}
					};

					try {
						// Render the element to a canvas
						const canvas = await html2canvas(element, canvasOptions);

						// Create output canvas with proper size including margins
						const outputCanvas = document.createElement('canvas');
						outputCanvas.width = width;
						outputCanvas.height = height + topMargin + bottomMargin;

						const ctx = outputCanvas.getContext('2d');
						if (!ctx) {
							reject(new Error('Could not get canvas context'));
							return;
						}

						// Fill the entire canvas with white (like Python version)
						ctx.fillStyle = '#FFFFFF';
						ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

						// Draw the word/title if enabled (in top margin like Python version)
						if (options.addWord && options.title) {
							drawTitle(ctx, options.title, width, topMargin);
						}

						// Draw the sequence content
						// Draw the sequence content centered horizontally if canvas is wider
						const contentX = Math.max(0, Math.floor((width - canvas.width) / 2));
						ctx.drawImage(canvas, contentX, topMargin);

						// Draw user info if enabled (in bottom margin like Python version)
						if (options.addUserInfo) {
							drawUserInfo(ctx, options, width, height, topMargin, bottomMargin);
						}

						// Convert to data URL
						const format = options.format || 'png';
						const quality = options.quality || 0.92;
						const dataUrl = outputCanvas.toDataURL(`image/${format}`, quality);

						// Restore original styles
						restoreOriginalStyles(element);

						// Return result
						resolve({
							dataUrl,
							width: outputCanvas.width,
							height: outputCanvas.height,
							aspectRatio: outputCanvas.width / outputCanvas.height
						});
					} catch (renderError) {
						logger.error('Error in html2canvas rendering', {
							error: renderError instanceof Error ? renderError : new Error(String(renderError))
						});
						reject(renderError);
					}
				})
				.catch((error) => {
					reject(new Error(`Failed to load html2canvas: ${error.message}`));
				});
		} catch (error) {
			reject(error);
		}
	});
}
/**
 * Creates rendering options based on image export settings
 * @param beats The beats to render
 * @param settings Image export settings
 * @param additionalOptions Additional options to override settings
 * @returns Sequence render options
 */
export function createRenderOptionsFromSettings(
	beats: BeatData[],
	settings: Partial<ImageExportSettings>,
	additionalOptions: Partial<SequenceRenderOptions> = {}
): SequenceRenderOptions {
	// Calculate layout
	const renderCols = 4;
	const renderRows = Math.ceil(beats.length / renderCols);

	// Extract sequence name if available
	const letters = beats
		.map((beat) => {
			// Look for letter in different possible locations
			return beat.pictographData?.letter as string;
		})
		.filter((letter) => letter.trim() !== '')
		.join('');

	const sequenceName = letters || 'Kinetic Sequence';

	// Start with default settings
	return {
		beats,
		startPosition: null,
		rows: renderRows,
		cols: renderCols,
		padding: 10,
		backgroundColor: settings.backgroundColor || '#FFFFFF',
		includeTitle: settings.addWord ?? true,
		title: sequenceName,
		format: 'png',
		quality: settings.quality || 0.92,
		scale: 1, // Default scale factor, will be overridden if provided in additionalOptions

		// Apply settings
		includeStartPosition: settings.includeStartPosition ?? true,
		addUserInfo: settings.addUserInfo ?? true,
		addWord: settings.addWord ?? true,
		addDifficultyLevel: settings.addDifficultyLevel ?? false,
		addBeatNumbers: settings.addBeatNumbers ?? true,
		addReversalSymbols: settings.addReversalSymbols ?? true,
		combinedGrids: settings.combinedGrids ?? false,

		// Override with any additional options
		...additionalOptions
	};
}
/**
 * Apply pre-render styles to ensure everything is properly captured
 */
function applyPreRenderStyles(element: HTMLElement, options: SequenceRenderOptions) {
	// Make sure all grid elements are visible
	const grids = element.querySelectorAll('image[href*="grid"]');
	grids.forEach((grid) => {
		(grid as HTMLElement).style.visibility = 'visible';
		(grid as HTMLElement).style.opacity = '1';
	});

	// Make sure all letter glyphs are visible
	const letters = element.querySelectorAll('.tka-glyph');
	letters.forEach((letter) => {
		(letter as HTMLElement).style.visibility = 'visible';
		(letter as HTMLElement).style.opacity = '1';
	});

	// Configure beat numbers visibility based on options
	const beatNumbers = element.querySelectorAll('.beat-number');
	beatNumbers.forEach((number) => {
		(number as HTMLElement).style.visibility = options.addBeatNumbers ? 'visible' : 'hidden';
		(number as HTMLElement).style.opacity = options.addBeatNumbers ? '1' : '0';
	});

	// Configure reversal glyphs visibility based on options
	const reversalGlyphs = element.querySelectorAll('.reversal-glyph');
	reversalGlyphs.forEach((glyph) => {
		(glyph as HTMLElement).style.visibility = options.addReversalSymbols ? 'visible' : 'hidden';
		(glyph as HTMLElement).style.opacity = options.addReversalSymbols ? '1' : '0';
	});
}

/**
 * Restore original styles after rendering
 */
function restoreOriginalStyles(element: HTMLElement) {
	// Reset any temporary styling
	const temporaryStyled = element.querySelectorAll('[data-temp-styled]');
	temporaryStyled.forEach((el) => {
		(el as HTMLElement).style.cssText = (el as HTMLElement).dataset.originalStyle || '';
		delete (el as HTMLElement).dataset.tempStyled;
		delete (el as HTMLElement).dataset.originalStyle;
	});
}

/**
 * Calculate dimensions for the image
 */ function calculateDimensions(options: SequenceRenderOptions) {
	// Base dimensions from beats and layout
	const actualRows = Math.ceil(options.beats.length / options.cols);
	const usedRows = options.includeStartPosition ? actualRows + 1 : actualRows;

	// Get a reasonable base beat size (try to match Python's approach)
	// Default to 200px if we can't determine from options
	let baseBeatSize = 200;

	// If we have a scale option, use it (this should be set elsewhere based on actual DOM element size)
	if (options.scale && typeof options.scale === 'number') {
		baseBeatSize = Math.round(baseBeatSize * options.scale);
	}

	// Calculate optimal pictograph size based on sequence length
	// Smaller sequences get larger pictographs for better visibility
	let beatSize = baseBeatSize;

	// Adjust size based on sequence length for better readability, but keep it proportional
	const beatCount = options.beats.length;
	if (beatCount > 8) {
		// For longer sequences, make pictographs smaller to fit better
		beatSize = Math.round(baseBeatSize * 0.9);
	} else if (beatCount <= 4) {
		// For very short sequences, make pictographs larger
		beatSize = Math.round(baseBeatSize * 1.1);
	}

	// Apply max width/height constraints if provided
	if (options.maxWidth && options.cols * beatSize > options.maxWidth) {
		beatSize = Math.floor(options.maxWidth / options.cols);
	}

	// Calculate dimensions
	const width = options.cols * beatSize;
	const height = usedRows * beatSize;

	// Calculate margins proportional to beat size
	let topMargin = 0;
	let bottomMargin = 0;

	if (options.addWord) {
		// Make top margin proportional to beat size for title/word
		topMargin = Math.min(beatSize * 0.8, 200);
	}

	if (options.addUserInfo) {
		// Make bottom margin proportional to beat size for user info
		bottomMargin = Math.min(beatSize * 0.3, 100);
	}

	// Adjust margins based on sequence length for better balance
	if (beatCount === 0) {
		bottomMargin = options.addUserInfo ? Math.min(beatSize * 0.3, 60) : 0;
	} else if (beatCount === 1) {
		topMargin = options.addWord ? Math.min(beatSize * 0.8, 120) : 0;
	} else if (beatCount === 2) {
		topMargin = options.addWord ? Math.min(beatSize * 0.8, 150) : 0;
	}

	return { width, height, topMargin, bottomMargin, beatSize };
}

/**
 * Draw title text (word) with improved styling
 */ function drawTitle(
	ctx: CanvasRenderingContext2D,
	title: string,
	width: number,
	topMargin: number
) {
	// Start with a reasonable base font size proportional to margin
	let fontSize = Math.min(width * 0.08, topMargin * 0.6);

	// Set initial font to measure text
	ctx.font = `bold ${fontSize}px Georgia`;
	let textWidth = ctx.measureText(title).width;

	// Reduce font size until it fits within 80% of canvas width
	while (textWidth > width * 0.8 && fontSize > 16) {
		fontSize -= 2;
		ctx.font = `bold ${fontSize}px Georgia`;
		textWidth = ctx.measureText(title).width;
	}

	// Draw title with subtle shadow for better readability
	ctx.save();

	// Draw shadow
	ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(title, width / 2 + 2, topMargin / 2 + 2);

	// Draw main text
	ctx.fillStyle = '#000000';
	ctx.fillText(title, width / 2, topMargin / 2);

	// Add a subtle underline
	textWidth = ctx.measureText(title).width; // Re-measure after font changes
	const lineY = topMargin / 2 + fontSize * 0.6;
	const lineWidth = textWidth * 0.8;

	ctx.beginPath();
	ctx.moveTo(width / 2 - lineWidth / 2, lineY);
	ctx.lineTo(width / 2 + lineWidth / 2, lineY);
	ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
	ctx.lineWidth = 1;
	ctx.stroke();

	ctx.restore();
}

/**
 * Draw user info with improved styling
 */
function drawUserInfo(
	ctx: CanvasRenderingContext2D,
	options: SequenceRenderOptions,
	width: number,
	height: number,
	topMargin: number,
	bottomMargin: number
) {
	const userName = options.userName || 'User';
	const notes = options.notes || 'Created using The Kinetic Constructor';
	const exportDate = options.exportDate || new Date().toLocaleDateString();

	// Calculate optimal font size based on available space
	const fontSize = Math.min(width * 0.02, bottomMargin * 0.4);
	const margin = bottomMargin * 0.2;

	// Position calculation
	const baseY = height + topMargin + bottomMargin - margin;

	ctx.save();

	// Draw a subtle separator line
	ctx.beginPath();
	ctx.moveTo(margin, height + topMargin + margin / 2);
	ctx.lineTo(width - margin, height + topMargin + margin / 2);
	ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
	ctx.lineWidth = 1;
	ctx.stroke();

	// User name (bottom left) with subtle styling
	ctx.font = `bold ${fontSize}px Georgia`;
	ctx.fillStyle = '#000000';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'bottom';
	ctx.fillText(userName, margin, baseY);

	// Notes (bottom center) with subtle styling
	ctx.font = `italic ${fontSize}px Georgia`;
	ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
	ctx.textAlign = 'center';
	ctx.fillText(notes, width / 2, baseY);

	// Export date (bottom right)
	ctx.textAlign = 'right';
	ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
	ctx.fillText(exportDate, width - margin, baseY);

	ctx.restore();
}

/**
 * Downloads a data URL as a file
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
	const link = document.createElement('a');
	link.href = dataUrl;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
