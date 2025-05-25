/**
 * Modern Sequence Selection State with Svelte 5 Runes
 *
 * Replaces the deprecated selectedStartPos store with modern runes-based state management
 */

import type { PictographData } from '$lib/types/PictographData';
import { browser } from '$app/environment';

// Storage key for the start position
const START_POSITION_STORAGE_KEY = 'selected_start_position';

// Create reactive state for selected start position (internal)
let _selectedStartPosition = $state<PictographData | null>(null);

// Create reactive state for selected beats (internal)
let _selectedBeats = $state<string[]>([]);

// Create reactive state for current beat index (internal)
let _currentBeatIndex = $state<number>(-1);

// Export getters for the state
export function getSelectedStartPosition(): PictographData | null {
	return _selectedStartPosition;
}

export function getSelectedBeats(): string[] {
	return _selectedBeats;
}

export function getCurrentBeatIndex(): number {
	return _currentBeatIndex;
}

/**
 * Initialize the selection state from localStorage
 */
export function initializeSelectionState() {
	if (!browser) return;

	try {
		const savedStartPos = localStorage.getItem(START_POSITION_STORAGE_KEY);
		if (savedStartPos) {
			_selectedStartPosition = JSON.parse(savedStartPos);
		}
	} catch (error) {
		console.warn('Failed to load start position from localStorage:', error);
		_selectedStartPosition = null;
	}
}

/**
 * Set the selected start position
 */
export function setSelectedStartPosition(startPos: PictographData | null) {
	_selectedStartPosition = startPos;

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
 * Set selected beats
 */
export function setSelectedBeats(beats: string[]) {
	_selectedBeats = beats;
}

/**
 * Add a beat to the selection
 */
export function addSelectedBeat(beatId: string) {
	if (!_selectedBeats.includes(beatId)) {
		_selectedBeats = [..._selectedBeats, beatId];
	}
}

/**
 * Remove a beat from the selection
 */
export function removeSelectedBeat(beatId: string) {
	_selectedBeats = _selectedBeats.filter((id) => id !== beatId);
}

/**
 * Clear all selected beats
 */
export function clearSelectedBeats() {
	_selectedBeats = [];
}

/**
 * Set the current beat index
 */
export function setCurrentBeatIndex(index: number) {
	_currentBeatIndex = index;
}

/**
 * Check if a beat is selected
 */
export function isBeatSelected(beatId: string): boolean {
	return _selectedBeats.includes(beatId);
}

/**
 * Get the number of selected beats
 */
export function getSelectedBeatCount(): number {
	return _selectedBeats.length;
}

/**
 * Check if any beats are selected
 */
export function hasSelectedBeats(): boolean {
	return _selectedBeats.length > 0;
}

// Initialize on module load
if (browser) {
	initializeSelectionState();
}
