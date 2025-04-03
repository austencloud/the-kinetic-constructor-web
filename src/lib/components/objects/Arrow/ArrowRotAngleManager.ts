// src/lib/components/objects/Arrow/ArrowRotAngleManager.ts
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
	CW_HANDPATH,
	DIAMOND,
	BOX
} from '$lib/types/Constants';
import type {
	Loc,
	PropRotDir,
	Orientation,
	TKATurns,
	HandRotDir,
	GridMode
} from '$lib/types/Types';
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
	STATIC_FROM_NONRADIAL_ANGLE_OVERRIDE_MAP,
	PHI_DASH_PSI_DASH_ANGLE_MAP,
	LAMBDA_ZERO_TURNS_ANGLE_MAP,
	DIAMOND_DASH_ANGLE_MAP,
	BOX_DASH_ANGLE_MAP,
	OPPOSITE_LOCATION_MAP
} from './constants/ArrowRotationConstants';
import type { PictographService } from '$lib/services/PictographService';
import { calculateShiftLocation } from './ArrowLocationManager';

/**
 * Class for managing arrow rotation angles
 */
export default class ArrowRotAngleManager {
	private service?: PictographService;

	constructor(service?: PictographService) {
		this.service = service;
	}

	/**
	 * Updates the rotation angle for an arrow
	 * @param motion The motion data
	 * @param arrowLoc The arrow location
	 * @returns The calculated rotation angle
	 */
	updateRotation(motion: Motion, arrowLoc: Loc): number {
		return calculateArrowRotationAngle(motion, arrowLoc, this.service);
	}
}

/**
 * Calculates rotation angle for arrow based on motion data
 * @param motion Motion data
 * @param arrowLoc Arrow location
 * @param service Optional PictographService for additional context
 * @returns Rotation angle in degrees
 */
export function calculateArrowRotationAngle(
	motion: Motion,
	arrowLoc: Loc,
	service?: PictographService
): number {
	const { motionType } = motion;

	switch (motionType) {
		case PRO:
			return calculateProRotationAngle(arrowLoc, motion.propRotDir);
		case ANTI:
			return calculateAntiRotationAngle(arrowLoc, motion.propRotDir, motion.startOri, motion.turns);
		case FLOAT:
			return calculateFloatRotationAngle(arrowLoc, motion.handRotDir);
		case DASH:
			return calculateDashRotationAngle(arrowLoc, motion, service);
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
function calculateDashRotationAngle(loc: Loc, motion: Motion, service?: PictographService): number {
	const { startOri, propRotDir, startLoc, endLoc, turns, letter, gridMode, color } = motion;

	// Handle special cases based on letter
	if (letter && service) {
		const letterValue = LetterUtils.getLetter(letter);
		const letterType = LetterType.getLetterType(letter);

		// Case 1: Phi Dash and Psi Dash special letters
		if ([Letter.Φ_DASH, Letter.Ψ_DASH].includes(letterValue)) {
			// For zero turns case
			if (turns === 0) {
				const key = `${color}_${startLoc}_${endLoc}`;
				if (PHI_DASH_PSI_DASH_ANGLE_MAP[key] !== undefined) {
					return PHI_DASH_PSI_DASH_ANGLE_MAP[key];
				}

				// If other motion exists and has non-zero turns, use opposite of its location angle
				const otherMotion = service.getOtherMotion(motion);
				if (otherMotion && otherMotion.turns !== 0) {
					// Calculate other motion's dash location angle
					const otherAngle = calculateDashRotationAngle(loc, otherMotion, service);
					// Get opposite angle (180 degrees rotated)
					return (otherAngle + 180) % 360;
				}
			}
		}

		// Case 2: Lambda and Lambda Dash with zero turns
		if ([Letter.Λ, Letter.Λ_DASH].includes(letterValue) && turns === 0) {
			const otherMotion = service.getOtherMotion(motion);
			if (otherMotion) {
				const key = `${startLoc}_${endLoc}_${otherMotion.endLoc}`;
				if (LAMBDA_ZERO_TURNS_ANGLE_MAP[key] !== undefined) {
					return LAMBDA_ZERO_TURNS_ANGLE_MAP[key];
				}
			}
		}

		// Case 3: Type3 letters with grid modes
		if (letterType === LetterType.Type3 && turns === 0) {
			const shiftMotion = service.getShiftMotion();
			if (shiftMotion) {
				const shiftLoc = calculateShiftLocation(shiftMotion.startLoc, shiftMotion.endLoc);

				if (gridMode === DIAMOND) {
					const key = `${startLoc}_${shiftLoc}`;
					if (DIAMOND_DASH_ANGLE_MAP[key] !== undefined) {
						return DIAMOND_DASH_ANGLE_MAP[key];
					}
				} else if (gridMode === BOX) {
					const key = `${startLoc}_${shiftLoc}`;
					if (BOX_DASH_ANGLE_MAP[key] !== undefined) {
						return BOX_DASH_ANGLE_MAP[key];
					}
				}
			}
		}
	}

	// Handle standard rotation angle calculations
	if (hasRotationAngleOverride(motion)) {
		return getDashRotAngleOverride(loc, propRotDir);
	}

	if (propRotDir === NO_ROT || turns === 0) {
		const key = `${startLoc}-${endLoc}`;
		return DASH_NO_ROTATION_MAP[key] ?? 0;
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
 * Gets the opposite location for a given location
 */
function getOppositeLocation(loc: Loc): Loc {
	return OPPOSITE_LOCATION_MAP[loc] || loc;
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
