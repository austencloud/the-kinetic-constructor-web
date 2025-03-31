import { CLOCK, COUNTER, IN, OUT } from '$lib/types/Constants';
import type { PictographData } from '$lib/types/PictographData';
import { LetterUtils } from '$lib/utils/LetterUtils';
import { LetterConditions } from './LetterConditions';

export class PictographChecker {
	constructor(private pictographData: PictographData) {}

	private get orientationChecks() {
		return {
			isRadial: (ori?: string) => [IN, OUT].includes(ori ?? ''),
			isRotational: (ori?: string) => [CLOCK, COUNTER].includes(ori ?? '')
		};
	}

	private getMotionEndOrientation(motionKey: 'redMotionData' | 'blueMotionData') {
		// Replace _.get with optional chaining
		return this.pictographData[motionKey]?.endOri;
	}

	checkLetterCondition(condition: LetterConditions): boolean {
		return this.pictographData.letter
			? LetterUtils.getLettersByCondition(condition).includes(this.pictographData.letter)
			: false;
	}

	endsWithAlpha = () => this.checkLetterCondition(LetterConditions.ALPHA_ENDING);
	endsWithBeta = () => this.checkLetterCondition(LetterConditions.BETA_ENDING);
	endsWithGamma = () => this.checkLetterCondition(LetterConditions.GAMMA_ENDING);

	endsWithLayer3(): boolean {
		const redEndOri = this.getMotionEndOrientation('redMotionData');
		const blueEndOri = this.getMotionEndOrientation('blueMotionData');

		const checks = this.orientationChecks;

		return (
			(checks.isRadial(redEndOri) && checks.isRotational(blueEndOri)) ||
			(checks.isRotational(redEndOri) && checks.isRadial(blueEndOri))
		);
	}

	endsWithRadialOri(): boolean {
		const redEndOri = this.getMotionEndOrientation('redMotionData');
		const blueEndOri = this.getMotionEndOrientation('blueMotionData');

		return (
			this.orientationChecks.isRadial(redEndOri) && this.orientationChecks.isRadial(blueEndOri)
		);
	}

	endsWithNonRadialOri(): boolean {
		const redEndOri = this.getMotionEndOrientation('redMotionData');
		const blueEndOri = this.getMotionEndOrientation('blueMotionData');

		return (
			this.orientationChecks.isRotational(redEndOri) &&
			this.orientationChecks.isRotational(blueEndOri)
		);
	}
}
