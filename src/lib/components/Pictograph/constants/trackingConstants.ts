// src/lib/components/Pictograph/constants/trackingConstants.ts

/**
 * Stage progress in the pictograph rendering lifecycle
 */
export type RenderStage = 
  | 'initializing'  // Initial stage
  | 'loading'       // Loading resources
  | 'grid_ready'    // Grid is loaded
  | 'components_ready' // Components created
  | 'positioning'   // Positioning elements
  | 'complete';     // Everything is ready

/**
 * Default state for component loading tracking
 */
export const DEFAULT_COMPONENT_LOADING = {
  grid: false,
  redProp: false,
  blueProp: false,
  redArrow: false,
  blueArrow: false
};

/**
 * Default state for component positioning tracking
 */
export const DEFAULT_COMPONENT_POSITIONING = {
  redProp: false,
  blueProp: false,
  redArrow: false,
  blueArrow: false
};

/**
 * Maximum number of retry attempts for initialization
 */
export const MAX_RETRIES = 3;

/**
 * Default safety timeout in milliseconds
 */
export const DEFAULT_SAFETY_TIMEOUT = 10;