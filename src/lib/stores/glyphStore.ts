// src/lib/stores/glyphStore.ts
import { writable, get } from 'svelte/store';
import type { Letter } from '$lib/types/Letter';
import { LetterType } from '$lib/types/LetterType';
import { safeAsciiName } from '$lib/types/safeAsciiName';

// Asset cache to prevent repeated fetches
interface AssetCache {
	letters_trimmed: Map<string, { svg: string; dimensions: { width: number; height: number } }>;
	dashSVG: { svg: string; dimensions: { width: number; height: number } } | null;
	dotSVG: { svg: string; dimensions: { width: number; height: number } } | null;
	numberSVGs: Map<string, { svg: string; dimensions: { width: number; height: number } }>;
}

export const assetCache = writable<AssetCache>({
	letters_trimmed: new Map(),
	dashSVG: null,
	dotSVG: null,
	numberSVGs: new Map()
});

/**
 * Rectangle interface for dimensions and layout calculations
 * Used by various components for positioning and sizing
 */
export interface Rect {
	left: number;
	right: number;
	top: number;
	bottom: number;
	width: number;
	height: number;
}

// Resource loading queue to prevent overwhelming the browser
const resourceQueue = {
	queue: [] as Array<{
		task: () => Promise<any>;
		resolve: (value: any) => void;
		reject: (reason?: any) => void;
	}>,
	concurrency: 3, // Maximum number of concurrent requests
	running: 0,

	// Add a task to the queue
	enqueue<T>(task: () => Promise<T>): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.queue.push({
				task,
				resolve,
				reject
			});

			this.processQueue();
		});
	},

	// Process the next items in the queue
	processQueue() {
		while (this.running < this.concurrency && this.queue.length > 0) {
			const item = this.queue.shift();
			if (item) {
				this.running++;
				// Execute the task
				(async () => {
					try {
						const result = await item.task();
						item.resolve(result);
					} catch (error) {
						item.reject(error);
					} finally {
						this.running--;
						this.processQueue();
					}
				})();
			}
		}
	}
};

