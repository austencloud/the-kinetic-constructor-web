import StaticLocationCalculator from './ArrowLocationManager/StaticLocationCalculator';
import ShiftLocationCalculator from './ArrowLocationManager/ShiftLocationCalculator';
import DashLocationCalculator from './ArrowLocationManager/DashLocationCalculator';
import type { Motion } from '../Motion/Motion';
import Arrow from '../Arrow/Arrow.svelte';
import type { ArrowInterface } from './ArrowInterface';
import type { Location } from '../Prop/PropInterface';
export default class ArrowLocationManager {
	arrowData: ArrowInterface;
	motion: Motion;

	constructor({ arrowData: arrowData }: { arrowData: ArrowInterface }) {
		this.arrowData = arrowData;
		this.motion = arrowData.motion;
	}

	_selectCalculator() {
		const motionType = this.motion.motionType.toLowerCase() as 'pro' | 'anti' | 'dash' | 'static';
		const calculatorMap = {
			pro: ShiftLocationCalculator,
			anti: ShiftLocationCalculator,
			dash: DashLocationCalculator,
			static: StaticLocationCalculator
		};

		const CalculatorClass = calculatorMap[motionType];
		return CalculatorClass ? new (CalculatorClass as any)(this.arrowData) : null;
	}

	getArrowLocation(location: Location | null) {
		const calculator = this._selectCalculator();

		if (calculator) {
			return calculator.calculateLocation(location);
		}
	}
}
