// src/lib/services/layoutService.ts
import type { LayoutDict } from '$lib/components/SequenceWorkbench/SequenceWidget/BeatFrame/beatFrameLayoutHelpers';
import { fetchDefaultLayouts } from '$lib/components/SequenceWorkbench/SequenceWidget/BeatFrame/beatFrameLayoutHelpers';

let layoutsCache: LayoutDict | null = null;

export async function getDefaultLayouts(): Promise<LayoutDict> {
	if (!layoutsCache) {
		layoutsCache = await fetchDefaultLayouts('/data/default_layouts.json');
	}
	return layoutsCache;
}
