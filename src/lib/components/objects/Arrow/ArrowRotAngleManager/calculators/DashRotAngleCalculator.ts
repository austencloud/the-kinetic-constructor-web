import type { ArrowData } from '../../ArrowData';
import type { Loc, PropRotDir } from '$lib/components/Pictograph/types/Types';
import {
	NORTH,
	EAST,
	SOUTH,
	WEST,
	NORTHEAST,
	SOUTHEAST,
	SOUTHWEST,
	NORTHWEST,
	CLOCKWISE,
	COUNTER_CLOCKWISE,
	NO_ROT,
	IN,
	OUT,
	CLOCK,
	COUNTER
} from '$lib/types/Constants';
import type { Motion } from '$lib/components/objects/Motion/Motion';

export default class DashRotAngleCalculator {
	private noRotationMap: Record<string, number> = {
		[`${NORTH}-${SOUTH}`]: 90,
		[`${EAST}-${WEST}`]: 180,
		[`${SOUTH}-${NORTH}`]: 270,
		[`${WEST}-${EAST}`]: 0,
		[`${SOUTHEAST}-${NORTHWEST}`]: 225,
		[`${SOUTHWEST}-${NORTHEAST}`]: 315,
		[`${NORTHWEST}-${SOUTHEAST}`]: 45,
		[`${NORTHEAST}-${SOUTHWEST}`]: 135
	};

	private dashOrientationRotationMap: Record<string, Record<string, Record<Loc, number>>> = {
		[IN]: {
			[CLOCKWISE]: {
				[NORTH]: 0,
				[EAST]: 90,
				[SOUTH]: 180,
				[WEST]: 270,
				[NORTHEAST]: 45,
				[SOUTHEAST]: 135,
				[SOUTHWEST]: 225,
				[NORTHWEST]: 315
			},
			[COUNTER_CLOCKWISE]: {
				[NORTH]: 0,
				[EAST]: 270,
				[SOUTH]: 180,
				[WEST]: 90,
				[NORTHEAST]: 315,
				[SOUTHEAST]: 225,
				[SOUTHWEST]: 135,
				[NORTHWEST]: 45
			}
		},
		[OUT]: {
			[CLOCKWISE]: {
				[NORTH]: 0,
				[EAST]: 90,
				[SOUTH]: 180,
				[WEST]: 270,
				[NORTHEAST]: 45,
				[SOUTHEAST]: 135,
				[SOUTHWEST]: 225,
				[NORTHWEST]: 315
			},
			[COUNTER_CLOCKWISE]: {
				[NORTH]: 0,
				[EAST]: 270,
				[SOUTH]: 180,
				[WEST]: 90,
				[NORTHEAST]: 315,
				[SOUTHEAST]: 225,
				[SOUTHWEST]: 135,
				[NORTHWEST]: 45
			}
		},
		[CLOCK]: {
			[CLOCKWISE]: {
				[NORTH]: 0,
				[EAST]: 90,
				[SOUTH]: 180,
				[WEST]: 270,
				[NORTHEAST]: 45,
				[SOUTHEAST]: 135,
				[SOUTHWEST]: 225,
				[NORTHWEST]: 315
			},
			[COUNTER_CLOCKWISE]: {
				[NORTH]: 0,
				[EAST]: 270,
				[SOUTH]: 180,
				[WEST]: 90,
				[NORTHEAST]: 315,
				[SOUTHEAST]: 225,
				[SOUTHWEST]: 135,
				[NORTHWEST]: 45
			}
		},
		[COUNTER]: {
			[CLOCKWISE]: {
				[NORTH]: 0,
				[EAST]: 90,
				[SOUTH]: 180,
				[WEST]: 270,
				[NORTHEAST]: 45,
				[SOUTHEAST]: 135,
				[SOUTHWEST]: 225,
				[NORTHWEST]: 315
			},
			[COUNTER_CLOCKWISE]: {
				[NORTH]: 0,
				[EAST]: 270,
				[SOUTH]: 180,
				[WEST]: 90,
				[NORTHEAST]: 315,
				[SOUTHEAST]: 225,
				[SOUTHWEST]: 135,
				[NORTHWEST]: 45
			}
		}
	};

	private cwDashAngleOverrideMap: Record<Loc, number> = {
		[NORTH]: 270,
		[EAST]: 0,
		[SOUTH]: 90,
		[WEST]: 180,
		[NORTHEAST]: 315,
		[SOUTHEAST]: 45,
		[SOUTHWEST]: 135,
		[NORTHWEST]: 225
	};

	private ccwDashAngleOverrideMap: Record<Loc, number> = {
		[NORTH]: 270,
		[EAST]: 180,
		[SOUTH]: 90,
		[WEST]: 0,
		[NORTHEAST]: 225,
		[SOUTHEAST]: 135,
		[SOUTHWEST]: 45,
		[NORTHWEST]: 315
	};

	private hasRotationAngleOverride(): boolean {
		// Implement the logic to determine if there is a rotation angle override
		return false;
	}

	private getRotAngleOverrideAccordingToLoc(loc: Loc, propRotDir: PropRotDir): number {
		if (propRotDir === CLOCKWISE) {
			return this.cwDashAngleOverrideMap[loc] ?? 0;
		} else if (propRotDir === COUNTER_CLOCKWISE) {
			return this.ccwDashAngleOverrideMap[loc] ?? 0;
		}
		return 0;
	}

	private handleNoRotation(startLoc: Loc, endLoc: Loc): number {
		return this.noRotationMap[`${startLoc}-${endLoc}`] ?? 0;
	}

	private handleOrientationBasedRotation(
		startOri: string,
		propRotDir: PropRotDir,
		loc: Loc
	): number {
		const orientationMap = this.dashOrientationRotationMap[startOri]?.[propRotDir];
		return orientationMap?.[loc] ?? 0;
	}

	public calculate(loc: Loc, motion: Motion): number {
		if (this.hasRotationAngleOverride()) {
			return this.getRotAngleOverrideAccordingToLoc(loc, motion.propRotDir);
		}

		if (motion.propRotDir === NO_ROT) {
			return this.handleNoRotation(motion.startLoc, motion.endLoc);
		}

		return this.handleOrientationBasedRotation(motion.startOri, motion.propRotDir, loc);
	}
}
