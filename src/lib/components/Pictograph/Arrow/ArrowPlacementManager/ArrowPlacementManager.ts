// ArrowPlacementManager.ts
import type { PictographInterface } from '$lib/types/PictographInterface';
import type { ArrowInterface } from '../ArrowInterface';
import type { GridData } from '../../Grid/GridInterface';
import type { PictographChecker } from '../../PictographChecker';
import { ArrowAdjustmentCalculator } from './ArrowAdjustmentCalculator';
import { ArrowInitialPosCalculator } from './ArrowInitialPositionCalculator';
import { DefaultArrowPositioner } from './DefaultArrowPositioner';

export class ArrowPlacementManager {
  private initialPosCalculator: ArrowInitialPosCalculator;
  private adjustmentCalculator: ArrowAdjustmentCalculator;
  public defaultPositioner: DefaultArrowPositioner;

  constructor(
    private pictographData: PictographInterface,
    private gridData: GridData,
    private checker: PictographChecker
  ) {
    this.defaultPositioner = new DefaultArrowPositioner(pictographData, gridData, checker);
    this.initialPosCalculator = new ArrowInitialPosCalculator(pictographData, gridData);
    this.adjustmentCalculator = new ArrowAdjustmentCalculator(
      this.defaultPositioner,
      pictographData,
      gridData
    );
  }

  public updateArrowPlacements(arrows: ArrowInterface[]): void {
    arrows.forEach((arrow) => {
      this.updateArrowPosition(arrow);
    });
  }

  private updateArrowPosition(arrow: ArrowInterface): void {
    const initialPos = this.initialPosCalculator.getInitialCoords(arrow);
    const adjustment = this.adjustmentCalculator.getAdjustment(arrow);
    const boundingCenter = arrow.svgCenter || { x: 0, y: 0 };

    const newX = initialPos.x + adjustment.x - boundingCenter.x;
    const newY = initialPos.y + adjustment.y - boundingCenter.y;
    arrow.coords = { x: newX, y: newY };
  }
}
