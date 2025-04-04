
// src/lib/components/OptionPicker/stores/filteringStore.ts
import { derived } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import { optionPickerStore } from './optionPickerStore';
import { ReversalService } from '../services/ReversalService';
import { SortingService } from '../services/SortingService';

// Filtered options store - just filter logic, no other concerns
export const filteredOptionsStore = derived(optionPickerStore, ($state) => {
    const { allOptions, currentSequence, showAllActive, reversalFilter, sortMethod } = $state;

    let options = [...allOptions];

    // When "show all" is active, just do basic sorting
    if (showAllActive) {
        return options.sort(SortingService.getDefaultSorter());
    }

    // Apply reversal filtering
    if (reversalFilter !== 'all') {
        options = options.filter(
            (option) =>
                ReversalService.determineReversalCategory(currentSequence, option) === reversalFilter
        );
    }

    // Apply sorting
    if (sortMethod === 'reversals') {
        options.sort(SortingService.getReversalSorter(currentSequence));
    } else {
        options.sort(SortingService.getSorter(sortMethod));
    }

    return options;
}); 