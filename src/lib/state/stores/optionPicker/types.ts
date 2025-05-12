/**
 * Option Picker Types
 *
 * This module provides type definitions for the option picker state.
 */

import type { PictographData } from '$lib/types/PictographData';
import type { SortMethod, ReversalFilter } from '$lib/components/ConstructTab/OptionPicker/config';

// ===== Type Definitions =====
export type LastSelectedTabState = Partial<Record<SortMethod, string | null>>;

export interface OptionPickerState {
  // Core data
  sequence: PictographData[];
  options: PictographData[];
  selectedPictograph: PictographData | null;
  
  // UI state
  sortMethod: SortMethod;
  reversalFilter?: ReversalFilter;
  isLoading: boolean;
  error: string | null;
  lastSelectedTab: LastSelectedTabState;
  selectedTab: string | null;
}
