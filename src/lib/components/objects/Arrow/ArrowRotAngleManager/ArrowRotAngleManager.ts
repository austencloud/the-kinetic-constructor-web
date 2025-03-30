import type { Loc } from '$lib/types/Types';
import type { Motion } from '../../Motion/Motion';
import { calculateArrowRotationAngle } from './arrowRotationUtils';

export default class ArrowRotAngleManager {
  updateRotation(motion: Motion, arrowLoc: Loc): number {
    return calculateArrowRotationAngle(motion, arrowLoc);
  }
}