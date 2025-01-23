// ArrowAdjustmentCalculator.ts
import type { ArrowInterface } from '../ArrowInterface';
import type { DefaultArrowPositioner } from './DefaultArrowPositioner';
import { DirectionalTupleManager } from './tupleGenerators/DirectionalTupleManager';

export class ArrowAdjustmentCalculator {
  constructor(private defaultPositioner: DefaultArrowPositioner) {}

  public getAdjustment(arrow: ArrowInterface): { x: number; y: number } {
    // 1) Possibly do letter-based checks, special placements, etc.
    //    For now, or if letter is null, we skip:
    if (!arrow.motion.pictographData?.letter) {
      return { x: 0, y: 0 };
    }

    // 2) Could do special_placement logic here. If no special => fallback to default:
    const [x, y] = this.defaultPositioner.getDefaultAdjustment(arrow);

    // 3) Generate directional tuples for the final offset
    const dtManager = new DirectionalTupleManager(arrow.motion);
    const directionalAdjustments = dtManager.generateDirectionalTuples(x, y);

    if (!directionalAdjustments || directionalAdjustments.length === 0) {
      console.warn(`No directional adjustments for motion type: ${arrow.motion.motionType}`);
      return { x, y };
    }

    // 4) Quadrant index
    const quadrantIndex = this.getQuadrantIndex(arrow); // if you prefer separate QuadrantIndexHandler
    if (quadrantIndex < 0 || quadrantIndex >= directionalAdjustments.length) {
      console.error(`Quadrant index out of range: ${quadrantIndex}`);
      return { x: 0, y: 0 };
    }

    const [adjX, adjY] = directionalAdjustments[quadrantIndex];
    return { x: adjX, y: adjY };
  }

  /**
   * If you want the quadrant logic from your QuadrantIndexHandler, copy it here,
   * or import it. For now, we’ll do a minimal approach:
   */
  private getQuadrantIndex(arrow: ArrowInterface): number {
    // e.g. diamond pro => index from arrow.loc
    // or do a direct approach. This is just a placeholder:
    return 0;
  }
}
