import type { Loc, Orientation, PropRotDir } from '$lib/types/Types';

export type RotationDirectionMap = {
	[key in Loc]?: number;
};

export type PropRotDirMap = {
	[key in PropRotDir]?: RotationDirectionMap;
};

export type OrientationMap = {
	[key in Orientation]?: PropRotDirMap;
};

export type LocationOverrideMap = {
	[key in Loc]?: number | { [key in PropRotDir]?: number };
};
