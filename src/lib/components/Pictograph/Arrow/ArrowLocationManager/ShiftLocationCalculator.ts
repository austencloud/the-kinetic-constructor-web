import {
	EAST,
	NORTH,
	NORTHEAST,
	NORTHWEST,
	SOUTH,
	SOUTHEAST,
	SOUTHWEST,
	WEST
} from '$lib/types/Constants';
import type { Motion } from '../../Motion/Motion';
import type { Loc } from '../../../../types/Types';

export default class ShiftLocationCalculator {
	motion: Motion;

	constructor(motion: Motion) {
		this.motion = motion;
	}

	calculateLocation(): Loc | null {
		const startLoc = this.motion.startLoc;
		const endLoc = this.motion.endLoc;

		const directionPairs: Map<Set<string>, Loc> = new Map([
			[new Set([NORTH, EAST]), NORTHEAST],
			[new Set([EAST, SOUTH]), SOUTHEAST],
			[new Set([SOUTH, WEST]), SOUTHWEST],
			[new Set([WEST, NORTH]), NORTHWEST],
			[new Set([NORTHEAST, NORTHWEST]), NORTH],
			[new Set([NORTHEAST, SOUTHEAST]), EAST],
			[new Set([SOUTHWEST, SOUTHEAST]), SOUTH],
			[new Set([NORTHWEST, SOUTHWEST]), WEST]
		]);

		for (const [key, value] of directionPairs.entries()) {
			if (key.has(startLoc) && key.has(endLoc)) {
				return value;
			}
		}

		return null;
	}
}
