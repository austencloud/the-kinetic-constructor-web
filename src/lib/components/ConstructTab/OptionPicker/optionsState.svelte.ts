// src/lib/components/OptionPicker/optionsState.svelte.ts
import type { PictographData } from '$lib/types/PictographData';
import type { SortMethod, ReversalFilter } from './config';
import {
	getNextOptions,
	determineReversalCategory,
	determineGroupKey,
	getSortedGroupKeys,
	getSorter
} from './services/OptionsService';
import { browser } from '$app/environment';
// Import the sequenceActions and sequenceSelectors from the state machine
import { sequenceActions, sequenceSelectors } from '$lib/state/machines/sequenceMachine';
import { createPersistentObjectState } from '$lib/state/core/runes.svelte';

// ===== Core State =====
// Using Svelte 5 runes for state management
export let sequenceData = $state<PictographData[]>([]);
export let optionsData = $state<PictographData[]>([]);
export let selectedPictographData = $state<PictographData | null>(null);

// ===== UI State =====
export type LastSelectedTabState = Partial<Record<SortMethod, string | null>>;

// Create persistent UI state using runes
export const uiState = createPersistentObjectState('optionPickerUIState', {
	sortMethod: 'type' as SortMethod,
	isLoading: false,
	error: null as string | null,
	lastSelectedTab: { type: 'all' } as LastSelectedTabState,
	reversalFilter: 'all' as ReversalFilter
});

// ===== Derived State =====
// Filtered options - applies filtering and sorting based on uiState
export const filteredOptions = $derived(() => {
	let options = [...optionsData];
	options.sort(getSorter(uiState.sortMethod, sequenceData));
	return options;
});

// Grouped options - groups the filtered/sorted options based on the current sortMethod
export const groupedOptions = $derived(() => {
	const groups: Record<string, PictographData[]> = {};
	const options = filteredOptions();
	options.forEach((option) => {
		const groupKey = determineGroupKey(option, uiState.sortMethod, sequenceData);
		if (!groups[groupKey]) groups[groupKey] = [];
		groups[groupKey].push(option);
	});
	const sortedKeys = getSortedGroupKeys(Object.keys(groups), uiState.sortMethod);
	const sortedGroups: Record<string, PictographData[]> = {};
	sortedKeys.forEach((key) => {
		if (groups[key]) {
			sortedGroups[key] = groups[key];
		}
	});
	return sortedGroups;
});

// ===== Actions =====
export const actions = {
	loadOptions: (sequence: PictographData[]) => {
		// Don't try to load options if sequence is empty
		if (!sequence || sequence.length === 0) {
			console.warn('Attempted to load options with empty sequence');
			optionsData = [];
			uiState.isLoading = false;
			uiState.error = null;
			return;
		}

		sequenceData = sequence;
		uiState.isLoading = true;
		uiState.error = null;

		try {
			const nextOptions = getNextOptions(sequence);

			// If we got no options, log a warning but don't treat it as an error
			if (!nextOptions || nextOptions.length === 0) {
				console.warn('No options available for the current sequence');
			}

			optionsData = nextOptions || [];