// Retry logic with exponential backoff
async function fetchWithRetry(
	url: string,
	options: RequestInit = {},
	maxRetries = 3,
	initialDelay = 300
): Promise<Response> {
	let retries = 0;
	let delay = initialDelay;

	while (true) {
		try {
			const response = await fetch(url, options);
			if (!response.ok) {
				throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
			}
			return response;
		} catch (error) {
			retries++;

			// Check if we've reached max retries
			if (retries >= maxRetries) {
				throw error;
			}

			// Check if the error is due to insufficient resources
			const errorMessage = error instanceof Error ? error.message : String(error);
			const isResourceError =
				errorMessage.includes('ERR_INSUFFICIENT_RESOURCES') ||
				errorMessage.includes('NetworkError');

			// Calculate delay with exponential backoff and jitter
			delay = isResourceError
				? delay * 2 + Math.random() * 100 // Longer delay for resource errors
				: delay * 1.5 + Math.random() * 50;

			console.warn(`Retry ${retries}/${maxRetries} for ${url} after ${Math.round(delay)}ms delay`);

			// Wait before retrying
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}
}

// One-time fetch and parse of SVG dimensions with improved error handling and retries
export const fetchSVGDimensions = async (
	path: string
): Promise<{ width: number; height: number }> => {
	return resourceQueue.enqueue(async () => {
		try {
			const response = await fetchWithRetry(path);
			const svgText = await response.text();
			const viewBoxMatch = svgText.match(
				/viewBox\s*=\s*"[\d\.\-]+\s+[\d\.\-]+\s+([\d\.\-]+)\s+([\d\.\-]+)"/i
			);

			if (!viewBoxMatch) {
				console.warn(`SVG at ${path} has no valid viewBox, using defaults`);
				return { width: 100, height: 100 };
			}

			return {
				width: parseFloat(viewBoxMatch[1]),
				height: parseFloat(viewBoxMatch[2])
			};
		} catch (error) {
			console.error(`Error fetching SVG dimensions for ${path}:`, error);
			return { width: 100, height: 100 };
		}
	});
};

// Use the get function from svelte/store to access store values

// Cache check to avoid redundant fetches
const isCached = (key: string): boolean => {
	const cache = get(assetCache);

	if (key.startsWith('letter:')) {
		const letter = key.split(':')[1];
		return cache.letters_trimmed.has(letter);
	} else if (key === 'dash') {
		return cache.dashSVG !== null;
	} else if (key === 'dot') {
		return cache.dotSVG !== null;
	}
	return false;
};

// Preload common assets (dot, dash, and common letters) with improved reliability
export const preloadCommonAssets = async (): Promise<void> => {
	const dashPath = '/images/dash.svg';
	const dotPath = '/images/same_opp_dot.svg';

	// Common letters to preload (A-Z)
	const commonLetters = Array.from(
		{ length: 26 },
		(_, i) => String.fromCharCode(65 + i) as unknown as Letter
	);

	try {
		console.log('Starting preload of common assets...');

		// First load dash and dot if not already cached
		if (!isCached('dash') || !isCached('dot')) {
			console.log('Loading dash and dot SVGs...');

			try {
				// Load dash and dot sequentially to avoid resource contention
				const dashDimensions = await fetchSVGDimensions(dashPath);

				assetCache.update((cache) => ({
					...cache,
					dashSVG: { svg: dashPath, dimensions: dashDimensions }
				}));

				console.log('Dash SVG loaded successfully');

				// Small delay between requests
				await new Promise((resolve) => setTimeout(resolve, 50));

				const dotDimensions = await fetchSVGDimensions(dotPath);

				assetCache.update((cache) => ({
					...cache,
					dotSVG: { svg: dotPath, dimensions: dotDimensions }
				}));

				console.log('Dot SVG loaded successfully');
			} catch (error) {
				console.error('Error loading dash/dot SVGs:', error);
				// Continue with letter loading even if dash/dot fail
			}
		} else {
			console.log('Dash and dot SVGs already cached');
		}

		// Then preload common letters in smaller batches with delays between batches
		const batchSize = 3; // Reduced batch size for better reliability
		let successCount = 0;
		let failCount = 0;

		console.log(`Preloading ${commonLetters.length} letters in batches of ${batchSize}...`);

		for (let i = 0; i < commonLetters.length; i += batchSize) {
			const batch = commonLetters.slice(i, i + batchSize);
			console.log(
				`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(commonLetters.length / batchSize)}: ${batch.join(', ')}`
			);

			// Process each letter in the batch sequentially
			for (const letter of batch) {
				// Skip if already cached
				if (isCached(`letter:${letter}`)) {
					console.log(`Letter ${letter} already cached, skipping`);
					successCount++;
					continue;
				}

				try {
					const path = getLetterPath(letter);
					console.log(`Loading letter ${letter} from ${path}...`);

					const dimensions = await fetchSVGDimensions(path);

					// Update the cache with this letter
					assetCache.update((cache) => {
						const newCache = { ...cache };
						newCache.letters_trimmed.set(letter.toString(), {
							svg: path,
							dimensions
						});
						return newCache;
					});

					successCount++;
					console.log(
						`Letter ${letter} loaded successfully (${successCount}/${commonLetters.length})`
					);
				} catch (error) {
					failCount++;
					console.warn(`Failed to preload letter ${letter}:`, error);
				}

				// Small delay between letters in the same batch
				await new Promise((resolve) => setTimeout(resolve, 30));
			}

			// Larger delay between batches
			if (i + batchSize < commonLetters.length) {
				console.log(`Batch complete. Pausing before next batch...`);
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}

		console.log(`Preloading complete. Success: ${successCount}, Failed: ${failCount}`);
	} catch (error) {
		console.error('Error preloading common assets:', error);
	}
};

// Utility for folder naming strategy
export const getLetterFolder = (letter: Letter): string => {
	const letterType = LetterType.getLetterType(letter);

	if (!letterType) return 'Type1';

	let folderName = letterType.folderName;

	// Special case handling
	if (letterType === LetterType.Type3) folderName = 'Type2';
	if (letterType === LetterType.Type5) folderName = 'Type4';
	if (letter?.toString().match(/[WXYZΩθΣΔ]-/)) folderName = 'Type2';

	return folderName;
};

// Get letter path while handling special cases
export const getLetterPath = (letter: Letter): string => {
	const folderName = getLetterFolder(letter);
	const asciiName = safeAsciiName(letter);
	return `/images/letters_trimmed/${folderName}/${asciiName}.svg`;
};
