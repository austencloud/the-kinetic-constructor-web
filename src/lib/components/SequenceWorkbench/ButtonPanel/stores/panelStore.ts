// src/lib/components/SequenceWorkbench/ButtonPanel/stores/panelStore.ts
import { writable, derived } from 'svelte/store';
import type { PanelState, LayoutOrientation } from '../types';
import { browser } from '$app/environment'; // Import browser check

// Initial panel state
const initialState: PanelState = {
	layout: 'horizontal' // Default layout
};

// Create the panel state store
const createPanelStore = () => {
	const { subscribe, update, set } = writable<PanelState>(initialState);

	return {
		subscribe,

		// Update layout orientation
		setLayout: (layout: LayoutOrientation) => {
			update((state) => ({ ...state, layout }));
		},

		// Reset store to initial state
		reset: () => set(initialState)
	};
};

// Export the panel store instance
export const panelStore = createPanelStore();

// --- Derived Store for Button Size Calculation ---

// Helper function (extracted from original component)
function calculateButtonSize(width: number, height: number, isPortrait: boolean): number {
	// Check for browser environment for window access if needed, though here width/height are passed in
	const isMobile = browser ? window.innerWidth <= 768 : width <= 768; // Example of browser check if needed

	// Use passed width/height primarily
	const effectiveWidth = width;
	const effectiveHeight = height;

	if (isMobile) {
		// Mobile calculation based on width - slightly smaller
		return Math.max(28, Math.min(55, effectiveWidth / 11));
	} else if (isPortrait) {
		// Desktop portrait calculation based on width - slightly smaller
		return Math.max(28, Math.min(55, effectiveWidth / 11));
	} else {
		// Desktop landscape calculation based on height - slightly smaller
		return Math.max(28, Math.min(55, effectiveHeight / 15));
	}
}

// Derived store that provides the calculation *function*
// It depends on the panelStore only to potentially trigger recalculation if needed,
// but the calculation itself uses arguments passed to the returned function.
export const buttonSizeStore = derived<
	[typeof panelStore], // Depends on panelStore only to ensure reactivity if layout influenced size
	(width: number, height: number, isPortrait: boolean) => number
>([panelStore], ([$panelState]) => {
	// The derived store's value *is* the calculation function
	return (width: number, height: number, isPortrait: boolean): number => {
		// Call the helper function with the provided arguments
		return calculateButtonSize(width, height, isPortrait);
	};
});
