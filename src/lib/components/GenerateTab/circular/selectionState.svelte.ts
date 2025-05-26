// src/lib/components/GenerateTab/circular/store.svelte.ts
// Svelte 5 runes-based circular sequence selection store

import { untrack } from 'svelte';

export interface SequenceSelection {
	selectedBeats: number[];
	selectionMode: 'single' | 'multi' | 'range';
	lastSelectedBeat?: number;
}

// Create reactive state using Svelte 5 runes
export const selectionState = $state<SequenceSelection>({
	selectedBeats: [],
	selectionMode: 'single',
	lastSelectedBeat: undefined
});

// Guard flag to prevent reactive loops
let isProcessing = false;

// Export getter function for components that need to access the state
export function getSelectionState() {
	return selectionState;
}

// Action functions
export function selectBeat(beatIndex: number) {
	if (isProcessing) return;
	
	isProcessing = true;
	
	untrack(() => {
		switch (selectionState.selectionMode) {
			case 'single':
				selectionState.selectedBeats = [beatIndex];
				selectionState.lastSelectedBeat = beatIndex;
				break;

			case 'multi':
				const isAlreadySelected = selectionState.selectedBeats.includes(beatIndex);
				if (isAlreadySelected) {
					selectionState.selectedBeats = selectionState.selectedBeats.filter((b) => b !== beatIndex);
				} else {
					selectionState.selectedBeats = [...selectionState.selectedBeats, beatIndex];
				}
				selectionState.lastSelectedBeat = beatIndex;
				break;

			case 'range':
				const { lastSelectedBeat } = selectionState;
				if (lastSelectedBeat === undefined) {
					selectionState.selectedBeats = [beatIndex];
					selectionState.lastSelectedBeat = beatIndex;
				} else {
					const start = Math.min(lastSelectedBeat, beatIndex);
					const end = Math.max(lastSelectedBeat, beatIndex);
					const rangeBeats = Array.from({ length: end - start + 1 }, (_, i) => start + i);
					
					selectionState.selectedBeats = rangeBeats;
					selectionState.lastSelectedBeat = beatIndex;
				}
				break;
		}
	});
	
	isProcessing = false;
}

export function setSelectionMode(mode: SequenceSelection['selectionMode']) {
	if (isProcessing) return;
	
	isProcessing = true;
	untrack(() => {
		selectionState.selectionMode = mode;
	});
	isProcessing = false;
}

export function clearSelection() {
	if (isProcessing) return;
	
	isProcessing = true;
	untrack(() => {
		selectionState.selectedBeats = [];
		selectionState.lastSelectedBeat = undefined;
	});
	isProcessing = false;
}

export function isSelected(beatIndex: number): boolean {
	return selectionState.selectedBeats.includes(beatIndex);
}

export function updateSelection(updater: (state: SequenceSelection) => SequenceSelection) {
	if (isProcessing) return;
	
	isProcessing = true;
	untrack(() => {
		const newState = updater(selectionState);
		selectionState.selectedBeats = newState.selectedBeats;
		selectionState.selectionMode = newState.selectionMode;
		selectionState.lastSelectedBeat = newState.lastSelectedBeat;
	});
	isProcessing = false;
}

export function setState(newState: SequenceSelection) {
	if (isProcessing) return;
	
	isProcessing = true;
	untrack(() => {
		selectionState.selectedBeats = newState.selectedBeats;
		selectionState.selectionMode = newState.selectionMode;
		selectionState.lastSelectedBeat = newState.lastSelectedBeat;
	});
	isProcessing = false;
}

// Derived state functions (Svelte 5 requirement - cannot export $derived directly)
export function selectedBeats() {
	return selectionState.selectedBeats;
}

export function selectionMode() {
	return selectionState.selectionMode;
}

export function hasSelection() {
	return selectionState.selectedBeats.length > 0;
}

export function selectionCount() {
	return selectionState.selectedBeats.length;
}

export function isMultiSelection() {
	return selectionState.selectedBeats.length > 1;
}

export function getLastSelectedBeat() {
	return selectionState.lastSelectedBeat;
}

// Utility functions
export function selectRange(startIndex: number, endIndex: number) {
	if (isProcessing) return;
	
	const start = Math.min(startIndex, endIndex);
	const end = Math.max(startIndex, endIndex);
	const rangeBeats = Array.from({ length: end - start + 1 }, (_, i) => start + i);
	
	isProcessing = true;
	untrack(() => {
		selectionState.selectedBeats = rangeBeats;
		selectionState.lastSelectedBeat = endIndex;
	});
	isProcessing = false;
}

export function toggleBeat(beatIndex: number) {
	if (isProcessing) return;
	
	isProcessing = true;
	untrack(() => {
		const isCurrentlySelected = selectionState.selectedBeats.includes(beatIndex);
		if (isCurrentlySelected) {
			selectionState.selectedBeats = selectionState.selectedBeats.filter((b) => b !== beatIndex);
		} else {
			selectionState.selectedBeats = [...selectionState.selectedBeats, beatIndex];
		}
		selectionState.lastSelectedBeat = beatIndex;
	});
	isProcessing = false;
}

export function selectAll(maxBeatIndex: number) {
	if (isProcessing) return;
	
	isProcessing = true;
	untrack(() => {
		selectionState.selectedBeats = Array.from({ length: maxBeatIndex + 1 }, (_, i) => i);
		selectionState.lastSelectedBeat = maxBeatIndex;
	});
	isProcessing = false;
}

// Compatibility layer for old store API
export const selectionStore = {
	// Getter for state access (replaces $selectionStore)
	get state() {
		return selectionState;
	},
	
	// Subscribe method for backward compatibility (though not recommended)
	subscribe: (callback: (state: SequenceSelection) => void) => {
		// This is a simplified subscribe for backward compatibility
		// In a real implementation, you'd want to use $effect in the component instead
		callback(selectionState);
		return () => {}; // Unsubscribe function
	},
	
	// Methods
	set: setState,
	update: updateSelection,
	selectBeat,
	setSelectionMode,
	clearSelection,
	isSelected
};

// Export individual derived stores for backward compatibility
export const selectedBeatsStore = {
	get value() {
		return selectionState.selectedBeats;
	}
};

export const selectionModeStore = {
	get value() {
		return selectionState.selectionMode;
	}
};
