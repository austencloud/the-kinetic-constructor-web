/**
 * Sequence Machine Reactive State - Svelte 5 Runes
 *
 * This file contains the reactive state for the sequence machine using Svelte 5 runes.
 * It can only be imported by .svelte or .svelte.ts files.
 */

import { browser } from '$app/environment';
import type { PictographData } from '$lib/types/PictographData';

// Reactive state using Svelte 5 runes
export let selectedStartPosition = $state<PictographData | null>(null);
export let isSequenceEmpty = $state(true);

// Storage keys
const START_POSITION_STORAGE_KEY = 'selected_start_position';

/**
 * Initialize the sequence machine state
 */
export function initializeSequenceMachineState() {
	if (!browser) return;

	// Load persisted start position
	try {
		const savedStartPos = localStorage.getItem(START_POSITION_STORAGE_KEY);
		if (savedStartPos) {
			selectedStartPosition = JSON.parse(savedStartPos);
		}
	} catch (error) {
		console.warn('Failed to load start position from localStorage:', error);
		selectedStartPosition = null;
	}
}

/**
 * Set the selected start position
 */
export function setSelectedStartPosition(startPos: PictographData | null) {
	selectedStartPosition = startPos;

	if (browser) {
		try {
			if (startPos) {
				localStorage.setItem(START_POSITION_STORAGE_KEY, JSON.stringify(startPos));
			} else {
				localStorage.removeItem(START_POSITION_STORAGE_KEY);
			}
		} catch (error) {
			console.warn('Failed to save start position to localStorage:', error);
		}
	}
}

/**
 * Clear the selected start position
 */
export function clearSelectedStartPosition() {
	setSelectedStartPosition(null);
}

/**
 * Set the sequence empty state
 */
export function setSequenceEmpty(isEmpty: boolean) {
	isSequenceEmpty = isEmpty;
}

/**
 * Get the current start position (for use in reactive contexts)
 */
export function getSelectedStartPosition(): PictographData | null {
	return selectedStartPosition;
}

/**
 * Get the current sequence empty state (for use in reactive contexts)
 */
export function getIsSequenceEmpty(): boolean {
	return isSequenceEmpty;
}

// Initialize on module load
if (browser) {
	initializeSequenceMachineState();
}

// Export reactive getters for components that need to access the state as functions (Svelte 5 requirement)
export function startPositionState() {
	return selectedStartPosition;
}

export function sequenceEmptyState() {
	return isSequenceEmpty;
}
