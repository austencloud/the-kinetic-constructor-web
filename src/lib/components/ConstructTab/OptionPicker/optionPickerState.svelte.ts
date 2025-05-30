/**
 * FIXED VERSION: OptionPicker state management with reactive loop prevention
 * Uses proper reactive isolation and prevents circular dependencies
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
	} catch {
		return { sortMethod: 'all', lastSelectedTab: { all: 'all', type: 'all' } };
	}
}

// Enhanced OptionPicker state manager with reactive loop prevention
class OptionPickerStateManager {
	// Core reactive state - these are the ONLY reactive properties
	options = $state<PictographData[]>([]);
	sequence = $state<PictographData[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);

	// UI state
	sortMethod = $state<SortMethodOrAll>('all');
	lastSelectedTab = $state<LastSelectedTabState>({});

	// Internal flags for preventing loops and rapid calls
	private isCurrentlyLoading = false;
	private isCurrentlySelecting = false;
	private lastRefreshTime = 0;
	private lastSelectionTime = 0;
	private refreshDebounceMs = 150;
	private selectionDebounceMs = 300;
	private lastSelectedOptionLetter: string | null = null;

	constructor() {
		// Initialize from localStorage without triggering reactive effects
		const storedState = getStoredState();

		untrack(() => {
			this.sortMethod = storedState.sortMethod as SortMethodOrAll;
			this.lastSelectedTab = storedState.lastSelectedTab;
		});
	}

	// ===== PERSISTENCE =====
	private persistToLocalStorage() {
		if (!browser) return;

		try {
			const saveData = {
				sortMethod: this.sortMethod,
				lastSelectedTab: this.lastSelectedTab
			};
			localStorage.setItem('optionPickerUIState', JSON.stringify(saveData));
		} catch (e) {
			// Silently handle localStorage errors
		}
	}

	// ===== COMPUTED PROPERTIES (NON-REACTIVE) =====
	// These are called manually when needed, not reactive

	get filteredOptions() {
		return untrack(() => {
			const options = [...this.options];
			const currentSortMethod = this.sortMethod;
			const currentSequence = this.sequence;

			if (currentSortMethod !== 'all') {
				options.sort(getSorter(currentSortMethod as SortMethod, currentSequence));
			} else {
				options.sort((a, b) => (a.letter ?? '').localeCompare(b.letter ?? ''));
			}
			return options;
		});
	}

	get groupedOptions() {
		return untrack(() => {
			const currentSortMethod = this.sortMethod;

			if (currentSortMethod === 'all') {
				return {};
			}

			const filteredOpts = this.filteredOptions;
			const currentSequence = this.sequence;
			const groups: Record<string, PictographData[]> = {};

			filteredOpts.forEach((option) => {
				const groupKey = determineGroupKey(
					option,
					currentSortMethod as SortMethod,
					currentSequence
				);
				if (!groups[groupKey]) groups[groupKey] = [];
				groups[groupKey].push(option);
			});

			const sortedKeys = getSortedGroupKeys(Object.keys(groups), currentSortMethod as SortMethod);
			const sortedGroups: Record<string, PictographData[]> = {};
			sortedKeys.forEach((key) => {
				if (groups[key]) {
					sortedGroups[key] = groups[key];
				}
			});
			return sortedGroups;
		});
	}

	// ===== CORE ACTIONS =====

	async loadOptions(sequence: PictographData[]) {
		// Enhanced guard against concurrent loading
		if (this.isCurrentlyLoading || this.isCurrentlySelecting) {
			return;
		}

		// Handle empty sequence case
		if (!sequence || sequence.length === 0) {
			untrack(() => {
				this.options = [];
				this.sequence = [];
				this.isLoading = false;
				this.error = null;
			});
			return;
		}

		// Check pictograph data availability
		if (!pictographData.isInitialized || pictographData.isEmpty) {
			const initialized = await pictographData.waitForInitialization(5000);
			if (!initialized || pictographData.isEmpty) {
				untrack(() => {
					this.options = [];
					this.sequence = sequence;
					this.isLoading = false;
					this.error = 'No pictograph data available';
				});
				return;
			}
		}

		this.isCurrentlyLoading = true;

		// Set loading state immediately
		untrack(() => {
			this.sequence = sequence;
			this.isLoading = true;
			this.error = null;
		});

		try {
			const nextOptions = getNextOptions(sequence);

			// Update state atomically using untrack
			untrack(() => {
				this.options = nextOptions || [];
				this.isLoading = false;
			});

			// Debug log to track option loading
			console.log(
				'✅ OptionPickerState: Loaded',
				nextOptions?.length || 0,
				'options for sequence of length',
				sequence.length
			);

			// Handle tab state (only if needed and without triggering reactive loops)
			if (
				typeof document !== 'undefined' &&
				(!this.lastSelectedTab[this.sortMethod] || this.lastSelectedTab[this.sortMethod] === null)
			) {
				untrack(() => {
					this.setLastSelectedTabForSort(this.sortMethod, 'all');
				});

				// Dispatch event with small delay to break reactive chain
				setTimeout(() => {
					const viewChangeEvent = new CustomEvent('viewchange', {
						detail: { mode: 'all' },
						bubbles: true
					});
					document.dispatchEvent(viewChangeEvent);
				}, 50);
			}
		} catch (error) {
			console.error('[OptionPicker] Error loading options:', error);
			untrack(() => {
				this.isLoading = false;
				this.error = error instanceof Error ? error.message : 'Unknown error loading options';
				this.options = [];
			});
		} finally {
			this.isCurrentlyLoading = false;
		}
	}

	setSortMethod(method: SortMethodOrAll) {
		untrack(() => {
			this.sortMethod = method;
		});
		this.persistToLocalStorage();
	}

	setLastSelectedTabForSort(sortMethod: SortMethodOrAll, tabKey: string | null) {
		const currentTab = this.lastSelectedTab[sortMethod];
		if (currentTab === tabKey) {
			return; // No change needed
		}

		untrack(() => {
			this.lastSelectedTab = {
				...this.lastSelectedTab,
				[sortMethod]: tabKey
			};
		});

		this.persistToLocalStorage();
	}

	// ===== OPTION SELECTION (ENHANCED LOOP PREVENTION) =====
	async selectOption(option: PictographData) {
		const now = Date.now();

		// Enhanced protection against rapid/duplicate selections
		if (
			this.isCurrentlySelecting ||
			this.isCurrentlyLoading ||
			(this.lastSelectedOptionLetter === option.letter &&
				now - this.lastSelectionTime < this.selectionDebounceMs)
		) {
			return;
		}

		this.isCurrentlySelecting = true;
		this.lastSelectedOptionLetter = option.letter;
		this.lastSelectionTime = now;

		try {
			await sequenceState.addBeat(option);

			// NUCLEAR FIX: Completely disable beat-added event to stop infinite loops
			// The setTimeout is causing infinite loops - disable it entirely
			// if (typeof document !== 'undefined') {
			// 	setTimeout(() => {
			// 		const beatAddedEvent = new CustomEvent('beat-added', {
			// 			detail: { beat: option },
			// 			bubbles: true
			// 		});
			// 		document.dispatchEvent(beatAddedEvent);
			// 	}, 100); // Increased delay for better loop prevention
			// }
		} catch (error) {
			untrack(() => {
				this.error = error instanceof Error ? error.message : 'Failed to select option';
			});
		} finally {
			// Reset selection flag after sufficient delay
			setTimeout(() => {
				this.isCurrentlySelecting = false;
			}, 350);
		}
	}

	// ===== MANUAL REFRESH (ENHANCED DEBOUNCING) =====
	async refreshOptionsFromCurrentSequence() {
		const now = Date.now();

		// Enhanced protection against rapid successive calls
		if (
			this.isCurrentlyLoading ||
			this.isCurrentlySelecting ||
			now - this.lastRefreshTime < this.refreshDebounceMs
		) {
			return;
		}

		this.lastRefreshTime = now;

		try {
			// Use untrack to read sequence state without creating reactive dependencies
			const startPosition = untrack(() => sequenceState.startPosition);
			const beats = untrack(() => sequenceState.beats);
			const isSequenceLoading = untrack(() => sequenceState.isLoading);

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

	// ===== UTILITY METHODS =====
	reset() {
		this.isCurrentlyLoading = false;
		this.isCurrentlySelecting = false;

		untrack(() => {
			this.options = [];
			this.sequence = [];
			this.isLoading = false;
			this.error = null;
			this.setLastSelectedTabForSort(this.sortMethod, 'all');
		});
	}

	// Manual event handlers (called explicitly, no reactive effects)
	onSequenceChanged() {
		if (!this.isCurrentlyLoading && !this.isCurrentlySelecting) {
			setTimeout(() => {
				this.refreshOptionsFromCurrentSequence();
			}, 100);
		}
	}

	onStartPositionSelected(startPosition: PictographData) {
		if (!this.isCurrentlyLoading) {
			this.loadOptions([startPosition]);
		}
	}

	// DISABLED: Systematic test effect to prevent infinite loops
	initializeReactiveEffects() {
		// DISABLED: Reactive effect to prevent infinite loops
		// $effect(() => {
		// 	// Use untrack to prevent circular dependencies
		// 	const currentBeats = untrack(() => sequenceState.beats);
		// 	const currentStartPosition = untrack(() => sequenceState.startPosition);
		// 	const isLoading = untrack(() => sequenceState.isLoading);
		// 	// Only proceed if not already loading and state is stable
		// 	if (!this.isCurrentlyLoading && !this.isCurrentlySelecting && !isLoading) {
		// 		// Determine sequence for options
		// 		const sequence = currentStartPosition
		// 			? [currentStartPosition, ...currentBeats]
		// 			: currentBeats;
		// 		// Load options with debouncing
		// 		setTimeout(() => {
		// 			if (!this.isCurrentlyLoading && !this.isCurrentlySelecting) {
		// 				this.loadOptions(sequence);
		// 			}
		// 		}, 100);
		// 	}
		// });
	}
}

// Create and export the singleton instance
export const optionPickerState = new OptionPickerStateManager();
