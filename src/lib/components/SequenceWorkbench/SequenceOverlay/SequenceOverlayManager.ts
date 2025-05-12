import {
	isSequenceFullScreen,
	openSequenceFullScreen,
	closeSequenceFullScreen
} from '$lib/stores/sequence/sequenceOverlayStore';
import { onDestroy } from 'svelte';

/**
 * Interface for the sequence overlay manager return value
 */
export interface SequenceOverlayManagerResult {
	isFullScreen: boolean;
	openFullScreen: () => void;
	closeFullScreen: () => void;
}

/**
 * Manages the overlay state for the sequence widget
 * @returns Object with overlay state and functions
 */
export function useSequenceOverlayManager(): SequenceOverlayManagerResult {
	// Create a variable to hold the current state
	let isFullScreen = false;

	// Subscribe to the store to keep the value updated
	const unsubscribe = isSequenceFullScreen.subscribe((value) => {
		isFullScreen = value;
	});

	// Clean up subscription on component destroy
	onDestroy(() => {
		unsubscribe();
	});

	// Define the functions to open and close overlay
	function openFullScreen() {
		console.log('Opening sequence overlay from manager');
		openSequenceFullScreen();
	}

	function closeFullScreen() {
		console.log('Closing sequence overlay from manager');
		closeSequenceFullScreen();
	}

	// Return the manager object
	return {
		get isFullScreen() {
			return isFullScreen;
		},
		openFullScreen,
		closeFullScreen
	};
}
