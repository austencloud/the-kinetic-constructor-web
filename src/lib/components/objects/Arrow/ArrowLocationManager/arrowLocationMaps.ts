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
  RED,
  BLUE,
  DIAMOND,
  BOX
} from '$lib/types/Constants';

import type { 
  LocationPairMap, 
  DirectionalLocationMap,
  LetterLocationMap,
  GridLocationMap,
  LocationPairsMap,
  LocationPair
} from './arrowLocationTypes';

/**
 * Map for default zero turns dash location
 */
export const DEFAULT_ZERO_TURNS_DASH_LOCATION_MAP: LocationPairMap = {
  [`${NORTH}_${SOUTH}`]: EAST,
  [`${EAST}_${WEST}`]: SOUTH,
  [`${SOUTH}_${NORTH}`]: WEST,
  [`${WEST}_${EAST}`]: NORTH,
  [`${NORTHEAST}_${SOUTHWEST}`]: SOUTHEAST,
  [`${NORTHWEST}_${SOUTHEAST}`]: NORTHEAST,
  [`${SOUTHWEST}_${NORTHEAST}`]: NORTHWEST,
  [`${SOUTHEAST}_${NORTHWEST}`]: SOUTHWEST
};

/**
 * Map for non-zero turns dash location calculation
 */
export const DASH_LOCATION_NONZERO_TURNS_MAP: DirectionalLocationMap = {
  [CLOCKWISE]: {
    [NORTH]: EAST,
    [EAST]: SOUTH,
    [SOUTH]: WEST,
    [WEST]: NORTH,
    [NORTHEAST]: SOUTHEAST,
    [SOUTHEAST]: SOUTHWEST,
    [SOUTHWEST]: NORTHWEST,
    [NORTHWEST]: NORTHEAST
  },
  [COUNTER_CLOCKWISE]: {
    [NORTH]: WEST,
    [EAST]: NORTH,
    [SOUTH]: EAST,
    [WEST]: SOUTH,
    [NORTHEAST]: NORTHWEST,
    [SOUTHEAST]: NORTHEAST,
    [SOUTHWEST]: SOUTHEAST,
    [NORTHWEST]: SOUTHWEST
  }
};

/**
 * Map for phi dash psi dash location for zero turns
 */
export const PHI_DASH_PSI_DASH_LOCATION_MAP: LetterLocationMap = {
  [`${RED}_${NORTH}_${SOUTH}`]: EAST,
  [`${RED}_${EAST}_${WEST}`]: NORTH,
  [`${RED}_${SOUTH}_${NORTH}`]: EAST,
  [`${RED}_${WEST}_${EAST}`]: NORTH,
  [`${BLUE}_${NORTH}_${SOUTH}`]: WEST,
  [`${BLUE}_${EAST}_${WEST}`]: SOUTH,
  [`${BLUE}_${SOUTH}_${NORTH}`]: WEST,
  [`${BLUE}_${WEST}_${EAST}`]: SOUTH,
  [`${RED}_${NORTHWEST}_${SOUTHEAST}`]: NORTHEAST,
  [`${RED}_${NORTHEAST}_${SOUTHWEST}`]: SOUTHEAST,
  [`${RED}_${SOUTHWEST}_${NORTHEAST}`]: SOUTHEAST,
  [`${RED}_${SOUTHEAST}_${NORTHWEST}`]: NORTHEAST,
  [`${BLUE}_${NORTHWEST}_${SOUTHEAST}`]: SOUTHWEST,
  [`${BLUE}_${NORTHEAST}_${SOUTHWEST}`]: NORTHWEST,
  [`${BLUE}_${SOUTHWEST}_${NORTHEAST}`]: NORTHWEST,
  [`${BLUE}_${SOUTHEAST}_${NORTHWEST}`]: SOUTHWEST
};

/**
 * Map for lambda zero turns location
 */
