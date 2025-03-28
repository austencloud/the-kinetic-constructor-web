export type RenderStage =
	| 'initializing'
	| 'loading'
	| 'grid_ready'
	| 'components_ready'
	| 'positioning'
	| 'complete';

export const DEFAULT_COMPONENT_LOADING = {
	grid: false,
	redProp: false,
	blueProp: false,
	redArrow: false,
	blueArrow: false
};
export type ComponentLoadingStatus = typeof DEFAULT_COMPONENT_LOADING;

export const DEFAULT_COMPONENT_POSITIONING = {
	redProp: false,
	blueProp: false,
	redArrow: false,
	blueArrow: false
};
export type ComponentPositioningStatus = typeof DEFAULT_COMPONENT_POSITIONING;

export const MAX_RETRIES = 3;
export const DEFAULT_SAFETY_TIMEOUT = 500;
