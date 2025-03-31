// src/lib/components/PlacementManagers/ArrowPlacementManager/utils/adjustmentCalculator.ts
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { ArrowPlacementConfig, Coordinates } from '../types';
import type { Motion } from '$lib/components/objects/Motion/Motion';
import { getDefaultAdjustment } from './defaultPlacementUtils';
import { getDirectionTuples, getQuadrantIndex } from './directionUtils';
import type { ShiftHandRotDir } from '$lib/types/Types';

/**
 * Calculates position adjustments for an arrow based on its properties
 * and the pictograph configuration.
 */
export function calculateAdjustment(
  arrow: ArrowData, 
  config: ArrowPlacementConfig
): Coordinates {
  const { pictographData, gridData } = config;
  
  // No adjustments needed if no letter is set
  if (!pictographData.letter) {
    return { x: 0, y: 0 };
  }
  
  // Get default adjustment values
  const [x, y] = getDefaultAdjustment(arrow, config);
  
  // Get the corresponding motion for this arrow
  const motion = getMotionForArrow(arrow, pictographData);
  if (!motion) {
    return { x, y }; // Return default adjustment if no motion found
  }
  
  // Generate directional tuples based on the motion
  const directionalAdjustments = getDirectionTuples(
    x, 
    y,
    motion.motionType,
    motion.propRotDir,
    motion.gridMode || 'diamond',
    {
      startOri: motion.startOri,
      handRotDir: motion.handRotDirCalculator?.getHandRotDir(
        motion.startLoc,
        motion.endLoc
      ) as ShiftHandRotDir || undefined
    }
  );
  
  if (!directionalAdjustments || directionalAdjustments.length === 0) {
    return { x, y }; // Return default adjustment if no directional adjustments
  }
  
  // Get the quadrant index to select the correct adjustment
  const quadrantIndex = getQuadrantIndex(
    arrow, 
    pictographData.gridMode || 'diamond'
  );
  
  if (quadrantIndex < 0 || quadrantIndex >= directionalAdjustments.length) {
    return { x: 0, y: 0 }; // Return zero adjustment for invalid indices
  }
  
  // Apply the selected adjustment
  const [adjX, adjY] = directionalAdjustments[quadrantIndex];
  return { x: adjX, y: adjY };
}

/**
 * Gets the motion object for an arrow based on its color
 */
function getMotionForArrow(arrow: ArrowData, pictographData: any): Motion | null {
  if (arrow.color === 'red' && pictographData.redMotion) {
    return pictographData.redMotion;
  } else if (arrow.color === 'blue' && pictographData.blueMotion) {
    return pictographData.blueMotion;
  }
  return null;
}