import type { MotionInterface } from './MotionInterface';
import { HandpathCalculator } from './HandpathCalculator';
import type { Location } from './MotionInterface';

export class LeadStateDeterminer {
	private redMotionData: MotionInterface;
	private blueMotionData: MotionInterface;
	private handpathCalculator: HandpathCalculator;

	constructor(redMotionData: MotionInterface, blueMotionData: MotionInterface) {
		this.redMotionData = redMotionData;
		this.blueMotionData = blueMotionData;
		this.handpathCalculator = new HandpathCalculator();
	}

	private static CLOCKWISE_ORDER: Location[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

	private isClockwiseAhead(startA: Location, startB: Location): boolean {
		const idxA = LeadStateDeterminer.CLOCKWISE_ORDER.indexOf(startA);
		const idxB = LeadStateDeterminer.CLOCKWISE_ORDER.indexOf(startB);
		return (
			(idxA - idxB + LeadStateDeterminer.CLOCKWISE_ORDER.length) %
				LeadStateDeterminer.CLOCKWISE_ORDER.length >
			0
		);
	}

	private isCounterClockwiseAhead(startA: Location, startB: Location): boolean {
		const idxA = LeadStateDeterminer.CLOCKWISE_ORDER.indexOf(startA);
		const idxB = LeadStateDeterminer.CLOCKWISE_ORDER.indexOf(startB);
		return (
			(idxB - idxA + LeadStateDeterminer.CLOCKWISE_ORDER.length) %
				LeadStateDeterminer.CLOCKWISE_ORDER.length >
			0
		);
	}

	private determineMotionOrder(trailing: boolean): MotionInterface {
		const redStart = this.redMotionData.startLoc;
		const redEnd = this.redMotionData.endLoc;
		const blueStart = this.blueMotionData.startLoc;
		const blueEnd = this.blueMotionData.endLoc;

		const redHandpath = this.handpathCalculator.getHandRotDir(redStart, redEnd);
		const blueHandpath = this.handpathCalculator.getHandRotDir(blueStart, blueEnd);

		if (redHandpath !== blueHandpath) {
			throw new Error(
				'Motions have different directions and cannot determine lead/trailing state.'
			);
		}

		if (redEnd === blueStart) {
			return trailing ? this.redMotionData : this.blueMotionData;
		}

		if (blueEnd === redStart) {
			return trailing ? this.blueMotionData : this.redMotionData;
		}

		if (redHandpath === 'cw_handpath') {
			return this.isClockwiseAhead(blueStart, redStart)
				? trailing
					? this.redMotionData
					: this.blueMotionData
				: trailing
					? this.blueMotionData
					: this.redMotionData;
		} else {
			return this.isCounterClockwiseAhead(blueStart, redStart)
				? trailing
					? this.redMotionData
					: this.blueMotionData
				: trailing
					? this.blueMotionData
					: this.redMotionData;
		}
	}

	getTrailingMotion(): MotionInterface {
		return this.determineMotionOrder(true);
	}

	getLeadingMotion(): MotionInterface {
		return this.determineMotionOrder(false);
	}
}
