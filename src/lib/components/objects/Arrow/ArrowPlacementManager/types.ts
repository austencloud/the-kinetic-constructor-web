// src/lib/components/PlacementManagers/ArrowPlacementManager/types.ts
import type { PictographData } from '$lib/types/PictographData';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { PictographChecker } from '$lib/components/Pictograph/services/PictographChecker';
import type { PropRotDir } from '$lib/types/Types';

export type ArrowPlacementConfig = {
	pictographData: PictographData;
	gridData: GridData;
	checker: PictographChecker;
};
export type Coordinates = {
	x: number;
	y: number;
};
export type DirectionTuple = [number, number];
export type DirectionTupleSet = DirectionTuple[];
export type PlacementFunction = (pointName: string) => Coordinates | null;
export type TupleMapDefinition = Record<PropRotDir, DirectionTupleSet>;
