import type { ArrowInterface } from '../../ArrowInterface';
import type { Loc } from '../../../Prop/PropInterface';
import {
	IN,
	OUT,
	CLOCK,
	COUNTER,
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
import type { Motion } from '$lib/components/Pictograph/Motion/Motion';
import type { PropRotDir } from '$lib/components/Pictograph/types/Types';

export default class AntiRotAngleCalculator {
	private directionMap: Partial<Record<PropRotDir, Partial<Record<Loc, number>>>> = {
		[CLOCKWISE]: {
			[NORTH]: 315,
			[EAST]: 225,
			[SOUTH]: 135,
			[WEST]: 45,
			[NORTHEAST]: 270,
			[SOUTHEAST]: 180,
			[SOUTHWEST]: 90,
			[NORTHWEST]: 0
		},
		[COUNTER_CLOCKWISE]: {
			[NORTH]: 315,
			[EAST]: 45,
			[SOUTH]: 135,
			[WEST]: 225,
			[NORTHEAST]: 0,
			[SOUTHEAST]: 90,
			[SOUTHWEST]: 180,
			[NORTHWEST]: 270
		}
	};

	private directionMapAlt: Partial<Record<PropRotDir, Partial<Record<Loc, number>>>> = {
		[CLOCKWISE]: {
			[NORTH]: 315,
			[EAST]: 225,
			[SOUTH]: 135,
			[WEST]: 45,
			[NORTHEAST]: 270,
			[SOUTHEAST]: 180,
			[SOUTHWEST]: 90,
			[NORTHWEST]: 360
		},
		[COUNTER_CLOCKWISE]: {
			[NORTH]: 315,
			[EAST]: 45,
			[SOUTH]: 135,
			[WEST]: 225,
			[NORTHEAST]: 360,
			[SOUTHEAST]: 90,
			[SOUTHWEST]: 180,
			[NORTHWEST]: 270
		}
	};

	public calculate(arrowLoc: Loc, motion: Motion): number {
		let directionMap: Partial<Record<Loc, number>>;

		if ([IN, OUT].includes(motion.startOri)) {
			directionMap = this.directionMap[motion.propRotDir] || {};
		} else if ([CLOCK, COUNTER].includes(motion.startOri)) {
			if (typeof motion.turns === 'number' && [0.5, 1.5, 2.5].includes(motion.turns)) {
				directionMap = this.directionMapAlt[motion.propRotDir] || {};
			} else {
				directionMap = this.directionMap[motion.propRotDir] || {};
			}
		} else {
			directionMap = this.directionMap[motion.propRotDir] || {};
		}

		return directionMap[arrowLoc] ?? 0;
	}
}
