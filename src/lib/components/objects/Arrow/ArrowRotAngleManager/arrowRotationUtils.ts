import type { Motion } from '$lib/components/objects/Motion/Motion';
import type { Loc, PropRotDir, Orientation, TKATurns, HandRotDir } from '$lib/types/Types';
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
	CW_HANDPATH
} from '$lib/types/Constants';

import {
	PRO_ROTATION_MAP,
	ANTI_REGULAR_MAP,
	ANTI_ALT_MAP,
	FLOAT_DIRECTION_MAP,
	DASH_NO_ROTATION_MAP,
	DASH_ORIENTATION_MAP,
	CW_DASH_ANGLE_OVERRIDE_MAP,
	CCW_DASH_ANGLE_OVERRIDE_MAP,
	RADIAL_STATIC_DIRECTION_MAP,
	NONRADIAL_STATIC_DIRECTION_MAP,
	STATIC_FROM_RADIAL_ANGLE_OVERRIDE_MAP,
	STATIC_FROM_NONRADIAL_ANGLE_OVERRIDE_MAP
} from './arrowRotationMaps';

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
	// Implementation would check motion properties and special placements
	return false;
}
