/**
 * Edit Mode Store
 *
 * Manages the state of the edit mode in the sequence workbench,
 * controlling whether to show the GraphEditor or OptionPicker.
 */

import { sequenceContainer } from './sequence/SequenceContainer.svelte';

// Interface for the store state
interface EditModeState {
	isEditMode: boolean;
	isSelectionMode: boolean;
	showTooltip: boolean;
	tooltipPosition: { x: number; y: number } | null;
}

// Create reactive edit mode state with Svelte 5 runes
function createEditModeState() {
	// Initialize with default values
	const initialState: EditModeState = {
		isEditMode: false,
		isSelectionMode: false,
		showTooltip: false,
		tooltipPosition: null
	};

	// Create reactive state
	let state = $state<EditModeState>({ ...initialState });

	// Return the store with custom methods
	return {
		// State getter
		get state() {
			return state;
		},

		// Toggle edit mode
		toggleEditMode: () => {
			const hasSelectedBeats = sequenceContainer.state.selectedBeatIds.length > 0;

			if (state.isEditMode) {
				// If already in edit mode, exit edit mode
				state = {
					...state,
					isEditMode: false,
					isSelectionMode: false,
					showTooltip: false
				};
			} else if (hasSelectedBeats) {
				// If beats are selected, enter edit mode
				state = {
					...state,
					isEditMode: true,
					isSelectionMode: false,
					showTooltip: false
				};
			} else {
				// If no beats are selected, enter selection mode
				state = {
					...state,
					isSelectionMode: true,
					showTooltip: true
				};
			}
		},

		// Set edit mode explicitly
		setEditMode: (isEditMode: boolean) => {
			state = {
				...state,
				isEditMode,
				isSelectionMode: false,
				showTooltip: false
			};
		},

		// Enter selection mode
		enterSelectionMode: () => {
			state = {
				...state,
				isSelectionMode: true,
				showTooltip: true
			};
		},

		// Exit selection mode
		exitSelectionMode: () => {
			state = {
				...state,
				isSelectionMode: false,
				showTooltip: false
			};
		},

		// Set tooltip position
		setTooltipPosition: (position: { x: number; y: number } | null) => {
			state = {
				...state,
				tooltipPosition: position
			};
		},

		// Show tooltip
		showTooltip: () => {
			state = {
				...state,
				showTooltip: true
			};
		},

		// Hide tooltip
		hideTooltip: () => {
			state = {
				...state,
				showTooltip: false
			};
		},

		// Reset to default state
		reset: () => {
			state = { ...initialState };
		}
	};
}

// Create the state instance
export const editModeState = createEditModeState();
