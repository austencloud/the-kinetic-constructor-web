// src/lib/components/Pictograph/services/PictographPositioningService.ts
import type { PropData } from '../../objects/Prop/PropData';
import type { ArrowData } from '../../objects/Arrow/ArrowData';
import type { PictographManagers } from '../PictographManagers';
import { applyFallbackPosition } from '../utils/positionUtils';
import { tick } from 'svelte';
import type { ComponentPositioningStatus } from '../utils/componentStatusUtils';
import type { RenderStage } from '../constants/trackingConstants';

/**
 * Service for handling the positioning of pictograph elements
 */
export class PictographPositioningService {
  constructor(
    private debug: boolean = false
  ) {}

  /**
   * Apply fallback positions to props when normal positioning fails
   */
  public applyFallbackPositions(
    redProp: PropData | null,
    blueProp: PropData | null,
    componentPositioning: ComponentPositioningStatus
  ): void {
    if (redProp) {
      if (redProp.coords.x === 0 && redProp.coords.y === 0) {
        applyFallbackPosition(redProp, 'red');
      }
      componentPositioning.redProp = true;
    }

    if (blueProp) {
      if (blueProp.coords.x === 0 && blueProp.coords.y === 0) {
        applyFallbackPosition(blueProp, 'blue');
      }
      componentPositioning.blueProp = true;
    }

    // Mark arrows as positioned
    componentPositioning.redArrow = true;
    componentPositioning.blueArrow = true;
  }

  /**
   * Position props using the prop placement manager
   */
  public async positionProps(
    pictographManagers: PictographManagers,
    redProp: PropData,
    blueProp: PropData,
    componentPositioning: ComponentPositioningStatus
  ): Promise<{ redProp: PropData, blueProp: PropData }> {
    try {
      if (!pictographManagers.propPlacementManager) {
        throw new Error('Prop placement manager not available');
      }

      // Apply default positioning
      pictographManagers.propPlacementManager.defaultPositioner.updateCoords(redProp);
      pictographManagers.propPlacementManager.defaultPositioner.updateCoords(blueProp);

      // Apply beta positioning if needed
      if (pictographManagers.checker.endsWithBeta()) {
        pictographManagers.propPlacementManager.betaPositioner.reposition([redProp, blueProp]);
      }

      // Create new prop objects to trigger reactivity
      const newRedProp = JSON.parse(JSON.stringify(redProp));
      const newBlueProp = JSON.parse(JSON.stringify(blueProp));

      // Mark as positioned
      componentPositioning.redProp = true;
      componentPositioning.blueProp = true;

      return { redProp: newRedProp, blueProp: newBlueProp };
    } catch (error) {
      console.error('Error positioning props:', error);
      throw error;
    }
  }

  /**
   * Position arrows using the arrow placement manager
   */
  public positionArrows(
    pictographManagers: PictographManagers,
    redArrow: ArrowData,
    blueArrow: ArrowData,
    componentPositioning: ComponentPositioningStatus,
    validationFn: (arrow: ArrowData) => boolean
  ): void {
    // Skip if arrow placement manager is not available
    if (!pictographManagers.arrowPlacementManager) {
      componentPositioning.redArrow = true;
      componentPositioning.blueArrow = true;
      return;
    }

    // Create safe copies
    const safeRedArrow = { ...redArrow };
    const safeBlueArrow = { ...blueArrow };

    // Validate arrows
    const isRedArrowValid = validationFn(safeRedArrow);
    const isBlueArrowValid = validationFn(safeBlueArrow);

    // Skip positioning if either arrow is invalid
    if (!isRedArrowValid || !isBlueArrowValid) {
      console.warn('Incomplete arrow data, skipping arrow positioning');
      if (this.debug) {
        console.log('Red arrow valid:', isRedArrowValid, 'Blue arrow valid:', isBlueArrowValid);
      }
      
      componentPositioning.redArrow = true;
      componentPositioning.blueArrow = true;
      return;
    }

    try {
      // Only attempt positioning if both arrows are fully valid
      pictographManagers.arrowPlacementManager.updateArrowPlacements([safeRedArrow, safeBlueArrow]);
      componentPositioning.redArrow = true;
      componentPositioning.blueArrow = true;
    } catch (error) {
      console.error('Error positioning arrows:', error);
      componentPositioning.redArrow = true;
      componentPositioning.blueArrow = true;
    }
  }

  /**
   * Execute the full positioning sequence
   * @returns Promise containing the updated props
   */
  public async updatePlacements(
    pictographManagers: PictographManagers | null,
    redProp: PropData | null,
    blueProp: PropData | null, 
    redArrow: ArrowData | null,
    blueArrow: ArrowData | null,
    componentPositioning: ComponentPositioningStatus,
    validationFn: (arrow: ArrowData) => boolean,
    isDataCompleteFn: () => boolean,
    onStageChange: (stage: RenderStage) => void,
    onLoaded: (data?: any) => void
  ): Promise<{ redProp: PropData | null, blueProp: PropData | null }> {
    try {
      // Check for complete data first
      if (!isDataCompleteFn()) {
        console.log('Pictograph has incomplete data, applying fallback positions only');
        this.applyFallbackPositions(redProp, blueProp, componentPositioning);
        onStageChange('complete');
        onLoaded();
        return { redProp, blueProp };
      }

      // Check for manager availability
      if (!pictographManagers) {
        console.warn('Cannot update placements: managers not initialized');
        this.applyFallbackPositions(redProp, blueProp, componentPositioning);
        onStageChange('complete');
        onLoaded();
        return { redProp, blueProp };
      }

      // Set stage to positioning
      onStageChange('positioning');

      // Position props (with error handling)
      let updatedProps = { redProp, blueProp };
      try {
        if (pictographManagers.propPlacementManager && redProp && blueProp) {
          updatedProps = await this.positionProps(
            pictographManagers, 
            redProp, 
            blueProp, 
            componentPositioning
          );
        }
      } catch (propError) {
        console.error('Error positioning props:', propError);
        this.applyFallbackPositions(redProp, blueProp, componentPositioning);
      }

      // Wait for DOM update
      await tick();

      // Position arrows (with independent error handling)
      try {
        if (pictographManagers.arrowPlacementManager && redArrow && blueArrow) {
          this.positionArrows(
            pictographManagers,
            redArrow,
            blueArrow,
            componentPositioning,
            validationFn
          );
        } else {
          componentPositioning.redArrow = true;
          componentPositioning.blueArrow = true;
        }
      } catch (arrowError) {
        console.error('Error positioning arrows:', arrowError);
        componentPositioning.redArrow = true;
        componentPositioning.blueArrow = true;
      }

      // Always transition to complete
      onStageChange('complete');
      onLoaded();
      
      return updatedProps;
    } catch (error) {
      console.error('Fatal error in updatePlacements:', error);
      this.applyFallbackPositions(redProp, blueProp, componentPositioning);
      onStageChange('complete');
      onLoaded({ error: true });
      return { redProp, blueProp };
    }
  }
}