// src/lib/components/PlacementManagers/ArrowPlacementManager/ArrowPlacementManager.ts
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { ArrowPlacementConfig, Coordinates } from './types';
import { getInitialPosition } from './utils/positionCalculator';
import { calculateAdjustment } from './utils/adjustmentCalculator';

/**
 * Main manager class that handles arrow placement calculations.
 * This class coordinates the initial position and adjustment calculations
 * for arrows in a pictograph.
 */
export class ArrowPlacementManager {
  private config: ArrowPlacementConfig;

  constructor(config: ArrowPlacementConfig) {
    const { gridData } = config;
    
    if (!gridData) {
      throw new Error('Grid data is required to initialize ArrowPlacementManager');
    }
    
    this.config = config;
  }

  /**
   * Updates the position of all arrows based on their current properties
   * and the pictograph configuration.
   */
  public updateArrowPlacements(arrows: ArrowData[]): void {
    arrows.forEach(this.updateArrowPlacement.bind(this));
  }

  /**
   * Updates the position of a single arrow.
   */
  private updateArrowPlacement(arrow: ArrowData): void {
    const initialPos = getInitialPosition(arrow, this.config);
    const adjustment = calculateAdjustment(arrow, this.config);
    
    arrow.coords = {
      x: initialPos.x + adjustment.x,
      y: initialPos.y + adjustment.y
    };
  }
}