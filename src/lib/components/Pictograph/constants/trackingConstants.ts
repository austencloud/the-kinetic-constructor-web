// src/lib/components/Pictograph/constants/trackingConstants.ts
/**
 * Defines the possible rendering stages of the Pictograph component.
 * - initializing: Initial setup before loading data.
 * - loading: Asynchronous operations (e.g., initializer) are in progress.
 * - grid_ready: The grid component has emitted its points.
 * - components_ready: All core visual components (props, arrows) have been created by the initializer.
 * - positioning: Components are being positioned by placement managers.
 * - complete: Rendering and positioning are finished (or finished with fallbacks).
 */
export type RenderStage =
	| 'initializing'
	| 'loading'
	| 'grid_ready'
	| 'components_ready'
	| 'positioning'
	| 'complete';

/** Default status for component loading tracking. */
export const DEFAULT_COMPONENT_LOADING = {
	grid: false,
	redProp: false,
	blueProp: false,
	redArrow: false,
	blueArrow: false
};
export type ComponentLoadingStatus = typeof DEFAULT_COMPONENT_LOADING;


/** Default status for component positioning tracking. */
export const DEFAULT_COMPONENT_POSITIONING = {
	redProp: false,
	blueProp: false,
	redArrow: false,
	blueArrow: false
};
export type ComponentPositioningStatus = typeof DEFAULT_COMPONENT_POSITIONING;


/** Maximum number of retries for certain asynchronous operations. */
export const MAX_RETRIES = 3;
/** Default safety timeout in milliseconds to prevent indefinite loading states. */
export const DEFAULT_SAFETY_TIMEOUT = 500; // Increased slightly for potentially slower environments