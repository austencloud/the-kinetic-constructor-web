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
 * Handles the adjustment calculations for both normal and mirrored arrows.
 */
export function calculateAdjustment(arrow: ArrowData, config: ArrowPlacementConfig): Coordinates {
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
			handRotDir:
				(motion.handRotDirCalculator?.getHandRotDir(
					motion.startLoc,
					motion.endLoc
				) as ShiftHandRotDir) || undefined
		}
	);

	if (!directionalAdjustments || directionalAdjustments.length === 0) {
		return { x, y }; // Return default adjustment if no directional adjustments
	}

	// Get the quadrant index to select the correct adjustment
	const quadrantIndex = getQuadrantIndex(arrow, pictographData.gridMode || 'diamond');

	if (quadrantIndex < 0 || quadrantIndex >= directionalAdjustments.length) {
		return { x: 0, y: 0 }; // Return zero adjustment for invalid indices
	}

	// Apply the selected adjustment
	const [adjX, adjY] = directionalAdjustments[quadrantIndex];

	// No need to invert X for mirrored arrows here - we'll handle this in the placement manager
	// This ensures we get consistent adjustment calculations first, then apply mirroring effects
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

// src/lib/components/objects/Arrow/Arrow.svelte (transform property update)
// This is just the critical part that needs to be updated

// Transform calculation (memoized)
// $: if (svgData && arrowData.coords) {
//   // Apply transformations in the correct order:
//   // For mirrored arrows, we need to be careful with the transformation order
//
//   const mirrorTransform = arrowData.svgMirrored ? 'scale(-1, 1)' : '';
//
//   // Apply transformations in the correct order:
//   // 1. Translate to position (this already accounts for mirroring adjustments)
//   // 2. Rotate according to the calculated angle
//   // 3. Apply mirroring if needed
//   transform = `
//     translate(${arrowData.coords.x}, ${arrowData.coords.y})
//     rotate(${rotationAngle})
//     ${mirrorTransform}
//   `.trim();
// }
