// src/lib/stores/optionPicker/optionPickerStore.ts
import { writable, derived, get } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import { selectedPictograph } from '$lib/stores/sequence/selectedPictographStore';
import { OptionDataService } from '$lib/services/OptionDataService';
import { NO_ROT } from '$lib/types/Constants';

// Types
export type ReversalFilterType = 'continuous' | 'one_reversal' | 'two_reversals' | 'all';

export interface OptionPickerState {
  options: PictographData[];
  filteredOptions: PictographData[];
  selectedFilter: ReversalFilterType;
  isLoading: boolean;
  currentSequence: PictographData[];
  error: string | null;
}

// Initial state
const initialState: OptionPickerState = {
  options: [],
  filteredOptions: [],
  selectedFilter: 'all',
  isLoading: true,
  currentSequence: [],
  error: null
};

// Create the main store
const { subscribe, set, update } = writable<OptionPickerState>(initialState);

// Derived store for letter type groups
export const optionsByLetterType = derived({ subscribe }, ($state) => {
  const grouped: Record<string, PictographData[]> = {};
  
  $state.filteredOptions.forEach(option => {
    if (!option) return;
    
    const letterType = getLetterType(option.letter);
    
    if (!grouped[letterType]) {
      grouped[letterType] = [];
    }
    
    grouped[letterType].push(option);
  });
  
  return grouped;
});

// Helper functions
function getLetterType(letter: string | null): string {
  if (!letter) return 'unknown';
  
  // Simple letter type detection - can be expanded based on your requirements
  if (letter.startsWith('α')) return 'alpha';
  if (letter.startsWith('β')) return 'beta';
  if (letter.startsWith('γ')) return 'gamma';
  return 'other';
}

// Public store interface
export const optionPickerStore = {
  subscribe,
  
  // Load options for the next valid positions
  loadOptions: (sequence: PictographData[]) => {
    update(state => ({
      ...state,
      isLoading: true,
      currentSequence: sequence,
      error: null
    }));
    
    try {
      // Get options using the OptionDataService
      const options = OptionDataService.getNextOptions(sequence);
      
      update(state => {
        // Apply filter to the loaded options
        const filteredOptions = state.selectedFilter === 'all' 
          ? options 
          : options.filter(opt => 
              OptionDataService.determineReversalFilter(sequence, opt) === state.selectedFilter
            );
            
        return {
          ...state,
          options,
          filteredOptions,
          isLoading: false
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to load options:', errorMessage);
      
      update(state => ({
        ...state,
        isLoading: false,
        error: `Failed to load options: ${errorMessage}`
      }));
    }
  },
  
  // Apply a reversal filter
  setReversalFilter: (filter: ReversalFilterType) => {
    update(state => {
      const filteredOptions = filter === 'all' 
        ? state.options 
        : state.options.filter(opt => 
            OptionDataService.determineReversalFilter(state.currentSequence, opt) === filter
          );
          
      return {
        ...state,
        selectedFilter: filter,
        filteredOptions
      };
    });
  },
  
  // Select an option
  selectOption: (option: PictographData) => {
    selectedPictograph.set(option);
  },
  
  // Reset the store
  reset: () => {
    set(initialState);
  }
};

// Export the store
export default optionPickerStore;