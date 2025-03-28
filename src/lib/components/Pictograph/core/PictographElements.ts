import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { Motion } from '$lib/components/objects/Motion/Motion';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import { writable } from 'svelte/store';

export function createPictographElements() {
	return {
		gridData: writable<GridData | null>(null),
		redPropData: writable<PropData | null>(null),
		bluePropData: writable<PropData | null>(null),
		redArrowData: writable<ArrowData | null>(null),
		blueArrowData: writable<ArrowData | null>(null),
		redMotion: writable<Motion | null>(null),
		blueMotion: writable<Motion | null>(null)
	};
}

export type PictographElementStores = ReturnType<typeof createPictographElements>;
