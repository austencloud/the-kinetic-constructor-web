import { CLOCK, COUNTER, IN, OUT } from '$lib/types/Constants';
import type { PictographData } from '$lib/types/PictographData';
import { LetterConditions } from './LetterConditions';
import { LetterUtils } from '../../utils/LetterUtils';

export class PictographChecker {
	constructor(private pictographData: PictographData) {}

	endsWithAlpha(): boolean {
		return this.checkLetterCondition(LetterConditions.ALPHA_ENDING);
	}

	endsWithBeta(): boolean {
		return this.checkLetterCondition(LetterConditions.BETA_ENDING);
	}

	endsWithGamma(): boolean {
		return this.checkLetterCondition(LetterConditions.GAMMA_ENDING);
	}

	private checkLetterCondition(condition: LetterConditions): boolean {
		return this.pictographData.letter
			? LetterUtils.getLettersByCondition(condition).includes(this.pictographData.letter)
			: false;
	}

	endsWithLayer3(): boolean {
		const redEndOri = this.pictographData.redMotionData?.endOri;
		const blueEndOri = this.pictographData.blueMotionData?.endOri;

		const redIsRadial = redEndOri === IN || redEndOri === OUT;
		const redIsRotational = redEndOri === CLOCK || redEndOri === COUNTER;
		const blueIsRadial = blueEndOri === IN || blueEndOri === OUT;
		const blueIsRotational = blueEndOri === CLOCK || blueEndOri === COUNTER;

		return (redIsRadial && blueIsRotational) || (redIsRotational && blueIsRadial);
	}

	endsWithRadialOri(): boolean {
		const redEndOri = this.pictographData.redMotionData?.endOri;
		const blueEndOri = this.pictographData.blueMotionData?.endOri;

		return (redEndOri === IN || redEndOri === OUT) && (blueEndOri === IN || blueEndOri === OUT);
	}

	endsWithNonRadialOri(): boolean {
		const redEndOri = this.pictographData.redMotionData?.endOri;
		const blueEndOri = this.pictographData.blueMotionData?.endOri;

		return (
			(redEndOri === CLOCK || redEndOri === COUNTER) &&
			(blueEndOri === CLOCK || blueEndOri === COUNTER)
		);
	}
}
