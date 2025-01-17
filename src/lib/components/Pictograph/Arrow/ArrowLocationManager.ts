import StaticLocationCalculator from './StaticLocationCalculator';
import ShiftLocationCalculator from './ShiftLocationCalculator';
import DashLocationCalculator from './DashLocationCalculator';

export default class ArrowLocationManager {
	arrowProps: {
		color: string;
		position: { x: number; y: number };
		rotation: number;
		mirrored: boolean;
		motion: { startLoc: string; endLoc: string; type: string; propRotDir?: string };
	};
	pictograph: any;

	constructor({ arrowProps, pictograph }: { arrowProps: any; pictograph: any }) {
		this.arrowProps = arrowProps;
		this.pictograph = pictograph;
	}

	_selectCalculator() {
		const motionType = this.arrowProps.motion.type.toLowerCase() as
			| 'pro'
			| 'anti'
			| 'dash'
			| 'static';
		const calculatorMap = {
			pro: ShiftLocationCalculator,
			anti: ShiftLocationCalculator,
			dash: DashLocationCalculator,
			static: StaticLocationCalculator
		};

		const CalculatorClass = calculatorMap[motionType];
		return CalculatorClass ? new (CalculatorClass as any)(this.arrowProps, this.pictograph) : null;
	}

	updateLocation(location: string | null = null) {
		const calculator = this._selectCalculator();

		if (location) {
			this.arrowProps.position = this._convertLocationToPosition(location);
		} else if (calculator) {
			const calculatedLocation = calculator.calculateLocation();
			this.arrowProps.position = this._convertLocationToPosition(calculatedLocation);
		}
		return this.arrowProps.position;
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
