// src/lib/components/SequenceWorkbench/SequenceBeatFrame/beatFrameHelpers.ts

export type LayoutDict = Record<string, [number, number]>;

export async function fetchDefaultLayouts(url: string): Promise<LayoutDict> {
	try {
		const resp = await fetch(url);
		if (!resp.ok) throw new Error(`Failed to fetch layouts from ${url}`);
		const data: LayoutDict = await resp.json();
		return data;
	} catch (err) {
		console.error('fetchDefaultLayouts error =>', err);
		// Return an empty dictionary so the caller can fallback
		return {};
	}
}

export function applyLayout(
	defaultLayouts: LayoutDict,
	beatCount: number,
	fallback: [number, number] = [4, 4]
): [number, number] {
	const key = String(beatCount);
	if (defaultLayouts[key]) {
		return defaultLayouts[key];
	}
	return fallback;
}

/**
 * Calculate the optimal cell size for the beat frame grid
 * @param beatCount Number of beats in the sequence
 * @param containerWidth Width of the container
 * @param containerHeight Height of the container
 * @param totalRows Number of rows in the grid
 * @param totalCols Number of columns in the grid
 * @param gap Gap between cells
 * @returns Optimal cell size in pixels
 */
export function calculateCellSize(
	beatCount: number,
	containerWidth: number,
	containerHeight: number,
	totalRows: number,
	totalCols: number,
	gap: number
): number {
	// Ensure we have valid dimensions
	if (containerWidth <= 0 || containerHeight <= 0 || totalRows <= 0 || totalCols <= 0) {
		return 80; // Default fallback size
	}

	// Calculate total space needed for gaps
	const totalGapWidth = gap * (totalCols - 1);
	const totalGapHeight = gap * (totalRows - 1);

	// Calculate available space after accounting for gaps and padding
	const padding = beatCount === 0 ? containerWidth * 0.1 : 16; // Larger padding when only start position
	const availableWidth = Math.max(0, containerWidth - totalGapWidth - padding * 2);

	// Calculate cell size based on available space in both dimensions
	const cellWidthByContainer = Math.floor(availableWidth / totalCols);

	// Use the smaller dimension to maintain square cells and prevent overflow
	const baseSize = cellWidthByContainer

	// For start position only, make it proportionally larger
	const cellSize = beatCount === 0 ? baseSize * 1.2 : baseSize;

	// Detect if we're in fullscreen mode by checking container dimensions
	// Fullscreen containers are typically much larger
	const isLikelyFullscreen = containerWidth > 800 && containerHeight > 600;

	// Apply different constraints based on mode
	if (isLikelyFullscreen) {
		// In fullscreen, allow larger cells but ensure they're not too large
		// This helps ensure pictographs are displayed side by side correctly
		return Math.min(Math.max(cellSize, 80), 250); // Min 80px, Max 250px for fullscreen
	} else {
		// In normal mode, use more conservative constraints
		return Math.min(Math.max(cellSize, 60), 200); // Min 60px, Max 200px for normal view
	}
}

const beatCountGridMap: Record<number, [number, number]> = {
	1: [1, 1], // One beat + start position
	2: [1, 2],
	3: [1, 3],
	4: [1, 4],
	5: [2, 4],
	6: [2, 4],
	7: [2, 4],
	8: [2, 4],
	9: [3, 4],
	10: [3, 4],
	11: [3, 4],
	12: [3, 4],
	13: [4, 4],
	14: [4, 4],
	15: [4, 4],
	16: [4, 4],
	17: [5, 4],
	18: [5, 4],
	19: [5, 4],
	20: [5, 4],
	21: [6, 4],
	22: [6, 4],
	23: [6, 4],
	24: [6, 4],
	25: [7, 4],
	26: [7, 4],
	27: [7, 4],
	28: [7, 4],
	29: [8, 4],
	30: [8, 4],
	31: [8, 4],
	32: [8, 4]
};

export function autoAdjustLayout(beatCount: number): [number, number] {
	// For empty sequence or only start position, use single column layout
	if (beatCount <= 0) return [1, 1];
	if (beatCount === 1) return [1, 1]; // Single beat + start position

	// Use predefined layouts for common beat counts
	if (beatCount <= 32 && beatCountGridMap[beatCount]) {
		return beatCountGridMap[beatCount];
	}

	// Default layout for larger sequences
	const cols = 4;
	const rows = Math.ceil(beatCount / cols);
	return [rows, cols];
}
