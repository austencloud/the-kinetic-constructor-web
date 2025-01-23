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
import type { Loc } from '../../Prop/PropInterface';

export default class ShiftLocationCalculator {
	motion: Motion;

	constructor(motion: Motion) {
		this.motion = motion;
	}

	calculateLocation(): Loc {
		const startLoc = this.motion.startLoc;
		const endLoc = this.motion.endLoc;

		const locationMap: { [key: string]: Loc } = {
			'n-e': NORTHEAST,
			'e-s': SOUTHEAST,
			's-w': SOUTHWEST,
			'w-n': NORTHWEST,
			'ne-nw': NORTH,
			'ne-se': EAST,
			'sw-se': SOUTH,
			'nw-sw': WEST
		};

		const key = `${startLoc}-${endLoc}`;
		const location = locationMap[key] || null;

		return location;
	}
}
