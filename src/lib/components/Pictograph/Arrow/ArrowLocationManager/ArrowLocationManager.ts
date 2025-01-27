// ArrowLocationManager.ts
import DashLocationCalculator from './DashLocationCalculator';
import ShiftLocationCalculator from './ShiftLocationCalculator';
import StaticLocationCalculator from './StaticLocationCalculator';
import { Motion } from '../../Motion/Motion';
import type { PictographGetter } from '../../PictographGetter'; // <== import
import type { MotionType } from '../../types/Types';
import { ANTI, DASH, FLOAT, PRO, STATIC } from '$lib/types/Constants';
import type { PictographInterface } from '$lib/types/PictographInterface';

export default class ArrowLocationManager {
	pictographData: PictographInterface;
	getter: PictographGetter;

	constructor(pictographData: PictographInterface, getter: PictographGetter) {
		this.getter = getter;
		this.pictographData = pictographData;
		// log the pictograph data
	}

	private _selectCalculator(
		motion: Motion
	) {
		const motionType = motion.motionType.toLowerCase() as MotionType;

		const calculatorMap: Record<MotionType, any> = {
			[PRO]: ShiftLocationCalculator,
			[ANTI]: ShiftLocationCalculator,
			[FLOAT]: ShiftLocationCalculator,
			[DASH]: DashLocationCalculator,
			[STATIC]: StaticLocationCalculator
		};
		const CalculatorClass = calculatorMap[motionType];

		try {
			return new CalculatorClass(motion, this.getter);
		} catch (error) {
			console.error('Calculator initialization failed:', error);
			return null;
		}
	}

	getArrowLocation(motion: Motion) {
		const calculator = this._selectCalculator(motion);
		return calculator?.calculateLocation?.() || null;
	}
}
