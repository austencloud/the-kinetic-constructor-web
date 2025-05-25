/**
 * SIMPLE VERSION: OptionPicker state management without reactive effects
 * Uses direct method calls instead of reactive patterns to avoid infinite loops
 */

import { browser } from '$app/environment';
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
	} catch {
		return { sortMethod: 'all', lastSelectedTab: { all: 'all', type: 'all' } };
	}
}

// Simple runes-based OptionPicker state manager - NO REACTIVE EFFECTS
class OptionPickerStateManager {
	// Core reactive state
	options = $state<PictographData[]>([]);
	sequence = $state<PictographData[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);

	// UI state
	sortMethod = $state<SortMethodOrAll>('all');
	lastSelectedTab = $state<LastSelectedTabState>({});

	// Simple flags - no fancy reactive stuff
	private isCurrentlyLoading = false;

	constructor() {
		// Initialize from localStorage
		const storedState = getStoredState();
		this.sortMethod = storedState.sortMethod as SortMethodOrAll;
		this.lastSelectedTab = storedState.lastSelectedTab;
		console.log('[OptionPicker] Simple constructor - no reactive effects');
	}

	// NO reactive effects - just manual persistence
	private persistToLocalStorage() {
		if (!browser) return;

		try {
			const saveData = {
				sortMethod: this.sortMethod,
				lastSelectedTab: this.lastSelectedTab
			};
			localStorage.setItem('optionPickerUIState', JSON.stringify(saveData));
		} catch (e) {
			console.error('[OptionPicker] Error writing to localStorage:', e);
		}
	}

	// Computed properties
	get filteredOptions() {
		const options = [...this.options];

		if (this.sortMethod !== 'all') {
			options.sort(getSorter(this.sortMethod as SortMethod, this.sequence));
		} else {
			options.sort((a, b) => (a.letter ?? '').localeCompare(b.letter ?? ''));
		}
		return options;
	}

	get groupedOptions() {
		if (this.sortMethod === 'all') {
			return {};
		}

		const groups: Record<string, PictographData[]> = {};
		this.filteredOptions.forEach((option) => {
			const groupKey = determineGroupKey(option, this.sortMethod as SortMethod, this.sequence);
			if (!groups[groupKey]) groups[groupKey] = [];
			groups[groupKey].push(option);
		});

		const sortedKeys = getSortedGroupKeys(Object.keys(groups), this.sortMethod as SortMethod);
		const sortedGroups: Record<string, PictographData[]> = {};
		sortedKeys.forEach((key) => {
			if (groups[key]) {
				sortedGroups[key] = groups[key];
			}
		});
		return sortedGroups;
	}

