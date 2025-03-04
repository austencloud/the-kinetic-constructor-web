// ArrowAdjustmentCalculator.ts
import type { ArrowData } from '$lib/components/Pictograph/Arrow/ArrowData';
import type { DefaultArrowPositioner } from './DefaultArrowPositioner';
import { QuadrantIndexHandler } from './QuadrantIndexHandler';
import { DirectionalTupleManager } from './tupleGenerators/DirectionalTupleManager';

export class ArrowAdjustmentCalculator {
	private quadrantIndexHandler: QuadrantIndexHandler;

	constructor(
		private defaultPositioner: DefaultArrowPositioner,
		private pictographData: any,
		private gridData: any
	) {
		this.quadrantIndexHandler = new QuadrantIndexHandler(pictographData, gridData);
	}

	public getAdjustment(arrow: ArrowData): { x: number; y: number } {
		if (!this.pictographData.letter) {
			return { x: 0, y: 0 };
		}

		const [x, y] = this.defaultPositioner.getDefaultAdjustment(arrow);

		const dtManager = new DirectionalTupleManager(arrow.motion);
		const directionalAdjustments = dtManager.generateDirectionalTuples(x, y);

		if (!directionalAdjustments || directionalAdjustments.length === 0) {
			return { x, y };
		}
		const quadrantIndex = this.quadrantIndexHandler.getQuadrantIndex(arrow);
		if (quadrantIndex < 0 || quadrantIndex >= directionalAdjustments.length) {
			return { x: 0, y: 0 };
		}

		const [adjX, adjY] = directionalAdjustments[quadrantIndex];
		return { x: adjX, y: adjY };
	}
}
