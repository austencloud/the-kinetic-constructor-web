import StaticLocationCalculator from './ArrowLocationManager/StaticLocationCalculator';
import ShiftLocationCalculator from './ArrowLocationManager/ShiftLocationCalculator';
import DashLocationCalculator from './ArrowLocationManager/DashLocationCalculator';
import type { Motion } from '../Motion/Motion';
import Arrow from '../Arrow/Arrow.svelte';
import type { ArrowInterface } from './ArrowInterface';
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

	updateLocation(location: string | null = null) {
		const calculator = this._selectCalculator();

		if (location) {
			this.arrowData.position = this._convertLocationToPosition(location);
		} else if (calculator) {
			const calculatedLocation = calculator.calculateLocation();
			this.arrowData.position = this._convertLocationToPosition(calculatedLocation);
		}
		return this.arrowData.position;
	}

	private _convertLocationToPosition(location: string): { x: number; y: number } {
		type LocationKey = 'n' | 'e' | 's' | 'w';
		const positionMap: Record<LocationKey, { x: number; y: number }> = {
			n: { x: 50, y: 0 },
			e: { x: 100, y: 50 },
			s: { x: 50, y: 100 },
			w: { x: 0, y: 50 }
		};
		return positionMap[location as LocationKey] || { x: 0, y: 0 };
	}
}
