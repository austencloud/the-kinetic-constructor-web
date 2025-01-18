import type { Motion } from './Motion';

export class MotionAttrManager {
	motion: any;

	constructor(motion: Motion) {
		this.motion = motion;
	}

	updateAttributes(attributes: Record<string, any>): void {
		Object.keys(attributes).forEach((key) => {
			this.motion[key] = attributes[key];
		});

		if (this.motion.prefloatMotionType === 'float') {
			throw new Error("`prefloatMotionType` cannot be 'float'");
		}
		if (this.motion.prefloatPropRotDir === 'no_rot') {
			throw new Error("`prefloatPropRotDir` cannot be 'no_rot'");
		}
	}

	getAttributes(): Record<string, any> {
		return {
			motionType: this.motion.motionType,
			startLoc: this.motion.startLoc,
			endLoc: this.motion.endLoc,
			propRotDir: this.motion.propRotDir,
			color: this.motion.color,
			turns: this.motion.turns
		};
	}
	assignLeadStates(): void {
		const leadingMotion = this.motion.pictograph.getLeadingMotion();
		const trailingMotion = this.motion.pictograph.getTrailingMotion();
		if (leadingMotion && trailingMotion) {
			leadingMotion.leadState = 'leading';
			trailingMotion.leadState = 'trailing';
		}
	}
}
