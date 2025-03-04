// PictographChecker.ts
import { CLOCK, COUNTER, IN, OUT } from '$lib/types/Constants';
import type { PictographData } from '$lib/types/PictographData';
import { LetterConditions } from './LetterConditions';
import { LetterUtils } from '../../utils/LetterUtils';

export class PictographChecker {
	constructor(private pictographData: PictographData) {}

	endsWithBeta(): boolean {
		return this.pictographData.letter
			? LetterUtils.getLettersByCondition(LetterConditions.BETA_ENDING).includes(
					this.pictographData.letter
				)
			: false;
	}
	endsWithAlpha(): boolean {
		return this.pictographData.letter
			? LetterUtils.getLettersByCondition(LetterConditions.ALPHA_ENDING).includes(
					this.pictographData.letter
				)
			: false;
	}
	endsWithGamma(): boolean {
		return this.pictographData.letter
			? LetterUtils.getLettersByCondition(LetterConditions.GAMMA_ENDING).includes(
					this.pictographData.letter
				)
			: false;
	}
	endsWithLayer3(): boolean {
		return (
			((this.pictographData.redMotionData?.endOri === IN ||
				this.pictographData.redMotionData?.endOri === OUT) &&
				(this.pictographData.blueMotionData?.endOri === CLOCK ||
					this.pictographData.blueMotionData?.endOri === COUNTER)) ||
			((this.pictographData.redMotionData?.endOri === CLOCK ||
				this.pictographData.redMotionData?.endOri === COUNTER) &&
				(this.pictographData.blueMotionData?.endOri === IN ||
					this.pictographData.blueMotionData?.endOri === OUT))
		);
	}
	endsWithRadialOri(): boolean {
		return (
			((this.pictographData.redMotionData?.endOri === IN ||
				this.pictographData.redMotionData?.endOri === OUT) &&
				this.pictographData.blueMotionData?.endOri === IN) ||
			this.pictographData.blueMotionData?.endOri === OUT
		);
	}
	endsWithNonRadialOri(): boolean {
		return (
			((this.pictographData.redMotionData?.endOri === CLOCK ||
				this.pictographData.redMotionData?.endOri === COUNTER) &&
				this.pictographData.blueMotionData?.endOri === CLOCK) ||
			this.pictographData.blueMotionData?.endOri === COUNTER
		);
	}
}
