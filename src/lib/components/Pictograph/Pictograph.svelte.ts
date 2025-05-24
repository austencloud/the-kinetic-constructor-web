/**
 * Pictograph Component with Svelte 5 Runes
 *
 * This file provides pure Svelte 5 runes utilities for the Pictograph component.
 * It uses only runes-based state management without any store integration.
 */

import { untrack } from 'svelte';
import type { PictographData } from '$lib/types/PictographData';

/**
 * Creates a pictograph state with update methods using pure Svelte 5 runes
 */
export function createPictographState(initialData?: PictographData) {
	// Create state using pure runes
	let state = $state({
		data: initialData || null,
		isLoading: false,
		error: null,
		components: {
			grid: { loaded: false },
			redProp: { loaded: false },
			blueProp: { loaded: false },
			redArrow: { loaded: false },
			blueArrow: { loaded: false },
			glyph: { loaded: false }
		}
	});

	// Create update function
	const update = (newState: Partial<typeof state>) => {
		untrack(() => {
			Object.assign(state, newState);
		});
	};

	// Create reset function
	const reset = () => {
		untrack(() => {
			state.data = initialData || null;
			state.isLoading = false;
			state.error = null;
			state.components = {
				grid: { loaded: false },
				redProp: { loaded: false },
				blueProp: { loaded: false },
				redArrow: { loaded: false },
				blueArrow: { loaded: false },
				glyph: { loaded: false }
			};
		});
	};

	return { state, update, reset };
}

/**
 * Creates an effect for handling pictograph data changes
 */
export function createPictographEffect(
	data: PictographData | undefined,
	onDataChange: (data: PictographData) => void
) {
	// Use a regular effect with untrack to prevent infinite loops
	$effect(() => {
		if (data) {
			untrack(() => {
				onDataChange(data);
			});
		}
	});
}
