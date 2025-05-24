/**
 * WriteTab Act State Management with Svelte 5 Runes
 *
 * Modern replacement for actStore.ts using Svelte 5 runes
 */

import type { Act, Beat } from '../models/Act';
import { createEmptyAct } from '../models/Act';
import { browser } from '$app/environment';

// Constants
const STORAGE_KEY = 'current_act';
const DEFAULT_ROWS = 24;
const DEFAULT_COLUMNS = 8;

// Define history entry for undo/redo
export interface HistoryEntry {
	act: Act;
	description: string;
	timestamp: number;
}

// Create the act state using Svelte 5 runes
export let currentAct = $state<Act>(createEmptyAct(DEFAULT_ROWS, DEFAULT_COLUMNS));
export let isLoading = $state(false);
export let error = $state<string | null>(null);
export let isDirty = $state(false);
export let history = $state<HistoryEntry[]>([]);
export let historyIndex = $state(-1);
export const maxHistorySize = 20;

// Helper function to add a history entry
function addHistoryEntry(description: string) {
	// Create a deep copy of the current act
	const actCopy = JSON.parse(JSON.stringify(currentAct)) as Act;

	// Create a new history entry
	const newEntry: HistoryEntry = {
		act: actCopy,
		description,
		timestamp: Date.now()
	};

	// Create a new history array, removing any entries after the current index
	const newHistory = history.slice(0, historyIndex + 1);

	// Add the new entry
	newHistory.push(newEntry);

	// Trim history if it exceeds the maximum size
	if (newHistory.length > maxHistorySize) {
		newHistory.shift(); // Remove the oldest entry
	}

	// Update the history state
	history = newHistory;
	historyIndex = newHistory.length - 1;
}

// Auto-save functionality
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

$effect(() => {
	if (isDirty && browser) {
		if (saveTimeout) clearTimeout(saveTimeout);

		saveTimeout = setTimeout(() => {
			actActions.save();
			saveTimeout = null;
		}, 500);
	}
});

