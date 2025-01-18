import type { MotionInterface } from './MotionTypes';
import type { Motion } from './Motion';

export class MotionUpdater {
	motion: Motion;

	constructor(motion: Motion) {
		this.motion = motion;
	}

	updateMotion(motionData: Partial<MotionInterface>): void {
		if (motionData) {
			this.motion.attrManager.updateAttributes(motionData);
		}
		this.motion.endOri = this.motion.oriCalculator.calculateEndOri();

		if (!this.motion.prop) {
			throw new Error('`prop` is undefined during update.');
		}

		this.motion.prop.loc = this.motion.endLoc;
		this.motion.prop.ori = this.motion.endOri;
	}
}
