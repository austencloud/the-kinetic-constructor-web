import type { PropRotDir } from '$lib/components/Pictograph/types/Types';
import type { Loc } from '../../../Prop/PropInterface';
import type { ArrowInterface } from '../../ArrowInterface';
import {
	CLOCKWISE,
	COUNTER_CLOCKWISE,
	NORTH,
	EAST,
	SOUTH,
	WEST,
	NORTHEAST,
	SOUTHEAST,
	SOUTHWEST,
	NORTHWEST
} from '$lib/types/Constants';

export default class ProRotAngleCalculator {
	private directionMap: Partial<Record<PropRotDir, Partial<Record<Loc, number>>>> = {
		[CLOCKWISE]: {
			[NORTH]: 315,
			[EAST]: 45,
			[SOUTH]: 135,
			[WEST]: 225,
			[NORTHEAST]: 0,
			[SOUTHEAST]: 90,
			[SOUTHWEST]: 180,
			[NORTHWEST]: 270
		},
		[COUNTER_CLOCKWISE]: {
			[NORTH]: 315,
			[EAST]: 225,
			[SOUTH]: 135,
			[WEST]: 45,
			[NORTHEAST]: 270,
			[SOUTHEAST]: 180,
			[SOUTHWEST]: 90,
			[NORTHWEST]: 0
		}
	};

	public calculate(loc: Loc, propRotDir: PropRotDir): number {
		const directionMap = this.directionMap[propRotDir] || {};
		const angle = directionMap[loc as Loc] ?? 0;
		return angle;
	}
}
