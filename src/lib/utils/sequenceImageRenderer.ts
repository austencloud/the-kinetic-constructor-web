// src/lib/utils/sequenceImageRenderer.ts
import type { BeatData } from '$lib/components/SequenceWorkbench/BeatFrame/BeatData';
import type { ImageExportSettings } from '$lib/state/image-export-settings';
import { browser } from '$app/environment';

// Define the html2canvas type for TypeScript
type Html2CanvasType = (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;

// Initialize with a placeholder that will be replaced with the actual implementation
let html2canvasImpl: Html2CanvasType | null = null;

// Flag to track if we're currently loading html2canvas
let isLoadingHtml2Canvas = false;

// Promise that resolves when html2canvas is loaded
let html2canvasLoadPromise: Promise<Html2CanvasType> | null = null;

/**
 * Load html2canvas from the bundled package
 * This is the primary method that should work in most cases
 */
async function loadBundledHtml2Canvas(): Promise<Html2CanvasType> {
	try {
		console.log('Loading bundled html2canvas...');
		// Use a direct import instead of a dynamic import to avoid Vite optimization issues
		const html2canvas = (await import('html2canvas')).default;
		console.log('Bundled html2canvas loaded successfully');
		return html2canvas;
	} catch (error) {
		console.warn('Failed to load bundled html2canvas:', error);
		throw error;
	}
}

/**
 * Load html2canvas from CDN as a fallback
 */
async function loadCdnHtml2Canvas(): Promise<Html2CanvasType> {
	return new Promise((resolve, reject) => {
		console.log('Loading html2canvas from CDN...');

		// Check if it's already in the window object (might have been loaded by another instance)
		if (typeof window !== 'undefined' && (window as any).html2canvas) {
			console.log('html2canvas already available in window object');
			return resolve((window as any).html2canvas);
		}

		// Create script element to load from CDN
		const script = document.createElement('script');
		script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
		script.async = true;

		script.onload = () => {
			console.log('html2canvas loaded from CDN successfully');
			if (typeof window !== 'undefined' && (window as any).html2canvas) {
				resolve((window as any).html2canvas);
			} else {
				reject(new Error('html2canvas loaded from CDN but not found in window object'));
			}
		};

		script.onerror = () => {
			reject(new Error('Failed to load html2canvas from CDN'));
		};

		document.head.appendChild(script);
	});
}

/**
 * Get the html2canvas implementation, loading it if necessary
 * This ensures we only try to load html2canvas once
 */
async function getHtml2Canvas(): Promise<Html2CanvasType> {
	// If we already have an implementation, return it
	if (html2canvasImpl) {
		return html2canvasImpl;
	}

	// If we're already loading, return the existing promise
	if (html2canvasLoadPromise) {
		return html2canvasLoadPromise;
	}

	// Start loading html2canvas
	isLoadingHtml2Canvas = true;

	// Create a promise that will resolve when html2canvas is loaded
	html2canvasLoadPromise = (async () => {
		try {
			// First try to load the bundled version
			return await loadBundledHtml2Canvas();
		} catch (bundleError) {
			console.warn('Falling back to CDN for html2canvas');
			try {
				// If that fails, try to load from CDN
				return await loadCdnHtml2Canvas();
			} catch (error) {
				const cdnError = error instanceof Error ? error : new Error(String(error));
				console.error('All html2canvas loading methods failed:', cdnError);
				throw new Error('Failed to load html2canvas: ' + cdnError.message);
			}
		}
	})();

	try {
		// Wait for the loading to complete
		const implementation = await html2canvasLoadPromise;
		html2canvasImpl = implementation;
		isLoadingHtml2Canvas = false;
		return implementation;
	} catch (error) {
		// Reset state on error
		html2canvasLoadPromise = null;
		isLoadingHtml2Canvas = false;
		throw error;
	}
}

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

	// New options based on ImageExportSettings
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
 * @param element The DOM element to render (the beat frame)
 * @param options Rendering options
 * @returns Promise that resolves to the render result
 */
export async function renderSequenceToImage(
	element: HTMLElement,
	options: SequenceRenderOptions
): Promise<SequenceRenderResult> {
	try {
		// Ensure we're in a browser environment
		if (!browser) {
			throw new Error('Cannot render sequence to image in a non-browser environment');
		}

		// Calculate the actual rows needed based on beat count
		const actualRows = Math.ceil(options.beats.length / options.cols);
		const usedRows = options.startPosition ? actualRows + 1 : actualRows;

		// Calculate the aspect ratio based on the actual used rows and columns
		const aspectRatio = options.cols / usedRows;

		// Set up canvas options
		const canvasOptions = {
			backgroundColor: options.backgroundColor || 'transparent',
			scale: 2, // Higher scale for better quality
			logging: false,
			useCORS: true,
			allowTaint: true
		};

		// Load html2canvas if not already loaded
		if (!html2canvasImpl) {
			console.log('html2canvas not loaded yet, loading now...');
			try {
				html2canvasImpl = await getHtml2Canvas();
			} catch (error) {
				console.error('Failed to load html2canvas:', error);
				throw new Error('Failed to load html2canvas for image rendering');
			}
		}

		// Render the element to a canvas
		if (!html2canvasImpl) {
			throw new Error('html2canvas implementation is not available');
		}

		console.log('Rendering sequence to image with html2canvas...');
		const canvas = await html2canvasImpl(element, canvasOptions);
		console.log('Sequence rendered successfully');

		// Get the original dimensions
		let width = canvas.width;
		let height = canvas.height;

		// Apply max dimensions if specified
		if (options.maxWidth && width > options.maxWidth) {
			height = (options.maxWidth / width) * height;
			width = options.maxWidth;
		}

		if (options.maxHeight && height > options.maxHeight) {
			width = (options.maxHeight / height) * width;
			height = options.maxHeight;
		}

		// Create a new canvas with the desired dimensions
		const outputCanvas = document.createElement('canvas');
		outputCanvas.width = width;
		outputCanvas.height = height;

		// Draw the original canvas onto the output canvas
		const ctx = outputCanvas.getContext('2d');
		if (!ctx) {
			throw new Error('Could not get canvas context');
		}

		// Draw background if specified
		if (options.backgroundColor) {
			ctx.fillStyle = options.backgroundColor;
			ctx.fillRect(0, 0, width, height);
		}

		// Draw the sequence
		ctx.drawImage(canvas, 0, 0, width, height);

		// Add title if requested
		if (options.includeTitle && options.title) {
			ctx.font = `bold ${Math.round(width * 0.05)}px Arial`;
			ctx.fillStyle = 'white';
			ctx.textAlign = 'center';
			ctx.fillText(options.title, width / 2, height * 0.08);
		}

		// Convert to data URL
		const format = options.format || 'png';
		const quality = options.quality || 1.0;
		const dataUrl = outputCanvas.toDataURL(`image/${format}`, quality);

		// Return the result
		return {
			dataUrl,
			width,
			height,
			aspectRatio
		};
	} catch (error) {
		console.error('Error rendering sequence to image:', error);
		throw new Error(
			`Failed to render sequence to image: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * Downloads a data URL as a file
 * @param dataUrl The data URL to download
 * @param filename The filename to use
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
	const link = document.createElement('a');
	link.href = dataUrl;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

/**
 * Creates rendering options based on image export settings
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
		.map((beat) => (beat.pictographData.letter as string) || '')
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
		backgroundColor: settings.backgroundColor || '#2a2a2e',
		includeTitle: settings.addWord ?? true,
		title: sequenceName,
		format: 'png',
		quality: settings.quality || 0.92,

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
