// src/lib/components/OptionPicker/store.ts
import { writable, derived } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';
import { OptionsService } from './services/OptionsService';
import type { SortMethod, ReversalFilter } from './config';

// Base state type
export interface OptionPickerState {
  allOptions: PictographData[];
  currentSequence: PictographData[];
  sortMethod: SortMethod;
  reversalFilter: ReversalFilter;
  showAllActive: boolean;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: OptionPickerState = {
  allOptions: [],
  currentSequence: [],
  sortMethod: 'type',
  reversalFilter: 'all',
  showAllActive: false,
  isLoading: false,
  error: null
};

// Create the base store
function createStore() {
  const { subscribe, set, update } = writable<OptionPickerState>(initialState);

  return {
    subscribe,

    // Core actions
    loadOptions: async (sequence: PictographData[]) => {
      update(state => ({ ...state, isLoading: true, error: null, currentSequence: sequence }));

      try {
        const nextOptions = await OptionsService.getNextOptions(sequence);
        update(state => ({ ...state, allOptions: nextOptions, isLoading: false }));
      } catch (error) {
        update(state => ({
          ...state,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    },

    setSortMethod: (method: SortMethod) => {
      update(state => {
        if (state.showAllActive) return state;
        return { ...state, sortMethod: method };
      });
    },

    setReversalFilter: (filter: ReversalFilter) => {
      update(state => {
        if (state.showAllActive) return state;
        return { ...state, reversalFilter: filter };
      });
    },

    toggleShowAll: () => {
      update(state => ({ ...state, showAllActive: !state.showAllActive }));
    },

    selectOption: (option: PictographData) => {
      selectedPictograph.set(option);
    },

    reset: () => set(initialState)
  };
}

// Create the base store instance
export const optionPickerStore = createStore();

// Filtered options - filters and sorts allOptions based on current state
export const filteredOptionsStore = derived(optionPickerStore, ($state) => {
  const { allOptions, currentSequence, reversalFilter, sortMethod } = $state;
  
  // Clone options to avoid mutating the original array
  let options = [...allOptions];
  
  // Apply reversal filtering when needed
  if (reversalFilter !== 'all') {
    options = options.filter(
      option => OptionsService.determineReversalCategory(currentSequence, option) === reversalFilter
    );
  }
  
  // Apply appropriate sorting
  if (sortMethod === 'reversals') {
    options.sort(OptionsService.getSorter('reversals', currentSequence));
  } else {
    options.sort(OptionsService.getSorter(sortMethod));
  }
  
  return options;
});

// Grouped options - organizes filtered options into categories
export const groupedOptionsStore = derived(
  [filteredOptionsStore, optionPickerStore], 
  ([$filteredOptions, $state]) => {
    const { showAllActive, sortMethod, currentSequence } = $state;
    const effectiveSortMethod = showAllActive ? 'type' : sortMethod;
    
    // Group options by the appropriate key
    const groups: Record<string, PictographData[]> = {};
    
    $filteredOptions.forEach(option => {
      const groupKey = OptionsService.determineGroupKey(
        option, 
        effectiveSortMethod, 
        currentSequence
      );
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(option);
    });
    
    // Sort the group keys in the appropriate order
    const sortedKeys = OptionsService.getSortedGroupKeys(
      Object.keys(groups), 
      effectiveSortMethod
    );
    
    // Build the final sorted groups object
    const sortedGroups: Record<string, PictographData[]> = {};
    sortedKeys.forEach(key => {
      sortedGroups[key] = groups[key];
    });
    
    return sortedGroups;
  }
);