	// Simple actions - no reactive loops
	async loadOptions(sequence: PictographData[]) {
		console.log('[OptionPicker] loadOptions called with sequence length:', sequence.length);
		
		// Simple guard
		if (this.isCurrentlyLoading) {
			console.log('[OptionPicker] Already loading, skipping');
			return;
		}

		if (!sequence || sequence.length === 0) {
			this.options = [];
			this.sequence = [];
			this.isLoading = false;
			this.error = null;
			return;
		}

		// Check pictograph data
		if (!pictographData.isInitialized || pictographData.isEmpty) {
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
		this.isCurrentlyLoading = true;
		this.error = null;

		try {
			const nextOptions = getNextOptions(sequence);
			console.log('[OptionPicker] Got', nextOptions?.length || 0, 'options');

			this.options = nextOptions || [];
			this.isLoading = false;

			// Simple tab handling
			if (
				typeof document !== 'undefined' &&
				(!this.lastSelectedTab[this.sortMethod] || this.lastSelectedTab[this.sortMethod] === null)
			) {
				this.setLastSelectedTabForSort(this.sortMethod, 'all');

				// Simple event dispatch - no timeouts
				const viewChangeEvent = new CustomEvent('viewchange', {
					detail: { mode: 'all' },
					bubbles: true
				});
				document.dispatchEvent(viewChangeEvent);
			}
		} catch (error) {
			console.error('[OptionPicker] Error loading options:', error);
			this.isLoading = false;
			this.error = error instanceof Error ? error.message : 'Unknown error loading options';
			this.options = [];
		} finally {
			this.isCurrentlyLoading = false;
		}
	}

	setSortMethod(method: SortMethodOrAll) {
		this.sortMethod = method;
		this.persistToLocalStorage();
	}

	setLastSelectedTabForSort(sortMethod: SortMethodOrAll, tabKey: string | null) {
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
		console.log('[OptionPicker] selectOption called for letter:', option.letter);
		
		try {
			await sequenceState.addBeat(option);
			console.log('[OptionPicker] Beat added successfully');

			// Simple event dispatch
			if (typeof document !== 'undefined') {
				const beatAddedEvent = new CustomEvent('beat-added', {
					detail: { beat: option },
					bubbles: true
				});
				document.dispatchEvent(beatAddedEvent);
			}

			// Directly reload options based on new sequence state
			// No reactive effects - just manual update
			this.refreshOptionsFromCurrentSequence();
		} catch (error) {
			console.error('[OptionPicker] Error selecting option:', error);
			this.error = error instanceof Error ? error.message : 'Failed to select option';
		}
	}

	reset() {
		console.log('[OptionPicker] Reset called');
		this.isCurrentlyLoading = false;
		this.options = [];
		this.sequence = [];
		this.isLoading = false;
		this.error = null;
		this.setLastSelectedTabForSort(this.sortMethod, 'all');
	}

	// Manual refresh method - called explicitly instead of reactive effects
	async refreshOptionsFromCurrentSequence() {
		console.log('[OptionPicker] Manually refreshing options from sequence');
		
		if (this.isCurrentlyLoading) {
			console.log('[OptionPicker] Already loading, skipping refresh');
			return;
		}

		try {
			// Get current sequence state directly
			const startPosition = sequenceState.startPosition;
			const beats = sequenceState.beats;
			const isSequenceLoading = sequenceState.isLoading;

			if (isSequenceLoading) {
				return;
			}

			// Determine position for options
			let positionForOptions: PictographData | null = null;

			if (beats.length > 0) {
				const lastBeat = beats[beats.length - 1];

				// Calculate ending orientations
				let calculatedBlueEndOri: Orientation = 'in';
				let calculatedRedEndOri: Orientation = 'in';

				if (lastBeat.blueMotionData) {
					try {
						const blueCalculator = new MotionOriCalculator(lastBeat.blueMotionData);
						calculatedBlueEndOri = blueCalculator.calculateEndOri();
					} catch (error) {
						calculatedBlueEndOri = lastBeat.blueMotionData.endOri || 'in';
					}
				}

				if (lastBeat.redMotionData) {
					try {
						const redCalculator = new MotionOriCalculator(lastBeat.redMotionData);
						calculatedRedEndOri = redCalculator.calculateEndOri();
					} catch (error) {
						calculatedRedEndOri = lastBeat.redMotionData.endOri || 'in';
					}
				}

				// Create synthetic position data
				positionForOptions = {
					...lastBeat,
					startPos: lastBeat.endPos,
					endPos: lastBeat.endPos,
					isStartPosition: false,
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
			} else if (startPosition) {
				positionForOptions = startPosition;
			}

			if (positionForOptions) {
				await this.loadOptions([positionForOptions]);
			} else {
				await this.loadOptions([]);
			}
		} catch (error) {
			console.error('[OptionPicker] Error refreshing options:', error);
			await this.loadOptions([]);
		}
	}

	// Manual method to be called when sequence changes (instead of reactive effect)
	onSequenceChanged() {
		console.log('[OptionPicker] Sequence changed, refreshing options');
		// Small delay to let sequence state settle
		setTimeout(() => {
			this.refreshOptionsFromCurrentSequence();
		}, 50);
	}

	// Manual method to be called when start position is selected
	onStartPositionSelected(startPosition: PictographData) {
		console.log('[OptionPicker] Start position selected');
		this.loadOptions([startPosition]);
	}

	// Dummy method for backward compatibility - does nothing now
	initializeReactiveEffects() {
		console.log('[OptionPicker] initializeReactiveEffects called - but this is the simple version, so doing nothing');
		// No-op - we don't use reactive effects anymore
	}
}

// Create and export the singleton instance
export const optionPickerState = new OptionPickerStateManager();