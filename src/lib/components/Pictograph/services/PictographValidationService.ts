// src/lib/components/Pictograph/services/PictographValidationService.ts
import type { PictographData } from '$lib/types/PictographData';
import type { PropData } from '../../objects/Prop/PropData';
import type { ArrowData } from '../../objects/Arrow/ArrowData';
import { get } from 'svelte/store';
import type { Writable } from 'svelte/store';

/**
 * Service for validating pictograph data and components
 */
export class PictographValidationService {
  constructor(
    private pictographDataStore: Writable<PictographData>,
    private debug: boolean = false
  ) {}

  /**
   * Check if the pictograph data is complete enough to render all components
   */
  public isDataComplete(
    redProp: PropData | null, 
    blueProp: PropData | null, 
    redArrow: ArrowData | null, 
    blueArrow: ArrowData | null,
    stage: string,
    initializationComplete: boolean
  ): boolean {
    const pictograph = get(this.pictographDataStore);

    // Check for required motion data
    if (!pictograph.redMotionData || !pictograph.blueMotionData) {
      if (this.debug) console.log('Incomplete pictograph: Missing motion data');
      return false;
    }

    // Deeper check for motion data completeness
    if (
      !pictograph.redMotionData.motionType ||
      !pictograph.redMotionData.startOri ||
      !pictograph.blueMotionData.motionType ||
      !pictograph.blueMotionData.startOri
    ) {
      if (this.debug) console.log('Incomplete pictograph: Missing required motion properties');
      return false;
    }

    // Check if all required props and arrows are available
    if (!redProp || !blueProp || !redArrow || !blueArrow) {
      // Only return false if we're not in the middle of loading
      // This prevents flickering during normal loading
      if (stage === 'complete' || initializationComplete) {
        if (this.debug) console.log('Incomplete pictograph: Missing required visual components');
        return false;
      }
    }

    return true;
  }

  /**
   * Validate arrow data for positioning
   */
  public validateArrowForPositioning(arrow: ArrowData | null): boolean {
    if (!arrow) return false;
    
    return !!(
      arrow.motionType &&
      arrow.startOri &&
      arrow.turns &&
      arrow.propRotDir
    );
  }
}