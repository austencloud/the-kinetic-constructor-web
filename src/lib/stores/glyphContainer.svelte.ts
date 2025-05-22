// src/lib/stores/glyphContainer.svelte.ts
import { browser } from '$app/environment';
import type { Letter } from '$lib/types/Letter';
import { LetterType } from '$lib/types/LetterType';
import { safeAsciiName } from '$lib/types/safeAsciiName';

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

/**
 * Asset cache to prevent repeated fetches
 */
interface AssetCache {
	letters_trimmed: Map<string, { svg: string; dimensions: { width: number; height: number } }>;
	dashSVG: { svg: string; dimensions: { width: number; height: number } } | null;
	dotSVG: { svg: string; dimensions: { width: number; height: number } } | null;
	numberSVGs: Map<string, { svg: string; dimensions: { width: number; height: number } }>;
}

/**
 * Loading state to track preloading progress
 */
interface LoadingState {
	isPreloading: boolean;
	preloadStarted: boolean;
	preloadCompleted: boolean;
	loadedCount: number;
	failedCount: number;
	totalToLoad: number;
}

/**
 * Resource loading queue to prevent overwhelming the browser
 */
class ResourceQueue {
	private queue: Array<{
		task: () => Promise<any>;
		resolve: (value: any) => void;
		reject: (reason?: any) => void;
	}> = [];
	private concurrency = 3; // Maximum number of concurrent requests
	private running = 0;

	/**
	 * Add a task to the queue
	 */
	enqueue<T>(task: () => Promise<T>): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.queue.push({
				task,
				resolve,
				reject
			});

			this.processQueue();
		});
	}

	/**
	 * Process the next items in the queue
	 */
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
}

/**
 * GlyphContainer - Svelte 5 runes implementation for glyph asset management
 */
