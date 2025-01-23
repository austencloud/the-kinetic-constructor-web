import type { PropRotDir } from '../../../Motion/MotionInterface';
import type { Loc } from '../../../Prop/PropInterface';
import type { ArrowInterface } from '../../ArrowInterface';

export default class ProRotAngleCalculator {
	private directionMapCW: Record<Loc, number> = {
		n: 315,
		e: 45,
		s: 135,
		w: 225,
		ne: 0,
		se: 90,
		sw: 180,
		nw: 270
	};

	private directionMapCCW: Record<Loc, number> = {
		n: 315,
		e: 225,
		s: 135,
		w: 45,
		ne: 270,
		se: 180,
		sw: 90,
		nw: 0
	};

	public calculate(loc: Loc, propRotDir: PropRotDir): number {
		const directionMap = propRotDir === 'cw' ? this.directionMapCW : this.directionMapCCW;
		const angle = directionMap[loc as Loc] ?? 0;
		return angle;
	}
}
