/**
 * WriteTab Selection State - Modern Svelte 5 runes-based selection management
 */

import { actState } from '../state/actState.svelte';

// Create reactive selection state using Svelte 5 runes
class SelectionState {
	selectedRow = $state<number | null>(null);
	selectedCol = $state<number | null>(null);

	// Derived state for the currently selected beat
	selectedBeat = $derived(() => {
		if (this.selectedRow === null || this.selectedCol === null) {
			return null;
		}

		const sequences = actState.act.sequences;
		if (this.selectedRow < sequences.length) {
			const sequence = sequences[this.selectedRow];
			if (this.selectedCol < sequence.beats.length) {
				return {
					beat: sequence.beats[this.selectedCol],
					row: this.selectedRow,
					col: this.selectedCol
				};
			}
		}

		return null;
	});

	// Select a beat at the specified row and column
	selectBeat(row: number, col: number) {
		this.selectedRow = row;
		this.selectedCol = col;
	}

	// Clear the current selection
	clearSelection() {
		this.selectedRow = null;
		this.selectedCol = null;
	}
}

// Create and export the singleton instance
export const selectionState = new SelectionState();

// Legacy exports for backward compatibility during migration
export const selectionStore = {
	subscribe: () => {
		console.warn(
			'selectionStore.subscribe is deprecated. Use selectionState directly with Svelte 5 runes.'
		);
		return () => {};
	},
	selectBeat: (row: number, col: number) => selectionState.selectBeat(row, col),
	clearSelection: () => selectionState.clearSelection()
};

export const selectedBeat = {
	subscribe: () => {
		console.warn(
			'selectedBeat.subscribe is deprecated. Use selectionState.selectedBeat directly with Svelte 5 runes.'
		);
		return () => {};
	}
};
