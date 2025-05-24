/**
 * WriteTab UI State Management with Svelte 5 Runes
 *
 * Modern replacement for uiStore.ts using Svelte 5 runes
 */

import { browser } from '$app/environment';
import { createPersistentObjectState } from '$lib/state/core/runes.svelte';

// Define the UI state interface
export interface UIState {
	isBrowserPanelOpen: boolean;
	browserPanelWidth: number;
	scrollPosition: {
		beatGrid: number;
		cueScroll: number;
	};
	gridSettings: {
		cellSize: number;
	};
	preferences: {
		confirmDeletions: boolean;
	};
}

// Create the initial state
const initialState: UIState = {
	isBrowserPanelOpen: true,
	browserPanelWidth: 300, // Default browser panel width in pixels
	scrollPosition: {
		beatGrid: 0,
		cueScroll: 0
	},
	gridSettings: {
		cellSize: 80 // Default cell size in pixels
	},
	preferences: {
		confirmDeletions: true // Default to showing confirmation dialogs
	}
};

// Create persistent state that syncs with localStorage
export const uiState = createPersistentObjectState('write_tab_ui_state', initialState, {
	debounceMs: 300
});

// Action functions for UI state management
export const uiActions = {
	/**
	 * Toggle the browser panel open/closed state
	 */
	toggleBrowserPanel() {
		uiState.isBrowserPanelOpen = !uiState.isBrowserPanelOpen;
	},

	/**
	 * Set the browser panel open/closed state
	 */
	setBrowserPanelOpen(isOpen: boolean) {
		uiState.isBrowserPanelOpen = isOpen;
	},

	/**
	 * Update the scroll position for the beat grid
	 */
	updateBeatGridScroll(position: number) {
		uiState.scrollPosition.beatGrid = position;
	},

	/**
	 * Update the scroll position for the cue scroll
	 */
	updateCueScrollPosition(position: number) {
		uiState.scrollPosition.cueScroll = position;
	},

	/**
	 * Sync the scroll positions between beat grid and cue scroll
	 */
	syncScrollPositions(position: number) {
		uiState.scrollPosition.beatGrid = position;
		uiState.scrollPosition.cueScroll = position;
	},

	/**
	 * Update the grid cell size
	 */
	updateCellSize(size: number) {
		uiState.gridSettings.cellSize = size;
	},

	/**
	 * Zoom in by increasing the cell size
	 */
	zoomIn() {
		const newSize = Math.min(uiState.gridSettings.cellSize + 20, 200); // Max size 200px
		uiState.gridSettings.cellSize = newSize;
	},

	/**
	 * Zoom out by decreasing the cell size
	 */
	zoomOut() {
		const newSize = Math.max(uiState.gridSettings.cellSize - 20, 40); // Min size 40px
		uiState.gridSettings.cellSize = newSize;
	},

	/**
	 * Update the browser panel width
	 */
	updateBrowserPanelWidth(width: number) {
		// Constrain width between 200px and 1200px
		const constrainedWidth = Math.max(200, Math.min(1200, width));
		uiState.browserPanelWidth = constrainedWidth;
	},

	/**
	 * Toggle whether to show confirmation dialogs for deletions
	 */
	toggleConfirmDeletions(value?: boolean) {
		uiState.preferences.confirmDeletions =
			value !== undefined ? value : !uiState.preferences.confirmDeletions;
	},

	/**
	 * Reset the UI state to defaults
	 */
	reset() {
		Object.assign(uiState, initialState);
	}
};

// Derived state functions for convenience
export function isBrowserPanelOpen() {
	return uiState.isBrowserPanelOpen;
}

export function browserPanelWidth() {
	return uiState.browserPanelWidth;
}

export function beatGridScroll() {
	return uiState.scrollPosition.beatGrid;
}

export function cueScrollPosition() {
	return uiState.scrollPosition.cueScroll;
}

export function cellSize() {
	return uiState.gridSettings.cellSize;
}

export function confirmDeletions() {
	return uiState.preferences.confirmDeletions;
}

// Backward compatibility export
export { uiState as uiStore };
