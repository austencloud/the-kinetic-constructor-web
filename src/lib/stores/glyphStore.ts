import { writable, get } from 'svelte/store';
import type { Letter } from '$lib/types/Letter';
import { LetterType } from '$lib/types/LetterType';
import { safeAsciiName } from '$lib/types/safeAsciiName';

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

const resourceQueue = {
	queue: [] as Array<{
		task: () => Promise<any>;
		resolve: (value: any) => void;
		reject: (reason?: any) => void;
	}>,
	concurrency: 3,
	running: 0,

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

	processQueue() {
		while (this.running < this.concurrency && this.queue.length > 0) {
			const item = this.queue.shift();
			if (item) {
				this.running++;

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

			if (retries >= maxRetries) {
				throw error;
			}

			const errorMessage = error instanceof Error ? error.message : String(error);
			const isResourceError =
				errorMessage.includes('ERR_INSUFFICIENT_RESOURCES') ||
				errorMessage.includes('NetworkError');

			delay = isResourceError ? delay * 2 + Math.random() * 100 : delay * 1.5 + Math.random() * 50;

			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}
}

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

export const preloadCommonAssets = async (): Promise<void> => {
	const dashPath = '/images/dash.svg';
	const dotPath = '/images/same_opp_dot.svg';

	const commonLetters = Array.from(
		{ length: 26 },
		(_, i) => String.fromCharCode(65 + i) as unknown as Letter
	);

	try {
		if (!isCached('dash') || !isCached('dot')) {
			try {
				const dashDimensions = await fetchSVGDimensions(dashPath);

				assetCache.update((cache) => ({
					...cache,
					dashSVG: { svg: dashPath, dimensions: dashDimensions }
				}));

				await new Promise((resolve) => setTimeout(resolve, 50));

				const dotDimensions = await fetchSVGDimensions(dotPath);

				assetCache.update((cache) => ({
					...cache,
					dotSVG: { svg: dotPath, dimensions: dotDimensions }
				}));
			} catch (error) {
				console.error('Error loading dash/dot SVGs:', error);
			}
		}

		const batchSize = 3;

		for (let i = 0; i < commonLetters.length; i += batchSize) {
			const batch = commonLetters.slice(i, i + batchSize);

			for (const letter of batch) {
				if (isCached(`letter:${letter}`)) {
					continue;
				}

				try {
					const path = getLetterPath(letter);

					const dimensions = await fetchSVGDimensions(path);

					assetCache.update((cache) => {
						const newCache = { ...cache };
						newCache.letters_trimmed.set(letter.toString(), {
							svg: path,
							dimensions
						});
						return newCache;
					});
				} catch (error) {
					console.warn(`Failed to preload letter ${letter}:`, error);
				}

				await new Promise((resolve) => setTimeout(resolve, 30));
			}

			if (i + batchSize < commonLetters.length) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}
	} catch (error) {
		console.error('Error preloading common assets:', error);
	}
};

export const getLetterFolder = (letter: Letter): string => {
	const letterType = LetterType.getLetterType(letter);

	if (!letterType) return 'Type1';

	let folderName = letterType.folderName;

	if (letterType === LetterType.Type3) folderName = 'Type2';
	if (letterType === LetterType.Type5) folderName = 'Type4';
	if (letter?.toString().match(/[WXYZΩθΣΔ]-/)) folderName = 'Type2';

	return folderName;
};

export const getLetterPath = (letter: Letter): string => {
	const folderName = getLetterFolder(letter);
	const asciiName = safeAsciiName(letter);
	return `/images/letters_trimmed/${folderName}/${asciiName}.svg`;
};
