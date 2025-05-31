// src/lib/stores/glyphStore.ts
import { derived, writable, type Readable } from 'svelte/store';
import type { Letter } from '$lib/types/Letter';
import type { DirRelation, PropRotDir, TKATurns } from '$lib/types/Types';
import { LetterType } from '$lib/types/LetterType';
import { safeAsciiName } from '$lib/types/safeAsciiName';

// Asset cache to prevent repeated fetches
interface AssetCache {
	letterSVGs: Map<string, { svg: string; dimensions: { width: number; height: number } }>;
	dashSVG: { svg: string; dimensions: { width: number; height: number } } | null;
	dotSVG: { svg: string; dimensions: { width: number; height: number } } | null;
	numberSVGs: Map<string, { svg: string; dimensions: { width: number; height: number } }>;
}

export const assetCache = writable<AssetCache>({
	letterSVGs: new Map(),
	dashSVG: null,
	dotSVG: null,
	numberSVGs: new Map()
});

// For dimensions and layout calculations
export interface Rect {
	left: number;
	right: number;
	top: number;
	bottom: number;
	width: number;
	height: number;
}

// One-time fetch and parse of SVG dimensions
export const fetchSVGDimensions = async (
	path: string
): Promise<{ width: number; height: number }> => {
	try {
		const response = await fetch(path);
		if (!response.ok) throw new Error(`Failed to fetch ${path}: ${response.status}`);

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
};

// Preload common assets (dot, dash, and common letters)
export const preloadCommonAssets = async (): Promise<void> => {
	const dashPath = '/images/dash.svg';
	const dotPath = '/images/same_opp_dot.svg';

	// Common letters to preload (A-Z)
	const commonLetters = Array.from(
		{ length: 26 },
		(_, i) => String.fromCharCode(65 + i) as unknown as Letter
	);

	try {
		// First load dash and dot
		const [dashDimensions, dotDimensions] = await Promise.all([
			fetchSVGDimensions(dashPath),
			fetchSVGDimensions(dotPath)
		]);

		assetCache.update((cache) => ({
			...cache,
			dashSVG: { svg: dashPath, dimensions: dashDimensions },
			dotSVG: { svg: dotPath, dimensions: dotDimensions }
		}));

		// Then preload common letters in batches to avoid overwhelming the browser
		const batchSize = 5;
		for (let i = 0; i < commonLetters.length; i += batchSize) {
			const batch = commonLetters.slice(i, i + batchSize);

			// Create promises for each letter in the batch
			const letterPromises = batch.map(async (letter) => {
				try {
					const path = getLetterPath(letter);
					const dimensions = await fetchSVGDimensions(path);

					// Update the cache with this letter
					assetCache.update((cache) => {
						const newCache = { ...cache };
						newCache.letterSVGs.set(letter.toString(), {
							svg: path,
							dimensions
						});
						return newCache;
					});

					return { letter, success: true };
				} catch (error) {
					console.warn(`Failed to preload letter ${letter}:`, error);
					return { letter, success: false };
				}
			});

			// Wait for this batch to complete before moving to the next
			await Promise.allSettled(letterPromises);
		}
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
