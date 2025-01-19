import { writable } from 'svelte/store';
import { ArrowInitialPosCalculator } from './ArrowInitialPosCalculator';
import { ArrowAdjustmentCalculator } from './ArrowAdjustmentCalculator';
import { QuadrantIndexHandler } from './QuadrantIndexHandler';
import { DefaultArrowPositioner } from './DefaultArrowPositioner';
import { SpecialArrowPositioner } from './SpecialArrowPositioner';

export class ArrowPlacementManager {
	private pictograph: any; // Reference to the Pictograph instance
	private initialPosCalculator: ArrowInitialPosCalculator;
	private adjustmentCalculator: ArrowAdjustmentCalculator;
	private quadrantIndexHandler: QuadrantIndexHandler;
	private defaultPositioner: DefaultArrowPositioner;
	private specialPositioner: SpecialArrowPositioner;

	constructor(pictograph: any) {
		this.pictograph = pictograph;

		// Initialize submodules
		this.initialPosCalculator = new ArrowInitialPosCalculator(this);
		this.adjustmentCalculator = new ArrowAdjustmentCalculator(this);
		this.quadrantIndexHandler = new QuadrantIndexHandler(this);
		this.defaultPositioner = new DefaultArrowPositioner(this);
		this.specialPositioner = new SpecialArrowPositioner(this);
	}

	updateArrowPlacements(): void {
		Object.values(this.pictograph.arrows).forEach((arrow: any) => {
			this.updateArrowPosition(arrow);
		});
	}

	updateArrowPosition(arrow: any): void {
		const initialPos = this.initialPosCalculator.getInitialCoords(arrow);
		const adjustment = this.adjustmentCalculator.getAdjustment(arrow);
		const newPos = {
			x: initialPos.x + adjustment.x - arrow.boundingRect.width / 2,
			y: initialPos.y + adjustment.y - arrow.boundingRect.height / 2
		};
		arrow.setPosition(newPos.x, newPos.y);
	}
}
