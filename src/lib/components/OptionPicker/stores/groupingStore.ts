
// src/lib/components/OptionPicker/stores/groupingStore.ts
import { derived } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import { optionPickerStore } from './optionPickerStore';
import { filteredOptionsStore } from './filteringStore';
import { ReversalService } from '../services/ReversalService';
import { GroupingService } from '../services/GroupingService';

// Grouped options store - organizes filtered options into categories
export const groupedOptionsStore = derived(
    [filteredOptionsStore, optionPickerStore],
    ([$filteredOptions, $state]) => {
        const { showAllActive, sortMethod, currentSequence } = $state;
        const effectiveSortMethod = showAllActive ? 'type' : sortMethod;

        // Group options by the appropriate key
        const groups: Record<string, PictographData[]> = {};

        $filteredOptions.forEach((option) => {
            const groupKey = GroupingService.determineGroupKey(
                option,
                effectiveSortMethod,
                currentSequence
            );

            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(option);
        });

        // Sort the group keys in the appropriate order
        const sortedKeys = GroupingService.getSortedGroupKeys(Object.keys(groups), effectiveSortMethod);

        // Build the final sorted groups object
        const sortedGroups: Record<string, PictographData[]> = {};
        sortedKeys.forEach((key) => {
            sortedGroups[key] = groups[key];
        });

        return sortedGroups;
    }
);
