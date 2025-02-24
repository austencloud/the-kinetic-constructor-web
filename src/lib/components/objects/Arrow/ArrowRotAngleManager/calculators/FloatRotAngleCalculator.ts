import type { Loc, PropRotDir } from '$lib/components/Pictograph/types/Types';
import type { ArrowData } from '../../ArrowData';
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
import type { Motion } from '$lib/components/objects/Motion/Motion';

export default class FloatRotAngleCalculator {
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
			[NORTH]: 135,
			[EAST]: 225,
			[SOUTH]: 315,
			[WEST]: 45,
			[NORTHEAST]: 180,
			[SOUTHEAST]: 270,
			[SOUTHWEST]: 0,
			[NORTHWEST]: 90
		}
	};

	public calculate(loc: Loc, motion: Motion): number {
		const directionMap = this.directionMap[motion.propRotDir] || {};
		const angle = directionMap[loc as Loc] ?? 0;
		return angle;
	}
}
