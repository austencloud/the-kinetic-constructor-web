import type { Loc, Color } from '../types/Types';

/**
 * Map from location pair to resulting location
 */
export type LocationPairMap = {
  [key: string]: Loc;
};

/**
 * Map for directional location calculations
 */
export type DirectionalLocationMap = {
  [key in string]?: {
    [key in Loc]?: Loc;
  };
};

/**
 * Map for special letter-specific location calculations
 */
export type LetterLocationMap = {
  [key: string]: Loc;
};

/**
 * Map for grid mode specific location lookups
 */
export type GridLocationMap = {
  [startLoc: string]: {
    [shiftLoc: string]: Loc;
  };
};

/**
 * Pair of locations as a Set for location calculation
 */
export type LocationPair = Set<Loc>;

/**
 * Map from location pairs to resulting location
 */
export type LocationPairsMap = Map<LocationPair, Loc>;
