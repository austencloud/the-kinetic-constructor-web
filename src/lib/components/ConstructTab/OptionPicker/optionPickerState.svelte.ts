/**
 * Modern Svelte 5 runes-based OptionPicker state management
 * Replaces the legacy store-based system with reactive runes
 */

import { browser } from '$app/environment';
import { untrack } from 'svelte';
import type { PictographData } from '$lib/types/PictographData';
import type { SortMethod } from './config';
import type { Orientation } from '$lib/types/Types';
import { pictographData } from '$lib/state/pictograph/pictographDataState.svelte';
import { sequenceState } from '$lib/state/sequence/sequenceState.svelte';
import {
	getNextOptions,
	determineGroupKey,
	getSortedGroupKeys,
	getSorter
} from './services/OptionsService';
import { MotionOriCalculator } from '$lib/components/objects/Motion/MotionOriCalculator';

// Types
export type SortMethodOrAll = SortMethod | 'all';
export type LastSelectedTabState = Partial<Record<SortMethodOrAll, string | null>>;

// Helper function to get stored state from localStorage
function getStoredState() {
	if (!browser) return { sortMethod: 'all', lastSelectedTab: { all: 'all' } };

	try {
		const stored = localStorage.getItem('optionPickerUIState');
		if (!stored) return { sortMethod: 'all', lastSelectedTab: { all: 'all', type: 'all' } };

		const parsed = JSON.parse(stored);
		return {
			sortMethod: parsed.sortMethod || 'all',
			lastSelectedTab: parsed.lastSelectedTab || { all: 'all', type: 'all' }
		};
	} catch (e) {
		return { sortMethod: 'all', lastSelectedTab: { all: 'all', type: 'all' } };
	}
}

// Modern runes-based OptionPicker state manager
class OptionPickerStateManager {
	// Core reactive state - CRITICAL: Must be public for Svelte 5 reactivity
	options = $state<PictographData[]>([]);
	sequence = $state<PictographData[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);

	// UI state
	sortMethod = $state<SortMethodOrAll>('all');
	lastSelectedTab = $state<LastSelectedTabState>({});

	constructor() {
		// Initialize from localStorage
		const storedState = getStoredState();
		this.sortMethod = storedState.sortMethod as SortMethodOrAll;
		this.lastSelectedTab = storedState.lastSelectedTab;
	}

	// Manual persistence method that can be called when state changes
	private persistToLocalStorage() {
		if (!browser) return;

		try {
			const saveData = {
				sortMethod: this.sortMethod,
				lastSelectedTab: this.lastSelectedTab
			};
			localStorage.setItem('optionPickerUIState', JSON.stringify(saveData));
		} catch (e) {
			console.error('Error writing to localStorage:', e);
		}
	}

	// Component-level initialization that can set up reactive effects
	// This should be called from within a Svelte component context
	initializeReactiveEffects() {
		if (!browser) return;

		// Set up reactive effect to watch for sequence state changes
		// This ensures the option picker stays synchronized with sequence state
		// IMPORTANT: Use untrack to prevent infinite loops
		$effect(() => {
			// Only watch the specific values we need to react to
			const startPosition = sequenceState.startPosition;
			const beatsLength = sequenceState.beats.length;

			// Use untrack for all other operations to prevent circular dependencies
			untrack(() => {
				// Don't react if sequence is still loading
				if (sequenceState.isLoading) {
					return;
				}

				// CRITICAL FIX: Don't override options that were just loaded via events
				// If we have options but no sequence state, it means options were loaded via event
				// and we shouldn't clear them
				if (!startPosition && beatsLength === 0 && this.options.length > 0) {
					return;
				}

				// Only trigger if we have meaningful state (start position or beats)
				// OR if we need to clear options when sequence is truly empty
				if (!startPosition && beatsLength === 0) {
					// Only clear options if we haven't already cleared them
					if (this.options.length > 0) {
						this.options = [];
						this.sequence = [];
					}
					return;
				}

				// Debounce the option loading to prevent rapid successive calls
				if (this.loadOptionsDebounceTimer) {
					clearTimeout(this.loadOptionsDebounceTimer);
				}

				this.loadOptionsDebounceTimer = setTimeout(async () => {
					// Check if we're already loading options to prevent concurrent calls
					if (this.isLoading) {
						return;
					}

					try {
						await this.loadOptionsFromSequence();
					} catch (error) {
						console.error('OptionPickerState: Error in reactive effect:', error);
					}
				}, 150); // Increased debounce time to allow events to complete first
			});
		});
	}

