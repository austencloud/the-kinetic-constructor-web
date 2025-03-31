// src/lib/components/objects/Arrow/ArrowRotAngleManager.ts
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
	COUNTER,
	PRO,
	ANTI,
	FLOAT,
	DASH,
	STATIC,
	CW_HANDPATH,
	CCW_HANDPATH
} from '$lib/types/Constants';
import type { Loc, PropRotDir, Orientation, TKATurns, HandRotDir } from '$lib/types/Types';
import type { Motion } from '../Motion/Motion';

// Type definitions for rotation maps
export type RotationDirectionMap = {
	[key in Loc]?: number;
};

export type PropRotDirMap = {
	[key in PropRotDir]?: RotationDirectionMap;
};

export type OrientationMap = {
	[key in Orientation]?: PropRotDirMap;
};

export type LocationOverrideMap = {
	[key in Loc]?: number | { [key in PropRotDir]?: number };
};

// Class definition with simple delegation to pure function
export default class ArrowRotAngleManager {
	updateRotation(motion: Motion, arrowLoc: Loc): number {
		return calculateArrowRotationAngle(motion, arrowLoc);
	}
}

// Rotation angle maps
export const PRO_ROTATION_MAP: PropRotDirMap = {
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
	},
	[NO_ROT]: {}
};

export const ANTI_REGULAR_MAP: PropRotDirMap = {
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
	},
	[NO_ROT]: {}
};

export const ANTI_ALT_MAP: PropRotDirMap = {
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
	},
	[NO_ROT]: {}
};

export const FLOAT_DIRECTION_MAP: { [key: string]: RotationDirectionMap } = {
	[CW_HANDPATH]: {
		[NORTH]: 315,
		[EAST]: 45,
		[SOUTH]: 135,
		[WEST]: 225,
		[NORTHEAST]: 0,
		[SOUTHEAST]: 90,
		[SOUTHWEST]: 180,
		[NORTHWEST]: 270
	},
	[CCW_HANDPATH]: {
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

export const DASH_NO_ROTATION_MAP: { [key: string]: number } = {
	[`${NORTH}-${SOUTH}`]: 90,
	[`${EAST}-${WEST}`]: 180,
	[`${SOUTH}-${NORTH}`]: 270,
	[`${WEST}-${EAST}`]: 0,
	[`${SOUTHEAST}-${NORTHWEST}`]: 225,
	[`${SOUTHWEST}-${NORTHEAST}`]: 315,
	[`${NORTHWEST}-${SOUTHEAST}`]: 45,
	[`${NORTHEAST}-${SOUTHWEST}`]: 135
};

export const DASH_ORIENTATION_MAP: OrientationMap = {
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
		},
		[NO_ROT]: {}
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
		},
		[NO_ROT]: {}
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
		},
		[NO_ROT]: {}
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
		},
		[NO_ROT]: {}
	}
};

export const CW_DASH_ANGLE_OVERRIDE_MAP: RotationDirectionMap = {
	[NORTH]: 270,
	[EAST]: 0,
	[SOUTH]: 90,
	[WEST]: 180,
	[NORTHEAST]: 315,
	[SOUTHEAST]: 45,
	[SOUTHWEST]: 135,
	[NORTHWEST]: 225
};

export const CCW_DASH_ANGLE_OVERRIDE_MAP: RotationDirectionMap = {
	[NORTH]: 270,
	[EAST]: 180,
	[SOUTH]: 90,
	[WEST]: 0,
	[NORTHEAST]: 225,
	[SOUTHEAST]: 135,
	[SOUTHWEST]: 45,
	[NORTHWEST]: 315
};

export const RADIAL_STATIC_DIRECTION_MAP: PropRotDirMap = {
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
	},
	[NO_ROT]: {}
};

export const NONRADIAL_STATIC_DIRECTION_MAP: PropRotDirMap = {
	[CLOCKWISE]: {
		[NORTH]: 180,
		[EAST]: 270,
		[SOUTH]: 0,
		[WEST]: 90,
		[NORTHEAST]: 225,
		[SOUTHEAST]: 315,
		[SOUTHWEST]: 45,
		[NORTHWEST]: 135
	},
	[COUNTER_CLOCKWISE]: {
		[NORTH]: 180,
		[EAST]: 90,
		[SOUTH]: 0,
		[WEST]: 270,
		[NORTHEAST]: 135,
		[SOUTHEAST]: 45,
		[SOUTHWEST]: 315,
		[NORTHWEST]: 225
	},
	[NO_ROT]: {}
};

export const STATIC_FROM_RADIAL_ANGLE_OVERRIDE_MAP: LocationOverrideMap = {
	[NORTH]: 180,
	[EAST]: { [CLOCKWISE]: 270, [COUNTER_CLOCKWISE]: 90, [NO_ROT]: 0 },
	[SOUTH]: 0,
	[WEST]: { [CLOCKWISE]: 90, [COUNTER_CLOCKWISE]: 270, [NO_ROT]: 0 },
	[NORTHEAST]: { [CLOCKWISE]: 225, [COUNTER_CLOCKWISE]: 135, [NO_ROT]: 0 },
	[SOUTHEAST]: { [CLOCKWISE]: 315, [COUNTER_CLOCKWISE]: 45, [NO_ROT]: 0 },
	[SOUTHWEST]: { [CLOCKWISE]: 45, [COUNTER_CLOCKWISE]: 315, [NO_ROT]: 0 },
	[NORTHWEST]: { [CLOCKWISE]: 135, [COUNTER_CLOCKWISE]: 225, [NO_ROT]: 0 }
};

