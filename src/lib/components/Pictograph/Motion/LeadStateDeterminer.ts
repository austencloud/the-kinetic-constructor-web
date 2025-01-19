import type { Motion } from './Motion';
import { HandpathCalculator } from './HandpathCalculator';
import type { Location } from './MotionInterface';

export class LeadStateDeterminer {
	private redMotion: Motion;
	private blueMotion: Motion;
	private handpathCalculator: HandpathCalculator;

	constructor(redMotion: Motion, blueMotion: Motion) {
		this.redMotion = redMotion;
		this.blueMotion = blueMotion;
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

	private determineMotionOrder(trailing: boolean): Motion {
		const redStart = this.redMotion.startLoc;
		const redEnd = this.redMotion.endLoc;
		const blueStart = this.blueMotion.startLoc;
		const blueEnd = this.blueMotion.endLoc;

		const redHandpath = this.handpathCalculator.getHandRotDir(redStart, redEnd);
		const blueHandpath = this.handpathCalculator.getHandRotDir(blueStart, blueEnd);

		if (redHandpath !== blueHandpath) {
			throw new Error(
				'Motions have different directions and cannot determine lead/trailing state.'
			);
		}

		if (redEnd === blueStart) {
			return trailing ? this.redMotion : this.blueMotion;
		}

		if (blueEnd === redStart) {
			return trailing ? this.blueMotion : this.redMotion;
		}

		if (redHandpath === 'cw_handpath') {
			return this.isClockwiseAhead(blueStart, redStart)
				? trailing
					? this.redMotion
					: this.blueMotion
				: trailing
					? this.blueMotion
					: this.redMotion;
		} else {
			return this.isCounterClockwiseAhead(blueStart, redStart)
				? trailing
					? this.redMotion
					: this.blueMotion
				: trailing
					? this.blueMotion
					: this.redMotion;
		}
	}

	getTrailingMotion(): Motion {
		return this.determineMotionOrder(true);
	}

	getLeadingMotion(): Motion {
		return this.determineMotionOrder(false);
	}
}
