/**
 * Pictograph Store - Svelte 5 Runes Implementation
 */

import type { PictographData } from '$lib/types/PictographData';

interface PictographState {
	current: PictographData | null;
	isLoading: boolean;
	error: string | null;
}

function createPictographStore() {
	let current = $state<PictographData | null>(null);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	return {
		get current() { return current; },
		get isLoading() { return isLoading; },
		get error() { return error; },
		
		setCurrent(pictograph: PictographData | null) {
			current = pictograph;
		},
		
		setLoading(loading: boolean) {
			isLoading = loading;
		},
		
		setError(errorMessage: string | null) {
			error = errorMessage;
		},
		
		reset() {
			current = null;
			isLoading = false;
			error = null;
		}
	};
}

export const pictographStore = createPictographStore();