	// Add debounce timer property
	private loadOptionsDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Computed properties
	get filteredOptions() {
		let options = [...this.options];

		// Only sort if we have a valid sort method (not 'all')
		if (this.sortMethod !== 'all') {
			options.sort(getSorter(this.sortMethod as SortMethod, this.sequence));
		} else {
			// For 'all' view, use a simple alphabetical sort by letter
			options.sort((a, b) => (a.letter ?? '').localeCompare(b.letter ?? ''));
		}
		return options;
	}

	get groupedOptions() {
		// Special case for 'all' view - don't group options
		if (this.sortMethod === 'all') {
			return {};
		}

		// For valid sort methods, proceed with grouping
		const groups: Record<string, PictographData[]> = {};
		this.filteredOptions.forEach((option) => {
			const groupKey = determineGroupKey(option, this.sortMethod as SortMethod, this.sequence);
			if (!groups[groupKey]) groups[groupKey] = [];
			groups[groupKey].push(option);
		});

		// Sort the group keys based on the sort method
		const sortedKeys = getSortedGroupKeys(Object.keys(groups), this.sortMethod as SortMethod);
		const sortedGroups: Record<string, PictographData[]> = {};
		sortedKeys.forEach((key) => {
			if (groups[key]) {
				sortedGroups[key] = groups[key];
			}
		});
		return sortedGroups;
	}

	// Actions
	async loadOptions(sequence: PictographData[]) {
		// Don't try to load options if sequence is empty
		if (!sequence || sequence.length === 0) {
			this.options = [];
			this.sequence = [];
			this.isLoading = false;
			this.error = null;
			return;
		}

		// Check if pictograph data is available
		if (!pictographData.isInitialized || pictographData.isEmpty) {
			// Wait for pictograph data to be initialized
			const initialized = await pictographData.waitForInitialization(5000);
			if (!initialized || pictographData.isEmpty) {
				this.options = [];
				this.sequence = sequence;
				this.isLoading = false;
				this.error = 'No pictograph data available';
				return;
			}
		}

		this.sequence = sequence;
		this.isLoading = true;
		this.error = null;

		try {
			// Add a small delay to make this properly async and allow UI to show loading state
			await new Promise((resolve) => setTimeout(resolve, 0));

			const nextOptions = getNextOptions(sequence);

			// If we got no options, log a warning but don't treat it as an error
			if (!nextOptions || nextOptions.length === 0) {
				console.warn('OptionPickerState: No options available for the current sequence');
			}

			this.options = nextOptions || [];
			this.isLoading = false;

			// Only dispatch a viewchange event if we don't have a selected tab yet
			if (
				typeof document !== 'undefined' &&
				(!this.lastSelectedTab[this.sortMethod] || this.lastSelectedTab[this.sortMethod] === null)
			) {
				// Only in this case, set the default tab to 'all'
				this.setLastSelectedTabForSort(this.sortMethod, 'all');

				const viewChangeEvent = new CustomEvent('viewchange', {
					detail: { mode: 'all' },
					bubbles: true
				});
				document.dispatchEvent(viewChangeEvent);
			}
		} catch (error) {
			this.isLoading = false;
			this.error = error instanceof Error ? error.message : 'Unknown error loading options';
			this.options = [];
			console.error('OptionPickerState: Error loading options:', error);
		}
	}

	setSortMethod(method: SortMethodOrAll) {
		this.sortMethod = method;
		this.persistToLocalStorage();
	}

	setLastSelectedTabForSort(sortMethod: SortMethodOrAll, tabKey: string | null) {
		// Avoid unnecessary updates if the value hasn't changed
		if (this.lastSelectedTab[sortMethod] === tabKey) {
			return;
		}

		this.lastSelectedTab = {
			...this.lastSelectedTab,
			[sortMethod]: tabKey
		};

		this.persistToLocalStorage();
	}

	async selectOption(option: PictographData) {
		try {
			// Add the selected option as a beat to the sequence using modern sequence state
			await sequenceState.addBeat(option);

			// Dispatch a custom event to notify components that a beat was added
			if (typeof document !== 'undefined') {
				const beatAddedEvent = new CustomEvent('beat-added', {
					detail: { beat: option },
					bubbles: true
				});
				document.dispatchEvent(beatAddedEvent);
			}
		} catch (error) {
			console.error('OptionPickerState: Error selecting option:', error);
			this.error = error instanceof Error ? error.message : 'Failed to select option';
		}
	}

