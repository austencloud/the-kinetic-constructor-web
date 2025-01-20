export interface GridPoint {
    coordinates: { x: number; y: number } | null;
}

export interface GridData {
	allHandPointsStrict: Record<string, GridPoint>;
	allHandPointsNormal: Record<string, GridPoint>;
	allLayer2PointsStrict: Record<string, GridPoint>;
	allLayer2PointsNormal: Record<string, GridPoint>;
	allOuterPoints: Record<string, GridPoint>;
	centerPoint: GridPoint;
}
