import { ANTI, DASH, FLOAT, PRO, STATIC } from '$lib/types/Constants';
import type { Motion } from '../../Motion/Motion';
import type { MotionType, PropRotDir } from '../../Motion/MotionInterface';
import type { Loc as Loc } from '../../Prop/PropInterface';
import AntiRotAngleCalculator from './calculators/AntiRotAngleCalculator';
import DashRotAngleCalculator from './calculators/FloatRotAngleCalculator';
import FloatRotAngleCalculator from './calculators/FloatRotAngleCalculator';
import ProRotAngleCalculator from './calculators/ProRotAngleCalculator';
import StaticRotAngleCalculator from './calculators/StaticRotAngleCalculator';

export default class ArrowRotAngleManager {
	private motion: Motion;
	private loc: Loc;

	constructor(motion: Motion, loc: Loc) {
		this.motion = motion;
		this.loc = loc;
	}

	private selectCalculator(motionType: MotionType) {
		switch (motionType) {
			case STATIC:
				return new StaticRotAngleCalculator();
			case PRO:
				return new ProRotAngleCalculator();
			case ANTI:
				return new AntiRotAngleCalculator();
			case DASH:
				return new DashRotAngleCalculator();
			case FLOAT:
				return new FloatRotAngleCalculator();
			default:
				throw new Error(`Unsupported motion type: ${motionType}`);
		}
	}

	public updateRotation(): number {
		const calculator = this.selectCalculator(this.motion.motionType);
		const rotation = calculator.calculate(this.loc, this.motion.propRotDir);
		return rotation;
	}
}
