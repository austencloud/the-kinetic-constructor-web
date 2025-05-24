// src/lib/stores/sequence/sequenceOverlayStore.ts
import { writable } from 'svelte/store';

// Create a store to track the overlay state of the sequence
export const isSequenceFullScreen = writable<boolean>(false);

// Helper functions to manipulate the store
export function openSequenceFullScreen() {
	isSequenceFullScreen.set(true);
}

export function closeSequenceFullScreen() {
	isSequenceFullScreen.set(false);
}

export function toggleSequenceFullScreen() {
	isSequenceFullScreen.update((value) => {
		return !value;
	});
}
