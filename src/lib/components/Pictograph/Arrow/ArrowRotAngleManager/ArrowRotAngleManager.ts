import { ANTI, DASH, FLOAT, PRO, STATIC } from '$lib/types/Constants';
import type { Motion } from '../../Motion/Motion';
import type { Loc as Loc } from '../../Prop/PropInterface';
import type { MotionType } from '../../types/Types';
import AntiRotAngleCalculator from './calculators/AntiRotAngleCalculator';
import DashRotAngleCalculator from './calculators/DashRotAngleCalculator';
import FloatRotAngleCalculator from './calculators/FloatRotAngleCalculator';
import ProRotAngleCalculator from './calculators/ProRotAngleCalculator';
import StaticRotAngleCalculator from './calculators/StaticRotAngleCalculator';

const calculatorMapping = {
	[STATIC]: StaticRotAngleCalculator,
	[PRO]: ProRotAngleCalculator,
	[ANTI]: AntiRotAngleCalculator,
	[DASH]: DashRotAngleCalculator,
	[FLOAT]: FloatRotAngleCalculator,
};

export default class ArrowRotAngleManager {
	private motion: Motion;
	private arrowLoc: Loc;

	constructor(motion: Motion, loc: Loc) {
		this.motion = motion;
		this.arrowLoc = loc;
	}

	private selectCalculator(motionType: MotionType) {
		const CalculatorClass = calculatorMapping[motionType];
		if (!CalculatorClass) {
			throw new Error(`Unsupported motion type: ${motionType}`);
		}
		return new CalculatorClass();
	}

	public updateRotation() {
		const calculator = this.selectCalculator(this.motion.motionType);
		// print the calculator chosen and the motion type
		console.log(calculator, this.motion.motionType);
		const rotation = calculator.calculate(this.arrowLoc, this.motion);
		return rotation;
	}
}
