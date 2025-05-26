// src/lib/components/SequenceWorkbench/ButtonPanel/stores/panelStore.ts
import type { PanelState, LayoutOrientation } from '../types';
import { browser } from '$app/environment'; // Import browser check

// Initial panel state
const initialState: PanelState = {
	layout: 'horizontal' // Default layout
};

// Create reactive panel state with Svelte 5 runes
let internalPanelState = $state<PanelState>({ ...initialState });

// Export the panel state instance
export const panelState = {
	// State getter
	get state() {
		return internalPanelState;
	},

	// Update layout orientation
	setLayout: (layout: LayoutOrientation) => {
		internalPanelState = { ...internalPanelState, layout };
	},

	// Reset store to initial state
	reset: () => {
		internalPanelState = { ...initialState };
	}
};

// Number of buttons to account for in sizing (update this if buttons count changes)
const TYPICAL_BUTTON_COUNT = 7;
const BUTTON_GAP = 12; // Gap between buttons (matches CSS in ButtonsContainer)
const BUTTON_PADDING = 8 * 2; // Padding on both sides (matches CSS in ButtonsContainer)

// Helper function (extracted from original component)
function calculateButtonSize(width: number, height: number, isPortrait: boolean): number {
	// Check for browser environment for window access if needed, though here width/height are passed in
	const isMobile = browser ? window.innerWidth <= 768 : width <= 768; // Example of browser check if needed

	// Calculate available space for buttons
	let maxSize: number;

	if (isPortrait || isMobile) {
		// For horizontal layout (portrait or mobile), divide the width
		const availableWidth = width - BUTTON_PADDING;
		// Account for button count and gaps between buttons
		maxSize = (availableWidth - BUTTON_GAP * (TYPICAL_BUTTON_COUNT - 1)) / TYPICAL_BUTTON_COUNT;
	} else {
		// For vertical layout (landscape desktop), use height with more breathing room
		const availableHeight = height - BUTTON_PADDING;
		maxSize = (availableHeight - BUTTON_GAP * (TYPICAL_BUTTON_COUNT - 1)) / TYPICAL_BUTTON_COUNT;
	}

	// Enforce min/max boundaries for aesthetics and usability
	return Math.max(28, Math.min(55, maxSize));
}

// Export the calculation function directly
// This function can be called with dimensions to get the button size
export function calculateButtonSizeForDimensions(
	width: number,
	height: number,
	isPortrait: boolean
): number {
	// Access panelState to ensure reactivity if layout influences size
	const currentLayout = internalPanelState.layout;

	// Call the helper function with the provided arguments
	return calculateButtonSize(width, height, isPortrait);
}
