/**
 * WriteTab Act State - Modern Svelte 5 runes-based state management
 */

import type { Act, Beat } from '../models/Act';
import { createEmptyAct } from '../models/Act';
import { browser } from '$app/environment';

// Constants
const STORAGE_KEY = 'current_act';
const DEFAULT_ROWS = 24;
const DEFAULT_COLUMNS = 8;

// Create reactive state using Svelte 5 runes
class ActState {
	// Core state
	act = $state<Act>(createEmptyAct(DEFAULT_ROWS, DEFAULT_COLUMNS));
	isLoading = $state(false);
	error = $state<string | null>(null);
	isDirty = $state(false);

	// History for undo/redo
	private history = $state<Act[]>([]);
	private historyIndex = $state(-1);
	private maxHistorySize = 50;

	// Derived state
	canUndo = $derived(this.historyIndex > 0);
	canRedo = $derived(this.historyIndex < this.history.length - 1);

	constructor() {
		// Initialize on client side
		if (browser) {
			this.initialize();
		}
	}

	// Initialize the state
	async initialize() {
		this.isLoading = true;
		this.error = null;

		try {
			const savedAct = localStorage.getItem(STORAGE_KEY);

			if (savedAct) {
				const parsedAct = JSON.parse(savedAct) as Act;
				this.act = parsedAct;
				this.isDirty = false;
			} else {
				this.act = createEmptyAct(DEFAULT_ROWS, DEFAULT_COLUMNS);
				this.isDirty = false;
			}

			// Initialize history
			this.addToHistory(this.act);
		} catch (err) {
			console.error('Failed to load act:', err);
			this.error = 'Failed to load act data';
			this.act = createEmptyAct(DEFAULT_ROWS, DEFAULT_COLUMNS);
		} finally {
			this.isLoading = false;
		}
	}

	// History management
	private addToHistory(act: Act) {
		// Remove any history after current index (when undoing then making new changes)
		this.history = this.history.slice(0, this.historyIndex + 1);

		// Add new state
		this.history.push(structuredClone(act));
		this.historyIndex = this.history.length - 1;

		// Limit history size
		if (this.history.length > this.maxHistorySize) {
			this.history = this.history.slice(-this.maxHistorySize);
			this.historyIndex = this.history.length - 1;
		}
	}

	private updateWithHistory(newAct: Act) {
		this.act = newAct;
		this.isDirty = true;
		this.addToHistory(newAct);
	}

	// Update act title
	updateTitle(title: string) {
		const newAct = { ...this.act, title };
		this.updateWithHistory(newAct);
	}

	// Update beat data
	updateBeat(sequenceIndex: number, beatIndex: number, beatData: Partial<Beat>) {
		const newAct = structuredClone(this.act);
		if (newAct.sequences[sequenceIndex] && newAct.sequences[sequenceIndex].beats[beatIndex]) {
			newAct.sequences[sequenceIndex].beats[beatIndex] = {
				...newAct.sequences[sequenceIndex].beats[beatIndex],
				...beatData
			};
		}
		this.updateWithHistory(newAct);
	}

	// Update sequence metadata
	updateSequence(sequenceIndex: number, sequenceData: { cue?: string; timestamp?: string }) {
		const newAct = structuredClone(this.act);
		if (newAct.sequences[sequenceIndex]) {
			newAct.sequences[sequenceIndex] = {
				...newAct.sequences[sequenceIndex],
				...sequenceData
			};
		}
		this.updateWithHistory(newAct);
	}

	// Update cue and timestamp for a sequence
	updateCueAndTimestamp(sequenceIndex: number, cue: string, timestamp: string) {
		this.updateSequence(sequenceIndex, { cue, timestamp });
	}

	// Batch update multiple beats
	updateBeats(
		updates: Array<{
			sequenceIndex: number;
			beatIndex: number;
			beatData: Partial<Beat>;
		}>
	) {
		const newAct = structuredClone(this.act);

		updates.forEach(({ sequenceIndex, beatIndex, beatData }) => {
			if (newAct.sequences[sequenceIndex] && newAct.sequences[sequenceIndex].beats[beatIndex]) {
				newAct.sequences[sequenceIndex].beats[beatIndex] = {
					...newAct.sequences[sequenceIndex].beats[beatIndex],
					...beatData
				};
			}
		});

		this.updateWithHistory(newAct);
	}

	// Populate from dropped data
	populateFromDrop(sequenceData: any, startRow: number = 0, startCol: number = 0) {
		const newAct = structuredClone(this.act);
		let currentRow = startRow;
		let currentCol = startCol;

		// If we have pictograph data, populate beats
		if (sequenceData && sequenceData.beats) {
			for (const beatData of sequenceData.beats) {
				// Skip if we've reached the end of the grid
				if (currentRow >= newAct.sequences.length) break;

				// Update the beat
				Object.assign(newAct.sequences[currentRow].beats[currentCol], {
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

		this.updateWithHistory(newAct);
	}

	// Erase a beat
	eraseBeat(sequenceIndex: number, beatIndex: number) {
		const newAct = structuredClone(this.act);
		if (newAct.sequences[sequenceIndex] && newAct.sequences[sequenceIndex].beats[beatIndex]) {
			newAct.sequences[sequenceIndex].beats[beatIndex] = {
				...newAct.sequences[sequenceIndex].beats[beatIndex],
				pictograph_data: null,
				step_label: '',
				is_filled: false
			};
		}
		this.updateWithHistory(newAct);
	}

	// Erase a sequence
	eraseSequence(sequenceIndex: number) {
		const newAct = structuredClone(this.act);
		if (newAct.sequences[sequenceIndex]) {
			// Reset all beats in the sequence
			newAct.sequences[sequenceIndex].beats.forEach((beat) => {
				beat.pictograph_data = null;
				beat.step_label = '';
				beat.is_filled = false;
			});
			// Reset sequence metadata
			newAct.sequences[sequenceIndex].cue = '';
			newAct.sequences[sequenceIndex].timestamp = '';
		}
		this.updateWithHistory(newAct);
	}

	// Erase entire act
	eraseAct() {
		const newAct = createEmptyAct(DEFAULT_ROWS, DEFAULT_COLUMNS);
		this.updateWithHistory(newAct);
	}

	// Undo
	undo() {
		if (this.canUndo) {
			this.historyIndex--;
			this.act = structuredClone(this.history[this.historyIndex]);
			this.isDirty = true;
			return 'Undo successful';
		}
		return null;
	}

	// Redo
	redo() {
		if (this.canRedo) {
			this.historyIndex++;
			this.act = structuredClone(this.history[this.historyIndex]);
			this.isDirty = true;
			return 'Redo successful';
		}
		return null;
	}

	// Save to localStorage
	async save() {
		this.isLoading = true;
		this.error = null;

		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.act));
			this.isDirty = false;
		} catch (err) {
			console.error('Failed to save act:', err);
			this.error = 'Failed to save act data';
			throw err;
		} finally {
			this.isLoading = false;
		}
	}

	// Reset to empty act
	reset() {
		const newAct = createEmptyAct(DEFAULT_ROWS, DEFAULT_COLUMNS);
		this.updateWithHistory(newAct);
	}
}

// Create and export the singleton instance
export const actState = new ActState();
