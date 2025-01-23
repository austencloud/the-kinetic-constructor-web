// PictographChecker.ts
import { LetterConditions, LetterUtils } from '$lib/types/Letter';
import type { PictographInterface } from '$lib/types/PictographInterface';

export class PictographChecker {
	constructor(private pictographData: PictographInterface) {}

	endsWithBeta(): boolean {
		return this.pictographData.letter
			? LetterUtils.getLettersByCondition(LetterConditions.BETA_ENDING).includes(
					this.pictographData.letter
				)
			: false;
	}
	endsWithRadialOrientation(): boolean {
		return (
			((this.pictographData.redMotionData?.endOri === 'in' ||
				this.pictographData.redMotionData?.endOri === 'out') &&
				this.pictographData.blueMotionData?.endOri === 'in') ||
			this.pictographData.blueMotionData?.endOri === 'out'
		);
	}
	endsWithNonRadialOrientation(): boolean {
		return (
			((this.pictographData.redMotionData?.endOri === 'clock' ||
				this.pictographData.redMotionData?.endOri === 'counter') &&
				this.pictographData.blueMotionData?.endOri === 'clock') ||
			this.pictographData.blueMotionData?.endOri === 'counter'
		);
	}
}
