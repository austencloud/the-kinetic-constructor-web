// src/lib/components/Pictograph/PictographElements.ts
import { writable, type Writable } from 'svelte/store';
import type { GridData } from '../objects/Grid/GridData';
import type { Motion } from '../objects/Motion/Motion';
import type { ArrowData } from '../objects/Arrow/ArrowData';
import type { PropData } from '../objects/Prop/PropData';

/**
 * Factory function to create a structure holding Svelte stores for
 * the core visual elements and data derived during pictograph initialization.
 *
 * This structure acts as a centralized, reactive container for the elements
 * that are created by the `PictographInitializer` and consumed by the
 * rendering components and positioning logic.
 *
 * Using individual stores allows components to subscribe only to the
 * specific pieces of data they need.
 */
export function createPictographElements() {
	return {
		/** Store for the GridData object once the Grid component is ready. */
		gridData: writable<GridData | null>(null),

		/** Store for the data representing the red prop. */
		redPropData: writable<PropData | null>(null),
		/** Store for the data representing the blue prop. */
		bluePropData: writable<PropData | null>(null),

		/** Store for the data representing the red arrow. */
		redArrowData: writable<ArrowData | null>(null),
		/** Store for the data representing the blue arrow. */
		blueArrowData: writable<ArrowData | null>(null),

		/** Store for the instantiated red Motion object. */
		redMotion: writable<Motion | null>(null),
		/** Store for the instantiated blue Motion object. */
		blueMotion: writable<Motion | null>(null)
	};
}

/** Type helper for the return type of createPictographElements. */
export type PictographElementStores = ReturnType<typeof createPictographElements>;