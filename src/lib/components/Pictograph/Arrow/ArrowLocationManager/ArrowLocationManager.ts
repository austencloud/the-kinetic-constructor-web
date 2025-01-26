// ArrowLocationManager.ts
import DashLocationCalculator from './DashLocationCalculator';
import ShiftLocationCalculator from './ShiftLocationCalculator';
import StaticLocationCalculator from './StaticLocationCalculator';
import type { Motion } from '../../Motion/Motion';
import type { PictographGetter } from '../../PictographGetter'; // <== import
import type { MotionType } from '../../types/Types';
import { ANTI, DASH, FLOAT, PRO, STATIC } from '$lib/types/Constants';
import type { PictographInterface } from '$lib/types/PictographInterface';

export default class ArrowLocationManager {
	pictographData: PictographInterface;
	motion: Motion;
	getter: PictographGetter;

	constructor(pictographData: PictographInterface, motion: Motion, getter: PictographGetter) {
		this.motion = motion;
		this.getter = getter;
		this.pictographData = pictographData;
		// log the pictograph data
		console.log('Pictograph Data: ', this.pictographData);
	}

	private _selectCalculator() {
		const motionType = this.motion.motionType.toLowerCase() as MotionType;

		const calculatorMap: Record<MotionType, any> = {
			[PRO]: ShiftLocationCalculator,
			[ANTI]: ShiftLocationCalculator,
			[FLOAT]: ShiftLocationCalculator,
			[DASH]: DashLocationCalculator,
			[STATIC]: StaticLocationCalculator
		};
		const CalculatorClass = calculatorMap[motionType];

		try {
			return new CalculatorClass(this.motion, this.getter);
		} catch (error) {
			console.error('Calculator initialization failed:', error);
			return null;
		}
	}

	getArrowLocation(motion: Motion) {
		const calculator = this._selectCalculator();
		return calculator?.calculateLocation?.() || null;
	}
}
