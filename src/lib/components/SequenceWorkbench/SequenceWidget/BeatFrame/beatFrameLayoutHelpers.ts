// src/lib/BeatFrame/beatFrameHelpers.ts
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

export function calculateCellSize(
	containerWidth: number,
	containerHeight: number,
	totalRows: number,
	totalCols: number,
	gap: number
): number {
	// total gap space
	const totalHorizontalGap = (totalCols - 1) * gap;
	const totalVerticalGap = (totalRows - 1) * gap;

	// Remaining space for actual cells
	const availableWidth = Math.max(0, containerWidth - totalHorizontalGap);
	const availableHeight = Math.max(0, containerHeight - totalVerticalGap);

	// Each row is same height, each col is same width => pick min for squares
	const cellWidth = availableWidth / totalCols;
	const cellHeight = availableHeight / totalRows;
	let size = Math.floor(Math.min(cellWidth, cellHeight));

	// Ensure we don’t go negative
	size = Math.max(size, 0);
	return size;
}
