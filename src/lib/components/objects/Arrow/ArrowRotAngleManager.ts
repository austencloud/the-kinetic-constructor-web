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
import type { PictographService } from '$lib/components/Pictograph/PictographService';
import { calculateShiftLocation } from './ArrowLocationManager';
import type { PictographData } from '$lib/types/PictographData';

export default class ArrowRotAngleManager {
	private service?: PictographService;
	private data: PictographData;

	constructor(data: PictographData, service?: PictographService) {
		this.data = data;
		this.service = service;
	}

	updateRotation(motion: Motion, arrowLoc: Loc): number {
		return calculateArrowRotationAngle(motion, arrowLoc, this.data, this.service);
	}
}

export function calculateArrowRotationAngle(
	motion: Motion,
	arrowLoc: Loc,
	data: PictographData,
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
			return data.letter ? calculateDashRotationAngle(arrowLoc, motion, data.letter, service) : 0;
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

function calculateDashRotationAngle(
	loc: Loc,
	motion: Motion,
	letter: Letter,
	service?: PictographService
): number {
	const { startOri, propRotDir, startLoc, endLoc, turns, gridMode, color } = motion;

	// First, handle zero-turn no-rotation case uniformly
	if (turns === 0 && propRotDir === NO_ROT) {
		const key = `${startLoc}-${endLoc}`;
		return DASH_NO_ROTATION_MAP[key] ?? 0;
	}

	// Special letter handling (unchanged from previous implementation)
	if (letter && service) {
		const letterValue = LetterUtils.getLetter(letter);
		const letterType = LetterType.getLetterType(letter);

		if ([Letter.Φ_DASH, Letter.Ψ_DASH].includes(letterValue)) {
			if (turns === 0) {
				const key = `${color}_${startLoc}_${endLoc}`;
				if (PHI_DASH_PSI_DASH_ANGLE_MAP[key] !== undefined) {
					return PHI_DASH_PSI_DASH_ANGLE_MAP[key];
				}

				const otherMotion = service.getOtherMotion(motion);
				if (otherMotion && otherMotion.turns !== 0) {
					const otherAngle = calculateDashRotationAngle(loc, otherMotion, letter, service);
					return (otherAngle + 180) % 360;
				}
			}
		}

		if ([Letter.Λ, Letter.Λ_DASH].includes(letterValue) && turns === 0) {
			const otherMotion = service.getOtherMotion(motion);
			if (otherMotion) {
				const key = `${startLoc}_${endLoc}_${otherMotion.endLoc}`;
				if (LAMBDA_ZERO_TURNS_ANGLE_MAP[key] !== undefined) {
					return LAMBDA_ZERO_TURNS_ANGLE_MAP[key];
				}
			}
		}

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

	// Rotation angle override for special cases
	if (hasRotationAngleOverride(motion)) {
		return getDashRotAngleOverride(loc, propRotDir);
	}

	// Default orientation-based rotation
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

function getOppositeLocation(loc: Loc): Loc {
	return OPPOSITE_LOCATION_MAP[loc] || loc;
}

function hasRotationAngleOverride(motion: Motion): boolean {
	const letterType = motion.letter ? LetterType.getLetterType(motion.letter) : null;
	const isSpecialLetter =
		motion.letter &&
		[Letter.Φ_DASH, Letter.Ψ_DASH, Letter.Λ, Letter.Λ_DASH].includes(
			LetterUtils.getLetter(motion.letter)
		);

	return (
		isSpecialLetter ||
		(motion.motionType === DASH && motion.turns === 0) ||
		(motion.motionType === STATIC && motion.turns === 0)
	);
}
