// ArrowPlacementManager.ts
import type { ArrowData } from '../ArrowData';
import type { PictographChecker } from '../../PictographChecker';
import { ArrowAdjustmentCalculator } from './ArrowAdjustmentCalculator';
import { ArrowInitialPosCalculator } from './ArrowInitialPositionCalculator';
import { DefaultArrowPositioner } from './DefaultArrowPositioner';
import type { GridData } from '../../Grid/GridData';
import type { PictographData } from '$lib/types/PictographData';

export class ArrowPlacementManager {
	private initialPosCalculator: ArrowInitialPosCalculator;
	private adjustmentCalculator: ArrowAdjustmentCalculator;
	public defaultPositioner: DefaultArrowPositioner;

	constructor(
		private pictographData: PictographData,
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

	public updateArrowPlacements(arrows: ArrowData[]): void {
		arrows.forEach((arrow) => {
			const initialPos = this.initialPosCalculator.getInitialCoords(arrow);
			const adjustment = this.adjustmentCalculator.getAdjustment(arrow);

			arrow.coords = {
				x: initialPos.x + adjustment.x,
				y: initialPos.y + adjustment.y
			};
			// log the coords

		});
	}
}
