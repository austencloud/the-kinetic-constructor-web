// ArrowAdjustmentCalculator.ts
import type { ArrowInterface } from '../ArrowInterface';
import { QuadrantIndexHandler } from './QuadrantIndexHandler';
import { DefaultArrowPositioner } from './DefaultArrowPositioner';

export class ArrowAdjustmentCalculator {
	private quadrantIndexHandler: QuadrantIndexHandler;
	private defaultPositioner: DefaultArrowPositioner;

	constructor(defaultPositioner: DefaultArrowPositioner) {
		this.quadrantIndexHandler = new QuadrantIndexHandler();
		this.defaultPositioner = defaultPositioner;
	}

	public getAdjustment(arrow: ArrowInterface): { x: number; y: number } {
		const [x, y] = this.defaultPositioner.getDefaultAdjustment(arrow);
		const quadrantIndex = this.quadrantIndexHandler.getQuadrantIndex(arrow);
		const directionalAdjustments = [
			{ x: x, y: y },
			{ x: y, y: -x },
			{ x: -x, y: -y },
			{ x: -y, y: x }
		];

		if (quadrantIndex < 0 || quadrantIndex >= directionalAdjustments.length) {
			console.error(`Quadrant index out of range: ${quadrantIndex}`);
			return { x: 0, y: 0 };
		}

		return directionalAdjustments[quadrantIndex];
	}
}
