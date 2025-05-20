/**
 * Edit Mode Store
 *
 * Manages the state of the edit mode in the sequence workbench,
 * controlling whether to show the GraphEditor or OptionPicker.
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { sequenceContainer } from './sequence/SequenceContainer';

// Interface for the store state
interface EditModeState {
	isEditMode: boolean;
	isSelectionMode: boolean;
	showTooltip: boolean;
	tooltipPosition: { x: number; y: number } | null;
}

// Create the store with default values
function createEditModeStore() {
	// Initialize with default values
	const initialState: EditModeState = {
		isEditMode: false,
		isSelectionMode: false,
		showTooltip: false,
		tooltipPosition: null
	};

	// Create the writable store
	const { subscribe, set, update } = writable<EditModeState>(initialState);

	// Return the store with custom methods
	return {
		subscribe,

		// Toggle edit mode
		toggleEditMode: () => {
			const currentState = get({ subscribe });
			const hasSelectedBeats = sequenceContainer.state.selectedBeatIds.length > 0;

			if (currentState.isEditMode) {
				// If already in edit mode, exit edit mode
				update((state) => ({
					...state,
					isEditMode: false,
					isSelectionMode: false,
					showTooltip: false
				}));
			} else if (hasSelectedBeats) {
				// If beats are selected, enter edit mode
				update((state) => ({
					...state,
					isEditMode: true,
					isSelectionMode: false,
					showTooltip: false
				}));
			} else {
				// If no beats are selected, enter selection mode
				update((state) => ({
					...state,
					isSelectionMode: true,
					showTooltip: true
				}));
			}
		},

		// Set edit mode explicitly
		setEditMode: (isEditMode: boolean) => {
			update((state) => ({
				...state,
				isEditMode,
				isSelectionMode: false,
				showTooltip: false
			}));
		},

		// Enter selection mode
		enterSelectionMode: () => {
			update((state) => ({
				...state,
				isSelectionMode: true,
				showTooltip: true
			}));
		},

		// Exit selection mode
		exitSelectionMode: () => {
			update((state) => ({
				...state,
				isSelectionMode: false,
				showTooltip: false
			}));
		},

		// Set tooltip position
		setTooltipPosition: (position: { x: number; y: number } | null) => {
			update((state) => ({
				...state,
				tooltipPosition: position
			}));
		},

		// Show tooltip
		showTooltip: () => {
			update((state) => ({
				...state,
				showTooltip: true
			}));
		},

		// Hide tooltip
		hideTooltip: () => {
			update((state) => ({
				...state,
				showTooltip: false
			}));
		},

		// Reset to default state
		reset: () => {
			set(initialState);
		}
	};
}

// Create the store instance
export const editModeStore = createEditModeStore();
