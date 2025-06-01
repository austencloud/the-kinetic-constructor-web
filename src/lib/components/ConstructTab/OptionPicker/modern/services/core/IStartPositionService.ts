/**
 * Start Position Service Interface - Modern OptionPicker Nuclear Rebuild
 * Provides reactive state management for start position loading and selection
 */

import type { PictographData } from '$lib/types/PictographData';
import type { ISequenceService } from '$lib/services/core/ISequenceService';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StartPositionServiceState {
  // Core data
  availablePositions: PictographData[];
  selectedPosition: PictographData | null;
  
  // Loading state
  isLoading: boolean;
  error: string | null;
  
  // Validation state
  validationResults: Map<string, ValidationResult>;
  
  // Metadata
  totalCount: number;
  lastLoadTime: Date | null;
}

/**
 * Core interface for start position management service
 * Provides reactive state management with Svelte 5 runes
 */
export interface IStartPositionService {
  // Reactive state (read-only)
  readonly state: StartPositionServiceState;
  
  // Derived computations
  readonly availablePositions: PictographData[];
  readonly selectedPosition: PictographData | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly hasPositions: boolean;
  readonly hasSelection: boolean;
  readonly positionCount: number;
  
  // Validation
  readonly isValidPosition: (position: PictographData) => boolean;
  
  // Core actions
  loadPositions(): Promise<void>;
  selectPosition(position: PictographData): void;
  clearPosition(): void;
  refreshPositions(): Promise<void>;
  
  // Validation
  validatePosition(position: PictographData): ValidationResult;
  validateAllPositions(): void;
  
  // Integration
  syncWithSequenceService(sequenceService: ISequenceService): void;
  
  // Utility methods
  getPositionsByType(type: string): PictographData[];
  getRandomPosition(): PictographData | null;
  isPositionAvailable(position: PictographData): boolean;
  
  // Event system
  on(event: 'position:selected', handler: (data: { position: PictographData }) => void): () => void;
  on(event: 'position:cleared', handler: () => void): () => void;
  on(event: 'positions:loaded', handler: (data: { positions: PictographData[] }) => void): () => void;
  on(event: 'validation:completed', handler: (data: { results: Map<string, ValidationResult> }) => void): () => void;
  on(event: 'error', handler: (data: { error: string }) => void): () => void;
}

/**
 * Events that the start position service can emit
 */
export interface StartPositionServiceEvents {
  'position:selected': { position: PictographData };
  'position:cleared': {};
  'positions:loaded': { positions: PictographData[] };
  'validation:completed': { results: Map<string, ValidationResult> };
  'sync:completed': { sequenceService: ISequenceService };
  'error': { error: string };
}

/**
 * Configuration options for start position service
 */
export interface StartPositionServiceConfig {
  enableValidation: boolean;
  autoSync: boolean;
  enableCaching: boolean;
  cacheTimeout: number;
  maxPositions: number;
}
