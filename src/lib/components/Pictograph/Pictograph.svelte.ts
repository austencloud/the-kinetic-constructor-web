/**
 * Pictograph Component with Svelte 5 Runes
 *
 * This file provides pure Svelte 5 runes utilities for the Pictograph component.
 * It uses only runes-based state management without any store integration.
 */

import { safeEffect, createSafeState } from '$lib/state/core/svelte5-integration.svelte';
import type { PictographData } from '$lib/types/PictographData';

/**
 * Creates a safe pictograph state with update methods
 */
export function createPictographState(initialData?: PictographData) {
	// Create a safe state object with default values
	return createSafeState({
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
}

/**
 * Creates a safe effect for handling pictograph data changes
 */
export function createPictographEffect(
	data: PictographData | undefined,
	onDataChange: (data: PictographData) => void
) {
	// Use a safe effect to prevent infinite loops
	safeEffect(() => {
		if (data) {
			onDataChange(data);
		}
	});
}
