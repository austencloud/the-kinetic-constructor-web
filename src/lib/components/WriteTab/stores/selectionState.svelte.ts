/**
 * WriteTab Selection State Management with Svelte 5 Runes
 *
 * Modern replacement for selectionStore.ts using Svelte 5 runes
 */

// Define the selection state interface
export interface SelectionState {
	selectedRow: number | null;
	selectedCol: number | null;
}

// Create the initial state
const initialState: SelectionState = {
	selectedRow: null,
	selectedCol: null
};

// Create the selection state using Svelte 5 runes
export const selectionState = $state<SelectionState>({ ...initialState });

// Action functions for selection management
export const selectionActions = {
	/**
	 * Select a beat at the specified row and column
	 */
	selectBeat(row: number, col: number) {
		selectionState.selectedRow = row;
		selectionState.selectedCol = col;
	},

	/**
	 * Clear the current selection
	 */
	clearSelection() {
		selectionState.selectedRow = null;
		selectionState.selectedCol = null;
	},

	/**
	 * Check if a specific beat is selected
	 */
	isBeatSelected(row: number, col: number): boolean {
		return selectionState.selectedRow === row && selectionState.selectedCol === col;
	},

	/**
	 * Get the currently selected position
	 */
	getSelectedPosition(): { row: number; col: number } | null {
		if (selectionState.selectedRow !== null && selectionState.selectedCol !== null) {
			return {
				row: selectionState.selectedRow,
				col: selectionState.selectedCol
			};
		}
		return null;
	}
};

// Derived states for convenience as functions (Svelte 5 requirement)
export function selectedRow() {
	return selectionState.selectedRow;
}

export function selectedCol() {
	return selectionState.selectedCol;
}

export function hasSelection() {
	return selectionState.selectedRow !== null && selectionState.selectedCol !== null;
}

// Create derived state for the currently selected beat
// This will be imported and used where needed to avoid circular dependencies
export function createSelectedBeatDerived(actSequences: any) {
	return $derived.by(() => {
		const { selectedRow, selectedCol } = selectionState;

		if (selectedRow === null || selectedCol === null) {
			return null;
		}

		const sequences = actSequences;
		if (selectedRow < sequences.length) {
			const sequence = sequences[selectedRow];
			if (selectedCol < sequence.beats.length) {
				return {
					beat: sequence.beats[selectedCol],
					row: selectedRow,
					col: selectedCol
				};
			}
		}

		return null;
	});
}

// Backward compatibility export
export { selectionState as selectionStore };
