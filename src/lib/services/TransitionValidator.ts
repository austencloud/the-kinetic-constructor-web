/**
 * Transition Validator Service
 * Validates pictograph transitions and provides contextual filtering
 * Uses authentic CSV data for transition validation
 */

import type { PictographData } from '$lib/types/PictographData';
import { getValidTransitionsFromPosition, type PictographDataLoaderOptions } from '$lib/utils/testing/PictographDataLoader';
import { PictographDataValidator } from '$lib/utils/testing/PictographDataValidator';

export interface TransitionValidationOptions {
  includeStaticMotions?: boolean;
  includeDashMotions?: boolean;
  filterByTiming?: ('split' | 'tog' | 'quarter' | 'none')[];
  filterByDirection?: ('same' | 'opp' | 'none')[];
  filterByLetter?: string[];
  strictValidation?: boolean;
}

export interface TransitionValidationResult {
  isValid: boolean;
  validTransitions: PictographData[];
  errors: string[];
  warnings: string[];
  totalFound: number;
  filteredCount: number;
}

export class TransitionValidator {
  private static instance: TransitionValidator;

  private constructor() {}

  public static getInstance(): TransitionValidator {
    if (!TransitionValidator.instance) {
      TransitionValidator.instance = new TransitionValidator();
    }
    return TransitionValidator.instance;
  }

  /**
   * Get all valid transitions from a start position with validation
   */
  public async getValidTransitions(
    startPosition: PictographData,
    options: TransitionValidationOptions = {}
  ): Promise<TransitionValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate start position
    if (!startPosition.endPos) {
      errors.push('Start position must have an end position defined');
      return {
        isValid: false,
        validTransitions: [],
        errors,
        warnings,
        totalFound: 0,
        filteredCount: 0
      };
    }

    try {
      // Convert options to PictographDataLoaderOptions
      const loaderOptions: PictographDataLoaderOptions = {
        includeStaticMotions: options.includeStaticMotions ?? true,
        includeDashMotions: options.includeDashMotions ?? true,
        filterByTiming: options.filterByTiming,
        filterByDirection: options.filterByDirection,
        filterByLetter: options.filterByLetter
      };

      // Get transitions from the end position of the start pictograph
      const transitions = await getValidTransitionsFromPosition(
        startPosition.endPos,
        loaderOptions
      );

      const totalFound = transitions.length;

      // Apply additional validation if strict mode is enabled
      let validTransitions = transitions;
      if (options.strictValidation) {
        validTransitions = this.applyStrictValidation(transitions, startPosition);
      }

      // Validate each transition
      const validatedTransitions = validTransitions.filter((transition) => {
        const validation = PictographDataValidator.validatePictographData(transition, {
          strictMode: options.strictValidation ?? false,
          checkBusinessRules: true,
          allowEmptyFields: false
        });

        if (!validation.isValid) {
          warnings.push(`Invalid transition ${transition.letter}: ${validation.errors.join(', ')}`);
          return false;
        }

        if (validation.warnings.length > 0) {
          warnings.push(`Transition ${transition.letter}: ${validation.warnings.join(', ')}`);
        }

        return true;
      });

      const filteredCount = validatedTransitions.length;

      // Add performance warning if too many options
      if (filteredCount > 50) {
        warnings.push(`Large number of transitions found (${filteredCount}). Consider adding more filters.`);
      }

      // Add warning if no transitions found
      if (filteredCount === 0 && totalFound > 0) {
        warnings.push('All transitions were filtered out by validation rules');
      }

      return {
        isValid: filteredCount > 0,
        validTransitions: validatedTransitions,
        errors,
        warnings,
        totalFound,
        filteredCount
      };

    } catch (error) {
      errors.push(`Failed to load transitions: ${error instanceof Error ? error.message : String(error)}`);
      return {
        isValid: false,
        validTransitions: [],
        errors,
        warnings,
        totalFound: 0,
        filteredCount: 0
      };
    }
  }

  /**
   * Apply strict validation rules for transitions
   */
  private applyStrictValidation(
    transitions: PictographData[],
    startPosition: PictographData
  ): PictographData[] {
    return transitions.filter((transition) => {
      // Ensure start position matches
      if (transition.startPos !== startPosition.endPos) {
        return false;
      }

      // Additional business rule validations can be added here
      // For example, checking orientation compatibility, motion flow, etc.

      return true;
    });
  }

  /**
   * Check if a specific transition is valid from a start position
   */
  public async isValidTransition(
    startPosition: PictographData,
    targetTransition: PictographData,
    options: TransitionValidationOptions = {}
  ): Promise<boolean> {
    const result = await this.getValidTransitions(startPosition, options);
    
    return result.validTransitions.some((transition) => 
      transition.letter === targetTransition.letter &&
      transition.startPos === targetTransition.startPos &&
      transition.endPos === targetTransition.endPos
    );
  }

  /**
   * Get transition statistics for a start position
   */
  public async getTransitionStatistics(
    startPosition: PictographData,
    options: TransitionValidationOptions = {}
  ): Promise<{
    totalTransitions: number;
    validTransitions: number;
    byTiming: Record<string, number>;
    byDirection: Record<string, number>;
    byLetter: Record<string, number>;
  }> {
    const result = await this.getValidTransitions(startPosition, options);
    
    const byTiming: Record<string, number> = {};
    const byDirection: Record<string, number> = {};
    const byLetter: Record<string, number> = {};

    result.validTransitions.forEach((transition) => {
      // Count by timing
      const timing = transition.timing || 'none';
      byTiming[timing] = (byTiming[timing] || 0) + 1;

      // Count by direction
      const direction = transition.direction || 'none';
      byDirection[direction] = (byDirection[direction] || 0) + 1;

      // Count by letter
      const letter = transition.letter || 'unknown';
      byLetter[letter] = (byLetter[letter] || 0) + 1;
    });

    return {
      totalTransitions: result.totalFound,
      validTransitions: result.filteredCount,
      byTiming,
      byDirection,
      byLetter
    };
  }
}

// Export singleton instance
export const transitionValidator = TransitionValidator.getInstance();

// Convenience functions
export async function getValidTransitions(
  startPosition: PictographData,
  options?: TransitionValidationOptions
): Promise<TransitionValidationResult> {
  return transitionValidator.getValidTransitions(startPosition, options);
}

export async function isValidTransition(
  startPosition: PictographData,
  targetTransition: PictographData,
  options?: TransitionValidationOptions
): Promise<boolean> {
  return transitionValidator.isValidTransition(startPosition, targetTransition, options);
}

export async function getTransitionStatistics(
  startPosition: PictographData,
  options?: TransitionValidationOptions
): Promise<{
  totalTransitions: number;
  validTransitions: number;
  byTiming: Record<string, number>;
  byDirection: Record<string, number>;
  byLetter: Record<string, number>;
}> {
  return transitionValidator.getTransitionStatistics(startPosition, options);
}
