// BetaPropDirectionCalculator.ts

import { Letter } from '$lib/types/Letter';
import {
	NORTH, EAST, SOUTH, WEST, NORTHEAST, SOUTHEAST, SOUTHWEST, NORTHWEST,
	RED, BLUE, RADIAL, NONRADIAL, IN, OUT, CLOCK, COUNTER,
	LEFT, RIGHT, UP, DOWN, UPRIGHT, UPLEFT, DOWNRIGHT, DOWNLEFT,
	PRO, ANTI, FLOAT, DIAMOND, BOX
} from '$lib/types/Constants';
import type { BoxLoc, Color, DiamondLoc, Direction, Loc } from '$lib/types/Types';
import type { PictographData } from '$lib/types/PictographData';
import type { PropData } from '../PropData';

export class BetaPropDirectionCalculator {
	// Special case maps for Letter I
	private directionMapRadialI: Record<Loc, Record<Color, Direction>> = {
		[NORTH]: { [RED]: RIGHT, [BLUE]: LEFT },
		[EAST]: { [RED]: DOWN, [BLUE]: UP },
		[SOUTH]: { [RED]: LEFT, [BLUE]: RIGHT },
		[WEST]: { [RED]: DOWN, [BLUE]: UP },
		[NORTHEAST]: { [RED]: DOWNRIGHT, [BLUE]: UPLEFT },
		[SOUTHEAST]: { [RED]: UPRIGHT, [BLUE]: DOWNLEFT },
		[SOUTHWEST]: { [RED]: DOWNRIGHT, [BLUE]: UPLEFT },
		[NORTHWEST]: { [RED]: UPRIGHT, [BLUE]: DOWNLEFT }
	};

	private directionMapNonRadialI: Record<Loc, Record<Color, Direction>> = {
		[NORTH]: { [RED]: UP, [BLUE]: DOWN },
		[EAST]: { [RED]: RIGHT, [BLUE]: LEFT },
		[SOUTH]: { [RED]: DOWN, [BLUE]: UP },
		[WEST]: { [RED]: RIGHT, [BLUE]: LEFT },
		[NORTHEAST]: { [RED]: UPRIGHT, [BLUE]: DOWNLEFT },
		[SOUTHEAST]: { [RED]: DOWNRIGHT, [BLUE]: UPLEFT },
		[SOUTHWEST]: { [RED]: UPRIGHT, [BLUE]: DOWNLEFT },
		[NORTHWEST]: { [RED]: DOWNRIGHT, [BLUE]: UPLEFT }
	};

	// Shift direction maps
	private directionMapRadialShift: Record<Loc, Partial<Record<Loc, Direction>>> = {
		[EAST]: { [NORTH]: RIGHT, [SOUTH]: RIGHT },
		[WEST]: { [NORTH]: LEFT, [SOUTH]: LEFT },
		[NORTH]: { [EAST]: UP, [WEST]: UP },
		[SOUTH]: { [EAST]: DOWN, [WEST]: DOWN },
		[NORTHEAST]: { [NORTHWEST]: UPRIGHT, [SOUTHEAST]: UPRIGHT },
		[SOUTHEAST]: { [NORTHEAST]: DOWNRIGHT, [SOUTHWEST]: DOWNRIGHT },
		[SOUTHWEST]: { [NORTHWEST]: DOWNLEFT, [SOUTHEAST]: DOWNLEFT },
		[NORTHWEST]: { [NORTHEAST]: UPLEFT, [SOUTHWEST]: UPLEFT }
	};

	private directionMapNonRadialShift: Record<Loc, Partial<Record<Loc, Direction>>> = {
		[EAST]: { [NORTH]: UP, [SOUTH]: UP },
		[WEST]: { [NORTH]: DOWN, [SOUTH]: DOWN },
		[NORTH]: { [EAST]: RIGHT, [WEST]: RIGHT },
		[SOUTH]: { [EAST]: LEFT, [WEST]: LEFT },
		[NORTHEAST]: { [SOUTHEAST]: UPLEFT, [NORTHWEST]: DOWNRIGHT },
		[SOUTHEAST]: { [NORTHEAST]: UPRIGHT, [SOUTHWEST]: DOWNLEFT },
		[SOUTHWEST]: { [NORTHWEST]: UPRIGHT, [SOUTHEAST]: DOWNRIGHT },
		[NORTHWEST]: { [SOUTHWEST]: UPLEFT, [NORTHEAST]: DOWNLEFT }
	};

