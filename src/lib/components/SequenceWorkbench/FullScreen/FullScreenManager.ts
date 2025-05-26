import {
	isSequenceFullScreen,
	enterSequenceFullScreen,
	exitSequenceFullScreen
} from '$lib/stores/sequence/sequenceOverlayState';

/**
 * Interface for the full screen manager return value
 */
export interface FullScreenManagerResult {
	isFullScreen: boolean;
	openFullScreen: () => void;
	closeFullScreen: () => void;
}

/**
 * Manages the full screen state for the sequence widget using Svelte 5 runes
 * @returns Object with full screen state and functions
 */
export function useFullScreenManager(): FullScreenManagerResult {
	// Define the functions to open and close fullscreen
	function openFullScreen() {
		enterSequenceFullScreen();
	}

	function closeFullScreen() {
		exitSequenceFullScreen();
	}

	// Return the manager object with reactive getter
	return {
		get isFullScreen() {
			return isSequenceFullScreen();
		},
		openFullScreen,
		closeFullScreen
	};
}
