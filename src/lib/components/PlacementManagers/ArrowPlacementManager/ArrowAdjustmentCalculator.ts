// ArrowAdjustmentCalculator.ts
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
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
		console.log('pictographData:', this.pictographData);
		const [x, y] = this.defaultPositioner.getDefaultAdjustment(arrow);
		let directionalAdjustments: string | any[] = [];

		// get the motion by looking at the pictographData to find either redMotionData from it or blueMotionData
		const color = arrow.color;
		if (color === 'red') {
			let motion = this.pictographData.redMotionData;
			console.log('motion:', motion);
			const dtManager = new DirectionalTupleManager(motion);
			const directionalAdjustments = dtManager.generateDirectionalTuples(x, y);
		} else if (color === 'blue') {
			let motion = this.pictographData.blueMotionData;
			console.log('motion:', motion);
			const dtManager = new DirectionalTupleManager(motion);
			const directionalAdjustments = dtManager.generateDirectionalTuples(x, y);
		}
		console.log('directionalAdjustments:', directionalAdjustments);
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
