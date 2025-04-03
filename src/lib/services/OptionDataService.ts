// src/lib/services/OptionDataService.ts
import type { PictographData } from '$lib/types/PictographData';
import type { MotionData } from '$lib/components/objects/Motion/MotionData';
import { BLUE, RED, NO_ROT } from '$lib/types/Constants';
import pictographDataStore from '$lib/stores/pictograph/pictographStore';
import { get } from 'svelte/store';

/**
 * Service responsible for fetching and manipulating option data for the Option Picker
 */
export class OptionDataService {
  /**
   * Get all valid next options for the current sequence
   */
  static getNextOptions(
    sequence: PictographData[], 
    selectedFilter: string | null = null
  ): PictographData[] {
    if (!sequence.length) {
      return [];
    }

    try {
      const allOptions = this.loadAllNextOptionDicts(sequence);
      
      // Apply filter if specified
      let filteredOptions = allOptions;
      if (selectedFilter !== null && selectedFilter !== 'all') {
        filteredOptions = allOptions.filter(option => 
          this.determineReversalFilter(sequence, option) === selectedFilter
        );
      }
      
      // Update orientations for each option
      this.updateOrientations(sequence, filteredOptions);
      
      return filteredOptions;
    } catch (error) {
      console.error('Error getting next options:', error);
      return [];
    }
  }

  /**
   * Load all possible next options based on the current sequence
   */
  private static loadAllNextOptionDicts(
    sequence: PictographData[]
  ): PictographData[] {
    // Ensure we have a valid sequence
    if (!sequence.length) {
      return [];
    }

    // Get the last item in the sequence (or second-to-last if last is a placeholder)
    const last = sequence[sequence.length - 1].letter === null && sequence.length > 1
      ? sequence[sequence.length - 2]
      : sequence[sequence.length - 1];

    // Get the end position from the last pictograph
    const start = last.endPos;
    if (!start) {
      return [];
    }

    try {
      // Get all possible options from the dataset
      const allPictographs = get(pictographDataStore);
      
      // Filter to only those that start at the current end position
      const nextOptions = allPictographs.filter(item => item.startPos === start);
      
      // Update orientation information
      nextOptions.forEach(option => {
        // Set start orientations from the last pictograph's end orientations
        if (option.redMotionData && last.redMotionData) {
          option.redMotionData.startOri = last.redMotionData.endOri;
        }
        
        if (option.blueMotionData && last.blueMotionData) {
          option.blueMotionData.startOri = last.blueMotionData.endOri;
        }
      });
      
      return nextOptions;
    } catch (error) {
      console.error('Error loading next options:', error);
      return [];
    }
  }

  /**
   * Update orientation values for a set of options
   */
  static updateOrientations(
    sequence: PictographData[], 
    options: PictographData[]
  ): void {
    if (!sequence.length || !options.length) {
      return;
    }

    const last = sequence[sequence.length - 1];
    
    options.forEach(option => {
      // Update red prop orientations
      if (option.redMotionData && last.redMotionData) {
        option.redMotionData.startOri = last.redMotionData.endOri;
        // For this simplified implementation, we're not calculating endOri
      }
      
      // Update blue prop orientations
      if (option.blueMotionData && last.blueMotionData) {
        option.blueMotionData.startOri = last.blueMotionData.endOri;
        // For this simplified implementation, we're not calculating endOri
      }
    });
  }

  /**
   * Determine the reversal filter category for an option
   */
  static determineReversalFilter(
    sequence: PictographData[], 
    option: PictographData
  ): string {
    if (!sequence.length || !option) {
      return 'continuous';
    }
    
    const [blueContinuous, redContinuous] = this.checkContinuity(sequence, option);
    
    if (blueContinuous && redContinuous) {
      return 'continuous';
    } else if (blueContinuous !== redContinuous) {
      return 'one_reversal';
    }
    
    return 'two_reversals';
  }

  /**
   * Check if motion is continuous between the sequence and next option
   */
  private static checkContinuity(
    sequence: PictographData[], 
    option: PictographData
  ): [boolean, boolean] {
    // Helper function to get the last rotation direction in the sequence
    const getLastRot = (seq: PictographData[], color: 'red' | 'blue'): string | null => {
      for (let i = seq.length - 1; i >= 0; i--) {
        const item = seq[i];
        const motionData = color === 'blue' 
          ? item.blueMotionData 
          : item.redMotionData;
        
        if (motionData && motionData.propRotDir && motionData.propRotDir !== NO_ROT) {
          return motionData.propRotDir;
        }
      }
      return null;
    };

    // Get last rotation directions from sequence
    const lastBlue = getLastRot(sequence, 'blue');
    const lastRed = getLastRot(sequence, 'red');
    
    // Get current rotation directions from option
    const currBlue = option.blueMotionData?.propRotDir || NO_ROT;
    const currRed = option.redMotionData?.propRotDir || NO_ROT;
    
    // If current direction is NO_ROT, use the last direction
    const effectiveBlue = currBlue === NO_ROT ? lastBlue : currBlue;
    const effectiveRed = currRed === NO_ROT ? lastRed : currRed;
    
    // Determine continuity
    const blueContinuous = 
      lastBlue === null || effectiveBlue === null || effectiveBlue === lastBlue;
    
    const redContinuous = 
      lastRed === null || effectiveRed === null || effectiveRed === lastRed;
    
    return [blueContinuous, redContinuous];
  }
}