	// Static/dash maps
	private diamondMapRadial: Record<DiamondLoc, Record<Color, Direction>> = {
		[NORTH]: { [RED]: RIGHT, [BLUE]: LEFT },
		[EAST]: { [RED]: DOWN, [BLUE]: UP },
		[SOUTH]: { [RED]: RIGHT, [BLUE]: LEFT },
		[WEST]: { [RED]: DOWN, [BLUE]: UP }
	};

	private diamondMapNonRadial: Record<DiamondLoc, Record<Color, Direction>> = {
		[NORTH]: { [RED]: UP, [BLUE]: DOWN },
		[EAST]: { [RED]: RIGHT, [BLUE]: LEFT },
		[SOUTH]: { [RED]: DOWN, [BLUE]: UP },
		[WEST]: { [RED]: RIGHT, [BLUE]: LEFT }
	};

	private boxMapRadial: Record<BoxLoc, Record<Color, Direction>> = {
		[NORTHEAST]: { [RED]: DOWNRIGHT, [BLUE]: UPLEFT },
		[SOUTHEAST]: { [RED]: UPRIGHT, [BLUE]: DOWNLEFT },
		[SOUTHWEST]: { [RED]: DOWNRIGHT, [BLUE]: UPLEFT },
		[NORTHWEST]: { [RED]: UPRIGHT, [BLUE]: DOWNLEFT }
	};

	private boxMapNonRadial: Record<BoxLoc, Record<Color, Direction>> = {
		[NORTHEAST]: { [RED]: UPRIGHT, [BLUE]: DOWNLEFT },
		[SOUTHEAST]: { [RED]: DOWNRIGHT, [BLUE]: UPLEFT },
		[SOUTHWEST]: { [RED]: UPRIGHT, [BLUE]: DOWNLEFT },
		[NORTHWEST]: { [RED]: DOWNRIGHT, [BLUE]: UPLEFT }
	};

	constructor(private pictographData: PictographData) {}

	getDirection(prop: PropData): Direction | undefined {
		if ([PRO, ANTI, FLOAT].includes(prop.motion.motionType)) {
			return this.handleShiftMotion(prop);
		}
		return this.handleStaticDashMotion(prop);
	}

	endsWithRadialOrientation(): boolean {
		return (
			((this.pictographData.redMotionData?.endOri === IN ||
				this.pictographData.redMotionData?.endOri === OUT) &&
				this.pictographData.blueMotionData?.endOri === IN) ||
			this.pictographData.blueMotionData?.endOri === OUT
		);
	}

	endsWithNonRadialOrientation(): boolean {
		return (
			((this.pictographData.redMotionData?.endOri === CLOCK ||
				this.pictographData.redMotionData?.endOri === COUNTER) &&
				this.pictographData.blueMotionData?.endOri === CLOCK) ||
			this.pictographData.blueMotionData?.endOri === COUNTER
		);
	}

	private handleShiftMotion(prop: PropData): Direction | undefined {
		if (this.pictographData.letter === Letter.I) {
			if (this.endsWithRadialOrientation()) {
				return this.directionMapRadialI[prop.motion.endLoc][prop.color];
			}
			if (this.endsWithNonRadialOrientation()) {
				return this.directionMapNonRadialI[prop.motion.endLoc][prop.color];
			}
		}

		const isRadial = prop.radialMode === RADIAL;
		return this.getShiftDirection(isRadial, prop.motion.startLoc, prop.motion.endLoc);
	}

	private getShiftDirection(isRadial: boolean, startLoc: Loc, endLoc: Loc): Direction | undefined {
		const map = isRadial ? this.directionMapRadialShift : this.directionMapNonRadialShift;
		return map[startLoc]?.[endLoc];
	}

	private handleStaticDashMotion(prop: PropData): Direction {
		const gridMode = [NORTH, SOUTH, EAST, WEST].includes(prop.loc) ? DIAMOND : BOX;
		const isRadial = prop.radialMode === RADIAL;

		if (gridMode === DIAMOND) {
			const map = isRadial ? this.diamondMapRadial : this.diamondMapNonRadial;
			return map[prop.loc as DiamondLoc][prop.color];
		}

		const map = isRadial ? this.boxMapRadial : this.boxMapNonRadial;
		return map[prop.loc as BoxLoc][prop.color];
	}

	getOppositeDirection(direction: Direction): Direction {
		const opposites: Record<Direction, Direction> = {
			[UP]: DOWN,
			[DOWN]: UP,
			[LEFT]: RIGHT,
			[RIGHT]: LEFT,
			[UPRIGHT]: DOWNLEFT,
			[DOWNLEFT]: UPRIGHT,
			[UPLEFT]: DOWNRIGHT,
			[DOWNRIGHT]: UPLEFT
		};
		return opposites[direction];
	}
}
