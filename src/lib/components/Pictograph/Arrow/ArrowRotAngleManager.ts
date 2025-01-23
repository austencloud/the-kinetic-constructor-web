import type { MotionType } from '../Motion/MotionInterface';
import AntiRotAngleCalculator from './AntiRotAngleCalculator';
import type { ArrowInterface } from './ArrowInterface';
import DashRotAngleCalculator from './FloatRotAngleCalculator';
import FloatRotAngleCalculator from './FloatRotAngleCalculator';
import ProRotAngleCalculator from './ProRotAngleCalculator';
import StaticRotAngleCalculator from './StaticRotAngleCalculator';


export default class ArrowRotAngleManager {
	private arrowData: ArrowInterface;

	constructor(arrowData: ArrowInterface) {
		this.arrowData = arrowData;
	}

	private selectCalculator(motionType: MotionType) {
		switch (motionType) {
			case 'static':
				return new StaticRotAngleCalculator();
			case 'pro':
				return new ProRotAngleCalculator();
			case 'anti':
				return new AntiRotAngleCalculator();
			case 'dash':
				return new DashRotAngleCalculator();
			case 'float':
				return new FloatRotAngleCalculator();
			default:
				throw new Error(`Unsupported motion type: ${motionType}`);
		}
	}

	public updateRotation(): number {
		const calculator = this.selectCalculator(this.arrowData.motion.motionType);
        const rotation = calculator.calculate(this.arrowData);
        return rotation;
	}
}