	reset() {
		// Clear any pending debounced operations
		if (this.loadOptionsDebounceTimer) {
			clearTimeout(this.loadOptionsDebounceTimer);
			this.loadOptionsDebounceTimer = null;
		}

		this.options = [];
		this.sequence = [];
		this.isLoading = false;
		this.error = null;

		// Preserve the sort method and tab preferences
		// Ensure 'all' is set as the default tab for the current sort method
		this.setLastSelectedTabForSort(this.sortMethod, 'all');
	}

	// Load options from current sequence state
	async loadOptionsFromSequence() {
		// Prevent infinite loops by checking if we're already loading
		if (this.isLoading) {
			return;
		}

		try {
			const startPositionData = sequenceState.startPosition;
			const beats = sequenceState.beats;
			const isSequenceLoading = sequenceState.isLoading;

			// Don't proceed if sequence state is still loading
			if (isSequenceLoading) {
				return;
			}

			// Don't proceed if pictograph data is not ready
			if (!pictographData.isInitialized || pictographData.isLoading) {
				// Wait for pictograph data to be initialized
				const initialized = await pictographData.waitForInitialization(5000);
				if (!initialized) {
					console.error('OptionPickerState: Pictograph data initialization timeout');
					await this.loadOptions([]);
					return;
				}
			}

			// Determine what position to use for loading options
			let positionForOptions: PictographData | null = null;

			if (beats.length > 0) {
				// If we have beats in the sequence, use the last beat's end position
				const lastBeat = beats[beats.length - 1];

				// CRITICAL FIX: Calculate the actual ending orientations from the last beat
				// This ensures options display with correct starting orientations
				// Initialize with default orientation to ensure type safety
				let calculatedBlueEndOri: Orientation = 'in';
				let calculatedRedEndOri: Orientation = 'in';

				// Use MotionOriCalculator to get the actual ending orientations
				if (lastBeat.blueMotionData) {
					try {
						const blueCalculator = new MotionOriCalculator(lastBeat.blueMotionData);
						calculatedBlueEndOri = blueCalculator.calculateEndOri();
					} catch (error) {
						console.warn('Error calculating blue end orientation:', error);
						// Fall back to stored end orientation, or default if undefined
						calculatedBlueEndOri = lastBeat.blueMotionData.endOri || 'in';
					}
				}

				if (lastBeat.redMotionData) {
					try {
						const redCalculator = new MotionOriCalculator(lastBeat.redMotionData);
						calculatedRedEndOri = redCalculator.calculateEndOri();
					} catch (error) {
						console.warn('Error calculating red end orientation:', error);
						// Fall back to stored end orientation, or default if undefined
						calculatedRedEndOri = lastBeat.redMotionData.endOri || 'in';
					}
				}

				// Create a synthetic PictographData object representing the current end position
				// with motion data that reflects the calculated ending orientations
				positionForOptions = {
					...lastBeat,
					startPos: lastBeat.endPos,
					endPos: lastBeat.endPos,
					isStartPosition: false,
					// Update motion data to reflect the calculated ending orientations
					// This is what the next options should start from
					blueMotionData: lastBeat.blueMotionData
						? {
								...lastBeat.blueMotionData,
								startOri: calculatedBlueEndOri,
								endOri: calculatedBlueEndOri
							}
						: null,
					redMotionData: lastBeat.redMotionData
						? {
								...lastBeat.redMotionData,
								startOri: calculatedRedEndOri,
								endOri: calculatedRedEndOri
							}
						: null
				};
			} else if (startPositionData) {
				// If no beats yet, use the start position
				positionForOptions = startPositionData;
			}

			if (positionForOptions) {
				console.log('OptionPickerState: Loading options with position:', {
					startPos: positionForOptions.startPos,
					endPos: positionForOptions.endPos,
					blueMotionData: positionForOptions.blueMotionData,
					redMotionData: positionForOptions.redMotionData
				});
				await this.loadOptions([positionForOptions]);
			} else {
				// No position data available, load empty options
				await this.loadOptions([]);
			}
		} catch (error) {
			console.error('OptionPickerState: Error loading options from sequence:', error);
			await this.loadOptions([]);
		}
	}
}

// Create and export the singleton instance
export const optionPickerState = new OptionPickerStateManager();
