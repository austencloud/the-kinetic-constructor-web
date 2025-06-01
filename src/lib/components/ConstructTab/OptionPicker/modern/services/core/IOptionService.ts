/**
 * Option Service Interface - Modern OptionPicker Nuclear Rebuild
 * Provides reactive state management for option loading, filtering, and selection
 */

import type { PictographData } from '$lib/types/PictographData';

export interface FilterCriteria {
  startPosition?: string;
  endPosition?: string;
  motionType?: string;
  propType?: string;
  difficulty?: number;
  timing?: string;
  direction?: string;
}

export interface SortCriteria {
  field: 'letter' | 'difficulty' | 'frequency' | 'type' | 'endPosition';
  direction: 'asc' | 'desc';
}

export interface OptionServiceState {
  // Core data
  availableOptions: PictographData[];
  filteredOptions: PictographData[];
  selectedOptions: PictographData[];
  
  // Loading state
  isLoading: boolean;
  error: string | null;
  
  // Filter/sort state
  currentFilters: FilterCriteria;
  currentSort: SortCriteria | null;
  
  // Metadata
  totalCount: number;
  lastLoadTime: Date | null;
}

/**
 * Core interface for option management service
 * Provides reactive state management with Svelte 5 runes
 */
export interface IOptionService {
  // Reactive state (read-only)
  readonly state: OptionServiceState;
  
  // Derived computations
  readonly availableOptions: PictographData[];
  readonly filteredOptions: PictographData[];
  readonly selectedOptions: PictographData[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly hasOptions: boolean;
  readonly optionCount: number;
  
  // Core actions
  loadOptionsForPosition(position: PictographData): Promise<void>;
  clearOptions(): void;
  refreshOptions(): Promise<void>;
  
  // Filtering and sorting
  filterOptions(criteria: FilterCriteria): void;
  sortOptions(criteria: SortCriteria): void;
  clearFilters(): void;
  
  // Selection management
  selectOption(option: PictographData): void;
  deselectOption(option: PictographData): void;
  clearSelection(): void;
  isOptionSelected(option: PictographData): boolean;
  
  // Utility methods
  getOptionsByLetter(letter: string): PictographData[];
  getOptionsByType(type: string): PictographData[];
  validateOption(option: PictographData): boolean;
  
  // Event system
  on(event: 'options:loaded', handler: (data: { options: PictographData[] }) => void): () => void;
  on(event: 'option:selected', handler: (data: { option: PictographData }) => void): () => void;
  on(event: 'option:deselected', handler: (data: { option: PictographData }) => void): () => void;
  on(event: 'options:filtered', handler: (data: { options: PictographData[] }) => void): () => void;
  on(event: 'options:sorted', handler: (data: { options: PictographData[] }) => void): () => void;
  on(event: 'error', handler: (data: { error: string }) => void): () => void;
}

/**
 * Events that the option service can emit
 */
export interface OptionServiceEvents {
  'options:loaded': { options: PictographData[] };
  'option:selected': { option: PictographData };
  'option:deselected': { option: PictographData };
  'options:filtered': { options: PictographData[] };
  'options:sorted': { options: PictographData[] };
  'options:cleared': {};
  'selection:cleared': {};
  'error': { error: string };
}

/**
 * Configuration options for option service
 */
export interface OptionServiceConfig {
  maxOptions: number;
  enableCaching: boolean;
  cacheTimeout: number;
  autoFilter: boolean;
  defaultSort: SortCriteria | null;
}