// Action functions for act management
export const actActions = {
	/**
	 * Initialize the act store by loading from localStorage or creating a new empty act
	 */
	async initialize() {
		if (!browser) return;

		isLoading = true;
		error = null;

		try {
			const savedAct = localStorage.getItem(STORAGE_KEY);

			if (savedAct) {
				const parsedAct = JSON.parse(savedAct) as Act;
				currentAct = parsedAct;
				isDirty = false;
			} else {
				currentAct = createEmptyAct(DEFAULT_ROWS, DEFAULT_COLUMNS);
				isDirty = false;
			}
		} catch (err) {
			console.error('Failed to load act:', err);
			error = 'Failed to load act data';
			currentAct = createEmptyAct(DEFAULT_ROWS, DEFAULT_COLUMNS);
		} finally {
			isLoading = false;
		}
	},

	/**
	 * Save the current act to localStorage
	 */
	save() {
		if (!browser) return;

		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(currentAct));
			isDirty = false;
			error = null;
		} catch (err) {
			console.error('Failed to save act:', err);
			error = 'Failed to save act data';
		}
	},

	/**
	 * Update the act title
	 */
	updateTitle(title: string) {
		currentAct.title = title;
		isDirty = true;
	},

	/**
	 * Update a beat at the specified row and column
	 */
	updateBeat(row: number, col: number, beat: Partial<Beat>) {
		// Ensure the row exists
		if (row >= currentAct.sequences.length) {
			for (let i = currentAct.sequences.length; i <= row; i++) {
				currentAct.sequences.push({
					sequence_start_marker: i === 0,
					cue: '',
					timestamp: '',
					beats: Array(DEFAULT_COLUMNS)
						.fill(null)
						.map(() => ({
							step_label: '',
							is_filled: false
						}))
				});
			}
		}

		// Update the beat
		Object.assign(currentAct.sequences[row].beats[col], beat);
		isDirty = true;
	},

	/**
	 * Update a cue and timestamp for a row
	 */
	updateCueAndTimestamp(row: number, cue: string, timestamp: string) {
		// Ensure the row exists
		if (row >= currentAct.sequences.length) return;

		currentAct.sequences[row].cue = cue;
		currentAct.sequences[row].timestamp = timestamp;
		isDirty = true;
	},

	/**
	 * Populate a sequence from dropped data
	 */
	populateFromDrop(sequenceData: any, startRow: number = 0, startCol: number = 0) {
		let currentRow = startRow;
		let currentCol = startCol;

		// If we have pictograph data, populate beats
		if (sequenceData && sequenceData.beats) {
			for (const beatData of sequenceData.beats) {
				// Skip if we've reached the end of the grid
				if (currentRow >= currentAct.sequences.length) break;

				// Update the beat
				Object.assign(currentAct.sequences[currentRow].beats[currentCol], {
					pictograph_data: beatData.pictograph_data || beatData,
					step_label: beatData.step_label || '',
					is_filled: true
				});

				// Move to the next position
				currentCol++;
				if (currentCol >= DEFAULT_COLUMNS) {
					currentCol = 0;
					currentRow++;
				}
			}
		}

		isDirty = true;
	},

	/**
	 * Erase a single beat at the specified row and column
	 */
	eraseBeat(row: number, col: number) {
		// Save the current state to history before making changes
		addHistoryEntry(`Erased beat ${row * 8 + col + 1}`);

		// Ensure the row exists
		if (row >= currentAct.sequences.length) return;

		// Update the beat to be empty
		Object.assign(currentAct.sequences[row].beats[col], {
			step_label: '',
			is_filled: false,
			pictograph_data: null
		});

		isDirty = true;
	},

	/**
	 * Erase an entire sequence (row)
	 */
	eraseSequence(row: number) {
		// Save the current state to history before making changes
		addHistoryEntry(`Erased sequence ${row + 1}`);

		// Ensure the row exists
		if (row >= currentAct.sequences.length) return;

		// Create empty beats for the row
		const emptyBeats = Array(DEFAULT_COLUMNS)
			.fill(null)
			.map(() => ({
				step_label: '',
				is_filled: false,
				pictograph_data: null
			}));

		// Keep the cue and timestamp, just clear the beats
		currentAct.sequences[row].beats = emptyBeats;
		isDirty = true;
	},

	/**
	 * Erase the entire act (clear all sequences but keep the structure)
	 */
	eraseAct() {
		// Save the current state to history before making changes
		addHistoryEntry(`Erased entire act`);

		// Create empty sequences with the same structure
		const emptySequences = Array(DEFAULT_ROWS)
			.fill(null)
			.map((_, index) => ({
				sequence_start_marker: index === 0,
				cue: '',
				timestamp: '',
				beats: Array(DEFAULT_COLUMNS)
					.fill(null)
					.map(() => ({
						step_label: '',
						is_filled: false,
						pictograph_data: null
					}))
			}));

		currentAct.sequences = emptySequences;
		isDirty = true;
	},

	/**
	 * Reset the act to an empty state (including title and metadata)
	 */
	reset() {
		currentAct = createEmptyAct(DEFAULT_ROWS, DEFAULT_COLUMNS);
		isDirty = true;
	},

	/**
	 * Undo the last action
	 * @returns The description of the undone action, or null if nothing to undo
	 */
	undo(): string | null {
		// Check if we can undo
		if (historyIndex <= 0) {
			return null; // Nothing to undo
		}

		// Get the previous history entry
		const previousIndex = historyIndex - 1;
		const previousEntry = history[previousIndex];

		// Store the description of the action being undone
		const undoneActionDescription = history[historyIndex].description;

		// Restore the previous state
		currentAct = JSON.parse(JSON.stringify(previousEntry.act));
		historyIndex = previousIndex;
		isDirty = true;

		return undoneActionDescription;
	},

	/**
	 * Redo the last undone action
	 * @returns The description of the redone action, or null if nothing to redo
	 */
	redo(): string | null {
		// Check if we can redo
		if (historyIndex >= history.length - 1) {
			return null; // Nothing to redo
		}

		// Get the next history entry
		const nextIndex = historyIndex + 1;
		const nextEntry = history[nextIndex];

		// Store the description of the action being redone
		const redoneActionDescription = nextEntry.description;

		// Restore the next state
		currentAct = JSON.parse(JSON.stringify(nextEntry.act));
		historyIndex = nextIndex;
		isDirty = true;

		return redoneActionDescription;
	}
};

// Derived state functions for convenience
export function actTitle() {
	return currentAct.title;
}

export function actSequences() {
	return currentAct.sequences;
}

export function canUndo() {
	return historyIndex > 0;
}

export function canRedo() {
	return historyIndex < history.length - 1;
}

// Backward compatibility exports
export { currentAct as actStore };
