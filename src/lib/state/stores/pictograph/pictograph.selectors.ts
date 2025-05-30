/**
 * Pictograph Selectors - Svelte 5 Runes Implementation
 */

import { pictographStore } from './pictograph.store';

export const pictographSelectors = {
	current: () => pictographStore.current,
	isLoading: () => pictographStore.isLoading,
	error: () => pictographStore.error,
	hasError: () => pictographStore.error !== null,
	isReady: () => pictographStore.current !== null && !pictographStore.isLoading
};
