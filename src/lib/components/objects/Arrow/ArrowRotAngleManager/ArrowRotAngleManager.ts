import { ANTI, DASH, FLOAT, PRO, STATIC } from '$lib/types/Constants';
import type { Motion } from '../../../objects/Motion/Motion';
import type { Loc, MotionType } from '../../../../types/Types';
import AntiRotAngleCalculator from './calculators/AntiRotAngleCalculator';
import DashRotAngleCalculator from './calculators/DashRotAngleCalculator';
import FloatRotAngleCalculator from './calculators/FloatRotAngleCalculator';
import ProRotAngleCalculator from './calculators/ProRotAngleCalculator';
import StaticRotAngleCalculator from './calculators/StaticRotAngleCalculator';

const calculatorMapping = {
	[PRO]: ProRotAngleCalculator,
	[ANTI]: AntiRotAngleCalculator,
	[FLOAT]: FloatRotAngleCalculator,
	[DASH]: DashRotAngleCalculator,
	[STATIC]: StaticRotAngleCalculator
};

export default class ArrowRotAngleManager {
	private selectCalculator(motionType: MotionType) {
		const CalculatorClass = calculatorMapping[motionType];
		if (!CalculatorClass) {
			throw new Error(`Unsupported motion type: ${motionType}`);
		}
		return new CalculatorClass();
	}

	public updateRotation(motion: Motion, arrowLoc: Loc) {
		const calculator = this.selectCalculator(motion.motionType);
		const rotation = calculator.calculate(arrowLoc, motion);
		return rotation;
	}
}
