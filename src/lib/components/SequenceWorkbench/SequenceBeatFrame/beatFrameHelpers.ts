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

// Updated calculateCellSize function
export function calculateCellSize(
	containerWidth: number,
	containerHeight: number,
	totalRows: number,
	totalCols: number,
	gap: number
): number {
	// Calculate available space after accounting for gaps
	const availableWidth = containerWidth - (totalCols - 1) * gap;
	const availableHeight = containerHeight - (totalRows - 1) * gap;

	// Calculate scale factors with 1px buffer
	const scaleX = (availableWidth - 1) / (950 * totalCols);
	const scaleY = (availableHeight - 1) / (950 * totalRows);

	return 950 * Math.min(scaleX, scaleY, 1);
}
export function autoAdjustLayout(beatCount: number): [number, number] {
	if (beatCount <= 16) return [4, 4]; // 4x4 grid
	if (beatCount <= 32) return [4, 8]; // 4x8 grid
	if (beatCount <= 48) return [6, 8]; // 6x8 grid
	return [8, 8]; // Max 8x8 grid
}
