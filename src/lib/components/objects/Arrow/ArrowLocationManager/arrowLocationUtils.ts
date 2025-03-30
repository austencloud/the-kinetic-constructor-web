

import { ANTI, BOX, DASH, DIAMOND, FLOAT, PRO, STATIC } from '$lib/types/Constants';
import { Letter } from '$lib/types/Letter';
import { LetterType } from '$lib/types/LetterType';
import type { Loc } from '$lib/types/Types';
import { LetterUtils } from '$lib/utils/LetterUtils';
import type { Motion } from '../../Motion/Motion';
import {
  DEFAULT_ZERO_TURNS_DASH_LOCATION_MAP,
  DASH_LOCATION_NONZERO_TURNS_MAP,
  PHI_DASH_PSI_DASH_LOCATION_MAP,
  LAMBDA_ZERO_TURNS_LOCATION_MAP,
  DIAMOND_DASH_LOCATION_MAP,
  BOX_DASH_LOCATION_MAP,
  OPPOSITE_LOCATION_MAP,
  createDirectionPairsMap
} from './arrowLocationMaps';

/**
 * Main function to calculate arrow location based on motion type
 */
export function calculateArrowLocation(motion: Motion, getOtherMotion?: (motion: Motion) => Motion | null, getShiftMotion?: () => Motion | null): Loc | null {
  const { motionType } = motion;

  switch (motionType) {
    case PRO:
    case ANTI:
    case FLOAT:
      return calculateShiftLocation(motion.startLoc, motion.endLoc);
    case DASH:
      return calculateDashLocation(motion, getOtherMotion, getShiftMotion);
    case STATIC:
      return motion.startLoc;
    default:
      return null;
  }
}

/**
 * Calculate location for shift-type motions
 */
export function calculateShiftLocation(startLoc: Loc, endLoc: Loc): Loc | null {
  const directionPairs = createDirectionPairsMap();
  
  // Find matching direction pair
  for (const [locationPair, resultLoc] of directionPairs.entries()) {
    if (locationPair.has(startLoc) && locationPair.has(endLoc)) {
      return resultLoc;
    }
  }
  
  return null;
}

/**
 * Calculate location for dash-type motions
 */
export function calculateDashLocation(
  motion: Motion, 
  getOtherMotion?: (motion: Motion) => Motion | null,
  getShiftMotion?: () => Motion | null
): Loc | null {
  const letter = motion.letter ? LetterUtils.getLetter(motion.letter) : null;
  const letterType = motion.letter ? LetterType.getLetterType(motion.letter) : null;
  
  // Handle Type3 specific logic
  if (letterType === LetterType.Type3 && motion.turns === 0 && getShiftMotion) {
    return calculateDashLocationBasedOnShift(motion, getShiftMotion, getOtherMotion);
  }
  
  // Handle Phi/Psi dash special case
  if (letter && [Letter.Φ_DASH, Letter.Ψ_DASH].includes(letter) && getOtherMotion) {
    return calculatePhiDashPsiDashLocation(motion, getOtherMotion);
  }
  
  // Handle Lambda special case
  if (letter && [Letter.Λ, Letter.Λ_DASH].includes(letter) && motion.turns === 0 && getOtherMotion) {
    return calculateLambdaZeroTurnsLocation(motion, getOtherMotion);
  }
  
  // Default zero turns case
  if (motion.turns === 0) {
    return calculateDefaultZeroTurnsDashLocation(motion.startLoc, motion.endLoc);
  }
  
  // Non-zero turns case
  return calculateDashLocationNonZeroTurns(motion);
}

/**
 * Calculate location for Phi/Psi dash special case
 */
function calculatePhiDashPsiDashLocation(
  motion: Motion, 
  getOtherMotion: (motion: Motion) => Motion | null
): Loc | null {
  const otherMotion = getOtherMotion(motion);
  
  // Both zero turns case
  if (motion.turns === 0 && otherMotion && otherMotion.turns === 0) {
    const key = `${motion.color}_${motion.startLoc}_${motion.endLoc}`;
    return PHI_DASH_PSI_DASH_LOCATION_MAP[key] || null;
  }
  
  // Current motion zero turns, other motion non-zero
  if (motion.turns === 0 && otherMotion) {
    const otherLoc = calculateDashLocationNonZeroTurns(otherMotion);
    return otherLoc ? getOppositeLocation(otherLoc) : null;
  }
  
  // Non-zero turns case
  return calculateDashLocationNonZeroTurns(motion);
}

/**
 * Calculate location for Lambda zero turns special case
 */
function calculateLambdaZeroTurnsLocation(
  motion: Motion, 
  getOtherMotion: (motion: Motion) => Motion | null
): Loc | null {
  const otherMotion = getOtherMotion(motion);
  const key = `${motion.startLoc}_${motion.endLoc}_${otherMotion?.endLoc || ''}`;
  return LAMBDA_ZERO_TURNS_LOCATION_MAP[key] || null;
}

/**
 * Get opposite location (e.g., NORTH -> SOUTH)
 */
export function getOppositeLocation(loc: Loc): Loc | null {
  return (OPPOSITE_LOCATION_MAP[loc] as Loc) || null;
}

/**
 * Calculate default location for zero-turn dash motions
 */
function calculateDefaultZeroTurnsDashLocation(startLoc: Loc, endLoc: Loc): Loc | null {
  const key = `${startLoc}_${endLoc}`;
  return DEFAULT_ZERO_TURNS_DASH_LOCATION_MAP[key] || null;
}

/**
 * Calculate location for non-zero turn dash motions
 */
function calculateDashLocationNonZeroTurns(motion: Motion): Loc | null {
  return DASH_LOCATION_NONZERO_TURNS_MAP[motion.propRotDir]?.[motion.startLoc] || null;
}

/**
 * Calculate dash location based on shift for Type3 letters
 */
function calculateDashLocationBasedOnShift(
  motion: Motion,
  getShiftMotion: () => Motion | null,
  getOtherMotion?: (motion: Motion) => Motion | null
): Loc | null {
  const shiftMotion = getShiftMotion();
  const dashMotion = shiftMotion && getOtherMotion ? getOtherMotion(shiftMotion) : null;
  
  if (!shiftMotion || !dashMotion) {
    return null;
  }
  
  const shiftLocation = calculateShiftLocation(shiftMotion.startLoc, shiftMotion.endLoc);
  const dashStartLoc = dashMotion.startLoc;
  const gridMode = motion.gridMode;
  
  if (!shiftLocation || !dashStartLoc) {
    return null;
  }
  
  // Apply appropriate grid mode map
  if (gridMode === DIAMOND) {
    return DIAMOND_DASH_LOCATION_MAP[dashStartLoc]?.[shiftLocation] || null;
  } else if (gridMode === BOX) {
    return BOX_DASH_LOCATION_MAP[dashStartLoc]?.[shiftLocation] || null;
  }
  
  return null;
}
