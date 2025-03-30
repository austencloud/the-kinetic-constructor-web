import type { PictographGetter } from '$lib/components/Pictograph/PictographGetter';
import type { Motion } from '../../Motion/Motion';
import { calculateArrowLocation } from './arrowLocationUtils';

/**
 * Simple manager class to handle arrow location calculations with pictograph context
 */
export default class ArrowLocationManager {
  constructor(private getter: PictographGetter) {}

  /**
   * Calculate and return the location for an arrow
   */
  getArrowLocation(motion: Motion) {
    return calculateArrowLocation(
      motion,
      (m) => this.getter.getOtherMotion(m),
      () => this.getter.getShiftMotion()
    );
  }
}