export const LAMBDA_ZERO_TURNS_LOCATION_MAP: LetterLocationMap = {
  [`${NORTH}_${SOUTH}_${WEST}`]: EAST,
  [`${EAST}_${WEST}_${SOUTH}`]: NORTH,
  [`${NORTH}_${SOUTH}_${EAST}`]: WEST,
  [`${WEST}_${EAST}_${SOUTH}`]: NORTH,
  [`${SOUTH}_${NORTH}_${WEST}`]: EAST,
  [`${EAST}_${WEST}_${NORTH}`]: SOUTH,
  [`${SOUTH}_${NORTH}_${EAST}`]: WEST,
  [`${WEST}_${EAST}_${NORTH}`]: SOUTH,
  [`${NORTHEAST}_${SOUTHWEST}_${NORTHWEST}`]: SOUTHEAST,
  [`${NORTHWEST}_${SOUTHEAST}_${NORTHEAST}`]: SOUTHWEST,
  [`${SOUTHWEST}_${NORTHEAST}_${SOUTHEAST}`]: NORTHWEST,
  [`${SOUTHEAST}_${NORTHWEST}_${SOUTHWEST}`]: NORTHEAST,
  [`${NORTHEAST}_${SOUTHWEST}_${SOUTHEAST}`]: NORTHWEST,
  [`${NORTHWEST}_${SOUTHEAST}_${SOUTHWEST}`]: NORTHEAST,
  [`${SOUTHWEST}_${NORTHEAST}_${NORTHWEST}`]: SOUTHEAST,
  [`${SOUTHEAST}_${NORTHWEST}_${NORTHEAST}`]: SOUTHWEST
};

/**
 * Map for diamond grid dash location calculation
 */
export const DIAMOND_DASH_LOCATION_MAP: GridLocationMap = {
  [NORTH]: { 
    [NORTHWEST]: EAST, 
    [NORTHEAST]: WEST, 
    [SOUTHEAST]: WEST, 
    [SOUTHWEST]: EAST 
  },
  [EAST]: { 
    [NORTHWEST]: SOUTH, 
    [NORTHEAST]: SOUTH, 
    [SOUTHEAST]: NORTH, 
    [SOUTHWEST]: NORTH 
  },
  [SOUTH]: { 
    [NORTHWEST]: EAST, 
    [NORTHEAST]: WEST, 
    [SOUTHEAST]: WEST, 
    [SOUTHWEST]: EAST 
  },
  [WEST]: { 
    [NORTHWEST]: SOUTH, 
    [NORTHEAST]: SOUTH, 
    [SOUTHEAST]: NORTH, 
    [SOUTHWEST]: NORTH 
  }
};

/**
 * Map for box grid dash location calculation
 */
export const BOX_DASH_LOCATION_MAP: GridLocationMap = {
  [NORTHEAST]: { 
    [NORTH]: SOUTHEAST, 
    [EAST]: NORTHWEST, 
    [SOUTH]: NORTHWEST, 
    [WEST]: SOUTHEAST 
  },
  [SOUTHEAST]: { 
    [NORTH]: SOUTHWEST, 
    [EAST]: SOUTHWEST, 
    [SOUTH]: NORTHEAST, 
    [WEST]: NORTHEAST 
  },
  [SOUTHWEST]: { 
    [NORTH]: SOUTHEAST, 
    [EAST]: NORTHWEST, 
    [SOUTH]: NORTHWEST, 
    [WEST]: SOUTHEAST 
  },
  [NORTHWEST]: { 
    [NORTH]: SOUTHWEST, 
    [EAST]: SOUTHWEST, 
    [SOUTH]: NORTHEAST, 
    [WEST]: NORTHEAST 
  }
};

/**
 * Map of opposite locations
 */
export const OPPOSITE_LOCATION_MAP: Record<string, string> = {
  [NORTH]: SOUTH,
  [SOUTH]: NORTH,
  [EAST]: WEST,
  [WEST]: EAST,
  [NORTHEAST]: SOUTHWEST,
  [SOUTHWEST]: NORTHEAST,
  [SOUTHEAST]: NORTHWEST,
  [NORTHWEST]: SOUTHEAST
};

/**
 * Direction pairs for shift location calculation
 */
export function createDirectionPairsMap(): LocationPairsMap {
  const directionPairs: LocationPairsMap = new Map();
  
  // Cardinal to diagonal mappings
  directionPairs.set(new Set([NORTH, EAST]), NORTHEAST);
  directionPairs.set(new Set([EAST, SOUTH]), SOUTHEAST);
  directionPairs.set(new Set([SOUTH, WEST]), SOUTHWEST);
  directionPairs.set(new Set([WEST, NORTH]), NORTHWEST);
  
  // Diagonal to cardinal mappings
  directionPairs.set(new Set([NORTHEAST, NORTHWEST]), NORTH);
  directionPairs.set(new Set([NORTHEAST, SOUTHEAST]), EAST);
  directionPairs.set(new Set([SOUTHWEST, SOUTHEAST]), SOUTH);
  directionPairs.set(new Set([NORTHWEST, SOUTHWEST]), WEST);
  
  return directionPairs;
}
