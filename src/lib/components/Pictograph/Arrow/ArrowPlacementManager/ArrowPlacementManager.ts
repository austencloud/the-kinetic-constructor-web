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
	private defaultPositioner: DefaultArrowPositioner;

	constructor(
		private pictographData: PictographInterface,
		private gridData: GridData,
		private checker: PictographChecker
	) {
		this.defaultPositioner = new DefaultArrowPositioner(pictographData, gridData, checker);

		// Pass pictographData AND gridData here
		this.initialPosCalculator = new ArrowInitialPosCalculator(pictographData, gridData);

		this.adjustmentCalculator = new ArrowAdjustmentCalculator(this.defaultPositioner);
	}

	public updateArrowPlacements(arrows: ArrowInterface[]): void {
		arrows.forEach((arrow) => {
			this.updateArrowPosition(arrow);
		});
	}

	public updateArrowPosition(arrow: ArrowInterface): void {
		const initialPos = this.initialPosCalculator.getInitialCoords(arrow);
		const adjustment = this.adjustmentCalculator.getAdjustment(arrow);
		const boundingCenter = arrow.svgCenter || { x: 0, y: 0 };

		const newX = initialPos.x + adjustment.x - boundingCenter.x;
		const newY = initialPos.y + adjustment.y - boundingCenter.y;

		console.log('Arrow new position:', { x: newX, y: newY });
		arrow.coords = { x: newX, y: newY };
	}
}