export const STATIC_FROM_NONRADIAL_ANGLE_OVERRIDE_MAP: LocationOverrideMap = {
	[NORTH]: 0,
	[EAST]: { [CLOCKWISE]: 90, [COUNTER_CLOCKWISE]: 270, [NO_ROT]: 0 },
	[SOUTH]: 180,
	[WEST]: { [CLOCKWISE]: 270, [COUNTER_CLOCKWISE]: 90, [NO_ROT]: 0 },
	[NORTHEAST]: { [CLOCKWISE]: 45, [COUNTER_CLOCKWISE]: 315, [NO_ROT]: 0 },
	[SOUTHEAST]: { [CLOCKWISE]: 135, [COUNTER_CLOCKWISE]: 225, [NO_ROT]: 0 },
	[SOUTHWEST]: { [CLOCKWISE]: 225, [COUNTER_CLOCKWISE]: 135, [NO_ROT]: 0 },
	[NORTHWEST]: { [CLOCKWISE]: 315, [COUNTER_CLOCKWISE]: 45, [NO_ROT]: 0 }
};

// Don't forget to import these at the top of the file
import { Letter } from '$lib/types/Letter';
import { LetterType } from '$lib/types/LetterType';
import { LetterUtils } from '$lib/utils/LetterUtils';

// Primary calculation function
export function calculateArrowRotationAngle(motion: Motion, arrowLoc: Loc): number {
	const { motionType } = motion;

	switch (motionType) {
		case PRO:
			return calculateProRotationAngle(arrowLoc, motion.propRotDir);
		case ANTI:
			return calculateAntiRotationAngle(arrowLoc, motion.propRotDir, motion.startOri, motion.turns);
		case FLOAT:
			return calculateFloatRotationAngle(arrowLoc, motion.handRotDir);
		case DASH:
			return calculateDashRotationAngle(arrowLoc, motion);
		case STATIC:
			return calculateStaticRotationAngle(arrowLoc, motion);
		default:
			return 0;
	}
}

// Helper calculation functions
function calculateProRotationAngle(loc: Loc, propRotDir: PropRotDir): number {
	return PRO_ROTATION_MAP[propRotDir]?.[loc] ?? 0;
}

function calculateAntiRotationAngle(
	loc: Loc,
	propRotDir: PropRotDir,
	startOri: Orientation,
	turns: TKATurns
): number {
	const shouldUseAltMap =
		[CLOCK, COUNTER].includes(startOri) &&
		typeof turns === 'number' &&
		[0.5, 1.5, 2.5].includes(turns);

	const directionMap = shouldUseAltMap ? ANTI_ALT_MAP : ANTI_REGULAR_MAP;
	return directionMap[propRotDir]?.[loc] ?? 0;
}

function calculateFloatRotationAngle(loc: Loc, handRotDir?: HandRotDir): number {
	const activeRotDirection = handRotDir || CW_HANDPATH;
	return FLOAT_DIRECTION_MAP[activeRotDirection]?.[loc] ?? 0;
}

function calculateDashRotationAngle(loc: Loc, motion: Motion): number {
	const { startOri, propRotDir, startLoc, endLoc } = motion;

	if (hasRotationAngleOverride(motion)) {
		return getDashRotAngleOverride(loc, propRotDir);
	}

	if (propRotDir === NO_ROT) {
		return DASH_NO_ROTATION_MAP[`${startLoc}-${endLoc}`] ?? 0;
	}

	return DASH_ORIENTATION_MAP[startOri]?.[propRotDir]?.[loc] ?? 0;
}

function getDashRotAngleOverride(loc: Loc, propRotDir: PropRotDir): number {
	if (propRotDir === CLOCKWISE) {
		return CW_DASH_ANGLE_OVERRIDE_MAP[loc] ?? 0;
	} else if (propRotDir === COUNTER_CLOCKWISE) {
		return CCW_DASH_ANGLE_OVERRIDE_MAP[loc] ?? 0;
	}
	return 0;
}

function calculateStaticRotationAngle(loc: Loc, motion: Motion): number {
	const { startOri, propRotDir } = motion;

	if (hasRotationAngleOverride(motion)) {
		return getStaticRotAngleOverride(loc, propRotDir, startOri);
	}

	const isRadialOrientation = [IN, OUT].includes(startOri);
	const directionMap = isRadialOrientation
		? RADIAL_STATIC_DIRECTION_MAP
		: NONRADIAL_STATIC_DIRECTION_MAP;

	return directionMap[propRotDir]?.[loc] ?? 0;
}

function getStaticRotAngleOverride(
	loc: Loc,
	propRotDir: PropRotDir,
	startOri: Orientation
): number {
	const isRadialOrientation = [IN, OUT].includes(startOri);
	const overrideMap = isRadialOrientation
		? STATIC_FROM_RADIAL_ANGLE_OVERRIDE_MAP
		: STATIC_FROM_NONRADIAL_ANGLE_OVERRIDE_MAP;

	const locAngle = overrideMap[loc];
	if (typeof locAngle === 'object') {
		return locAngle[propRotDir] ?? 0;
	}
	return locAngle ?? 0;
}

function hasRotationAngleOverride(motion: Motion): boolean {
	// Check for special letter types or configurations that need angle overrides
	// This is a simplified implementation - you might need to add more conditions
	const letterType = motion.letter ? LetterType.getLetterType(motion.letter) : null;
	const isSpecialLetter =
		motion.letter &&
		[Letter.Φ_DASH, Letter.Ψ_DASH, Letter.Λ, Letter.Λ_DASH].includes(
			LetterUtils.getLetter(motion.letter)
		);

	// Check if this is a special case that needs rotation angle override
	return (
		isSpecialLetter ||
		(motion.motionType === DASH && motion.turns === 0) ||
		(motion.motionType === STATIC && motion.turns === 0)
	);
}
