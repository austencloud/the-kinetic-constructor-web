// ArrowPlacementManager.ts
import { ArrowAdjustmentCalculator } from './ArrowAdjustmentCalculator';
import { ArrowInitialPosCalculator } from './ArrowInitialPositionCalculator';
import { DefaultArrowPositioner } from './DefaultArrowPositioner';
import type { PictographData } from '$lib/types/PictographData';
import type { PictographChecker } from '$lib/components/Pictograph/PictographChecker';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';

export class ArrowPlacementManager {
	private initialPosCalculator: ArrowInitialPosCalculator;
	private adjustmentCalculator: ArrowAdjustmentCalculator;
	public defaultPositioner: DefaultArrowPositioner;

	constructor(
		private pictographData: PictographData,
		private gridData: GridData | null,
		private checker: PictographChecker
	) {
		if (!gridData) {
			throw new Error('Grid data is required to initialize PropPlacementManager');
		}
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
