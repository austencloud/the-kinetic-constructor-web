import {
	PRO,
	ANTI,
	FLOAT,
	DASH,
	STATIC,
	IN,
	OUT,
	CLOCK,
	COUNTER,
	CLOCKWISE,
	COUNTER_CLOCKWISE,
	NO_ROT,
	CW_HANDPATH
} from '$lib/types/Constants';
import type { Loc, PropRotDir, Orientation, TKATurns, HandRotDir } from '$lib/types/Types';
import type { Motion } from '../Motion/Motion';
import { Letter } from '$lib/types/Letter';
import { LetterType } from '$lib/types/LetterType';
import { LetterUtils } from '$lib/utils/LetterUtils';

// Import rotation constant maps
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
} from './constants/ArrowRotationConstants';

/**
 * Class for managing arrow rotation angles
 */
export default class ArrowRotAngleManager {
	/**
	 * Updates the rotation angle for an arrow
	 * @param motion The motion data
	 * @param arrowLoc The arrow location
	 * @returns The calculated rotation angle
	 */
	updateRotation(motion: Motion, arrowLoc: Loc): number {
		return calculateArrowRotationAngle(motion, arrowLoc);
	}
}

/**
 * Calculates rotation angle for arrow based on motion data
 * @param motion Motion data
 * @param arrowLoc Arrow location
 * @returns Rotation angle in degrees
 */
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

/**
 * Calculates rotation angle for PRO motion
 */
function calculateProRotationAngle(loc: Loc, propRotDir: PropRotDir): number {
	return PRO_ROTATION_MAP[propRotDir]?.[loc] ?? 0;
}

/**
 * Calculates rotation angle for ANTI motion
 */
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

/**
 * Calculates rotation angle for FLOAT motion
 */
function calculateFloatRotationAngle(loc: Loc, handRotDir?: HandRotDir): number {
	const activeRotDirection = handRotDir || CW_HANDPATH;
	return FLOAT_DIRECTION_MAP[activeRotDirection]?.[loc] ?? 0;
}

/**
 * Calculates rotation angle for DASH motion
 */
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

/**
 * Gets rotation angle override for DASH motion
 */
function getDashRotAngleOverride(loc: Loc, propRotDir: PropRotDir): number {
	if (propRotDir === CLOCKWISE) {
		return CW_DASH_ANGLE_OVERRIDE_MAP[loc] ?? 0;
	} else if (propRotDir === COUNTER_CLOCKWISE) {
		return CCW_DASH_ANGLE_OVERRIDE_MAP[loc] ?? 0;
	}
	return 0;
}

/**
 * Calculates rotation angle for STATIC motion
 */
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

/**
 * Gets rotation angle override for STATIC motion
 */
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

/**
 * Determines if motion needs a rotation angle override
 */
function hasRotationAngleOverride(motion: Motion): boolean {
	// Letter-specific checks
	const letterType = motion.letter ? LetterType.getLetterType(motion.letter) : null;
	const isSpecialLetter =
		motion.letter &&
		[Letter.Φ_DASH, Letter.Ψ_DASH, Letter.Λ, Letter.Λ_DASH].includes(
			LetterUtils.getLetter(motion.letter)
		);

	// Case-specific checks
	return (
		isSpecialLetter ||
		(motion.motionType === DASH && motion.turns === 0) ||
		(motion.motionType === STATIC && motion.turns === 0)
	);
}