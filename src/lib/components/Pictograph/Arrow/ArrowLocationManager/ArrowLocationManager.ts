// ArrowLocationManager.ts
import DashLocationCalculator from './DashLocationCalculator';
import ShiftLocationCalculator from './ShiftLocationCalculator';
import StaticLocationCalculator from './StaticLocationCalculator';
import type { Motion } from '../../Motion/Motion';
import type { MotionType } from '../../Motion/MotionInterface';
import type { PictographGetter } from '../../PictographGetter'; // <== import

export default class ArrowLocationManager {
  motion: Motion;
  getter: PictographGetter; // <== store it

  constructor(motion: Motion, getter: PictographGetter) {
    this.motion = motion;
    this.getter = getter;
  }

  private _selectCalculator() {
    const motionType = this.motion.motionType.toLowerCase() as MotionType;

    const calculatorMap: Record<MotionType, any> = {
      pro: ShiftLocationCalculator,
      anti: ShiftLocationCalculator,
      float: ShiftLocationCalculator,
      dash: DashLocationCalculator,
      static: StaticLocationCalculator
    };

    const CalculatorClass = calculatorMap[motionType];
    // Pass in BOTH `this.motion` and `this.getter`
    return CalculatorClass ? new CalculatorClass(this.motion, this.getter) : null;
  }

  getArrowLocation() {
    const calculator = this._selectCalculator();
    if (calculator) {
      return calculator.calculateLocation();
    }
    return null;
  }
}
