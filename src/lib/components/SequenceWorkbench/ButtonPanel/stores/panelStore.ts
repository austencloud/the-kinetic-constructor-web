// src/lib/components/SequenceWorkbench/ButtonPanel/stores/panelStore.ts
import { writable, derived } from 'svelte/store';
import type { PanelState, LayoutOrientation } from '../types';
import { browser } from '$app/environment'; // Import browser check

// Initial panel state
const initialState: PanelState = {
	isVisible: true,
	isAnimatingOut: false,
	isPulsing: true,
	layout: 'horizontal' // Default layout
};

// Create the panel state store
const createPanelStore = () => {
	const { subscribe, update, set } = writable<PanelState>(initialState);

	return {
		subscribe,

		// Toggle panel visibility with animation coordination
		toggle: () => {
			update((state) => {
				if (state.isVisible) {
					// Start animation out if currently visible
					return { ...state, isAnimatingOut: true, isPulsing: false };
				} else {
					// Show immediately when opening (fly-in animation handles visual entry)
					// Ensure isAnimatingOut is false when opening
					return { ...state, isVisible: true, isAnimatingOut: false, isPulsing: false };
				}
			});
			// NOTE: The completion of the hide animation (setting isVisible = false)
			// is now handled by a timeout in ButtonPanel.svelte watching isAnimatingOut
		},

		// Called after hide animation timeout completes
		completeHideAnimation: () => {
			update((state) => {
				// Only update state if we are actually in the process of animating out
				if (state.isAnimatingOut) {
					return { ...state, isVisible: false, isAnimatingOut: false };
				}
				// Otherwise, return the state unchanged
				return state;
			});
		},

		// Update layout orientation
		setLayout: (layout: LayoutOrientation) => {
			update((state) => ({ ...state, layout }));
		},

		// Stop pulsing animation (e.g., after timeout or first click)
		stopPulsing: () => {
			update((state) => {
				// Only update if it's currently pulsing
				if (state.isPulsing) {
					return { ...state, isPulsing: false };
				}
				return state;
			});
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
		// Mobile calculation based on width
		return Math.max(30, Math.min(60, effectiveWidth / 10));
	} else if (isPortrait) {
		// Desktop portrait calculation based on width
		return Math.max(30, Math.min(60, effectiveWidth / 10));
	} else {
		// Desktop landscape calculation based on height
		return Math.max(30, Math.min(60, effectiveHeight / 14));
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
