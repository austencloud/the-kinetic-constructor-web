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

	updateLocation(location: Location | null = null) {
		const calculator = this._selectCalculator();

		if (location) {
			this.arrowData.coords = this._convertLocationToPosition(location);
		} else if (calculator) {
			const calculatedLocation = calculator.calculateLocation();
			this.arrowData.coords = this._convertLocationToPosition(calculatedLocation);
		}
		return this.arrowData.coords;
	}

	private fullPositionMap = {
		n: [50, 0],
		ne: [75, 25],
		e: [100, 50],
		se: [75, 75],
		s: [50, 100],
		sw: [25, 75],
		w: [0, 50],
		nw: [25, 25]
	};

	// ArrowLocationManager.ts
	private _convertLocationToPosition(location: keyof typeof this.fullPositionMap) {
		return { x: this.fullPositionMap[location][0], y: this.fullPositionMap[location][1] };
	}
}
