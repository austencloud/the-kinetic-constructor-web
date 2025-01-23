import type { Loc } from '$lib/components/Pictograph/Prop/PropInterface';
import type { PropRotDir } from '../../../Motion/MotionInterface';

export default class StaticRotAngleCalculator {
	public calculate(loc: Loc, propRotDir: PropRotDir): number {
		return 0; // Static: Always return 0 rotation
	}
}
