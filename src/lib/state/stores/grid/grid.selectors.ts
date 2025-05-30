/**
 * Grid Selectors - Svelte 5 Runes Implementation
 */

import { gridStore } from './grid.store';

export const gridSelectors = {
	isVisible: () => gridStore.isVisible,
	opacity: () => gridStore.opacity,
	scale: () => gridStore.scale,
	isFullyVisible: () => gridStore.isVisible && gridStore.opacity > 0.5
};
