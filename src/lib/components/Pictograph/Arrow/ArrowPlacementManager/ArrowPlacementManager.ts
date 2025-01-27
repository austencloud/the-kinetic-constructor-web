// ArrowPlacementManager.ts
import type { PictographInterface } from '$lib/types/PictographInterface';
import type { ArrowInterface } from '../ArrowInterface';
import type { PictographChecker } from '../../PictographChecker';
import { ArrowAdjustmentCalculator } from './ArrowAdjustmentCalculator';
import { ArrowInitialPosCalculator } from './ArrowInitialPositionCalculator';
import { DefaultArrowPositioner } from './DefaultArrowPositioner';
import type { GridData } from '../../Grid/GridData';

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
			// Calculate initial position
			const initialPos = this.initialPosCalculator.getInitialCoords(arrow);

			// Apply adjustments
			const adjustment = this.adjustmentCalculator.getAdjustment(arrow);

			// If mirrored, adjust coordinates programmatically
			if (arrow.svgMirrored) {
				const mirrorAdjustment = this.calculateMirrorAdjustment(arrow);
				arrow.coords = {
					x: initialPos.x + adjustment.x + mirrorAdjustment.x,
					y: initialPos.y + adjustment.y + mirrorAdjustment.y
				};
			} else {
				arrow.coords = {
					x: initialPos.x + adjustment.x,
					y: initialPos.y + adjustment.y
				};
			}
		});
	}

	private calculateMirrorAdjustment(arrow: ArrowInterface): { x: number; y: number } {
		// Adjust the coordinates to account for mirroring
		const { x, y } = arrow.coords;
		const { svgCenter } = arrow;

		// Flip horizontally around the SVG's center X-axis
		return {
			x: svgCenter.x * 2 - x,
			y // Y remains unchanged
		};
	}
}
