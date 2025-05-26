// src/lib/state/sequenceOverlay/sequenceOverlayState.svelte.ts
// MODERNIZED WITH RUNES - NO STORES!

/**
 * Interface for the sequence overlay state
 */
export interface SequenceOverlayState {
	isOpen: boolean;
}

/**
 * Centralized state for the sequence overlay using PURE RUNES
 * NO STORES - RUNES ONLY!
 */
let _sequenceOverlayState = $state<SequenceOverlayState>({
	isOpen: false
});

/**
 * Get the current sequence overlay state
 */
export function getSequenceOverlayState(): SequenceOverlayState {
	return _sequenceOverlayState;
}

/**
 * Opens the sequence overlay
 */
export function openSequenceOverlay() {
	_sequenceOverlayState.isOpen = true;
}

/**
 * Closes the sequence overlay
 */
export function closeSequenceOverlay() {
	_sequenceOverlayState.isOpen = false;
}

/**
 * Toggles the sequence overlay
 */
export function toggleSequenceOverlay() {
	_sequenceOverlayState.isOpen = !_sequenceOverlayState.isOpen;
}

// For backward compatibility, export a store-like object
export const sequenceOverlayStore = {
	get value() {
		return _sequenceOverlayState;
	},
	set value(newState: SequenceOverlayState) {
		_sequenceOverlayState = newState;
	}
};