export function createGlyphContainer() {
	// Create the resource queue
	const resourceQueue = new ResourceQueue();

	// State using Svelte 5 runes
	const cache = $state<AssetCache>({
		letters_trimmed: new Map(),
		dashSVG: null,
		dotSVG: null,
		numberSVGs: new Map()
	});

	// Loading state
	const loading = $state<LoadingState>({
		isPreloading: false,
		preloadStarted: false,
		preloadCompleted: false,
		loadedCount: 0,
		failedCount: 0,
		totalToLoad: 0
	});

	/**
	 * Retry logic with exponential backoff
	 */
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

				// Wait before retrying
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	/**
	 * One-time fetch and parse of SVG dimensions with improved error handling and retries
	 */
	async function fetchSVGDimensions(path: string): Promise<{ width: number; height: number }> {
		return resourceQueue.enqueue(async () => {
			try {
				const response = await fetchWithRetry(path);
				const svgText = await response.text();
				const viewBoxMatch = svgText.match(
					/viewBox\s*=\s*"[\d\.\-]+\s+[\d\.\-]+\s+([\d\.\-]+)\s+([\d\.\-]+)"/i
				);

				if (!viewBoxMatch) {
					return { width: 100, height: 100 };
				}

				return {
					width: parseFloat(viewBoxMatch[1]),
					height: parseFloat(viewBoxMatch[2])
				};
			} catch (error) {
				return { width: 100, height: 100 };
			}
		});
	}

	/**
	 * Check if an asset is already cached
	 */
	function isCached(key: string): boolean {
		if (key.startsWith('letter:')) {
			const letter = key.split(':')[1];
			return cache.letters_trimmed.has(letter);
		} else if (key === 'dash') {
			return cache.dashSVG !== null;
		} else if (key === 'dot') {
			return cache.dotSVG !== null;
		}
		return false;
	}

	/**
	 * Utility for folder naming strategy
	 */
	function getLetterFolder(letter: Letter): string {
		const letterType = LetterType.getLetterType(letter);

		if (!letterType) return 'Type1';

		let folderName = letterType.folderName;

		// Special case handling
		if (letterType === LetterType.Type3) folderName = 'Type2';
		if (letterType === LetterType.Type5) folderName = 'Type4';
		if (letter?.toString().match(/[WXYZΩθΣΔ]-/)) folderName = 'Type2';

		return folderName;
	}

	/**
	 * Get letter path while handling special cases
	 */
	function getLetterPath(letter: Letter): string {
		const folderName = getLetterFolder(letter);
		const asciiName = safeAsciiName(letter);
		return `/images/letters_trimmed/${folderName}/${asciiName}.svg`;
	}

	// Create derived values before the return statement
	const derivedCache = $derived(cache);
	const derivedLoading = $derived(loading);

	return {
		// State
		cache: derivedCache,
		loading: derivedLoading,

		// Methods
		fetchSVGDimensions,
		getLetterPath,
		isCached,

		/**
		 * Preload common assets (dot, dash, and common letters) with improved reliability
		 */
		async preloadCommonAssets(): Promise<void> {
			// Prevent multiple simultaneous preloads
			if (loading.isPreloading) {
				return;
			}

			// Mark as started even if we've already completed before
			// This allows for explicit refresh if needed
			loading.isPreloading = true;
			loading.preloadStarted = true;

			const dashPath = '/images/dash.svg';
			const dotPath = '/images/same_opp_dot.svg';

			// Common letters to preload (A-Z)
			const commonLetters = Array.from(
				{ length: 26 },
				(_, i) => String.fromCharCode(65 + i) as unknown as Letter
			);

			// Reset counters
			loading.loadedCount = 0;
			loading.failedCount = 0;
			loading.totalToLoad = 2 + commonLetters.length; // dash, dot, and letters

			try {
				// First load dash and dot if not already cached
				if (!isCached('dash') || !isCached('dot')) {
					try {
						// Load dash and dot sequentially to avoid resource contention
						const dashDimensions = await fetchSVGDimensions(dashPath);

						cache.dashSVG = {
							svg: dashPath,
							dimensions: dashDimensions
						};
						loading.loadedCount++;

						// Small delay between requests
						await new Promise((resolve) => setTimeout(resolve, 50));

						const dotDimensions = await fetchSVGDimensions(dotPath);

						cache.dotSVG = {
							svg: dotPath,
							dimensions: dotDimensions
						};
						loading.loadedCount++;
					} catch (error) {
						loading.failedCount += 2;
						// Continue with letter loading even if dash/dot fail
					}
				} else {
					loading.loadedCount += 2; // Count as loaded if already cached
				}

				// Then preload common letters in smaller batches with delays between batches
				const batchSize = 3; // Reduced batch size for better reliability

				for (let i = 0; i < commonLetters.length; i += batchSize) {
					const batch = commonLetters.slice(i, i + batchSize);

					// Process each letter in the batch sequentially
					for (const letter of batch) {
						// Skip if already cached
						if (isCached(`letter:${letter}`)) {
							loading.loadedCount++;
							continue;
						}

						try {
							const path = getLetterPath(letter);

							const dimensions = await fetchSVGDimensions(path);

							// Update the cache with this letter
							cache.letters_trimmed.set(letter.toString(), {
								svg: path,
								dimensions
							});

							loading.loadedCount++;
						} catch (error) {
							loading.failedCount++;
						}

						// Small delay between letters in the same batch
						await new Promise((resolve) => setTimeout(resolve, 30));
					}

					// Larger delay between batches
					if (i + batchSize < commonLetters.length) {
						await new Promise((resolve) => setTimeout(resolve, 100));
					}
				}

				loading.preloadCompleted = true;
			} catch (error) {
			} finally {
				loading.isPreloading = false;
			}
		}
	};
}

// Create and export the singleton instance
export const glyphContainer = createGlyphContainer();

// Initialize preloading if in browser environment
if (browser) {
	// Use a small delay to ensure the app is ready
	setTimeout(() => {
		if (!glyphContainer.loading.preloadStarted) {
			glyphContainer.preloadCommonAssets();
		}
	}, 100);
}
