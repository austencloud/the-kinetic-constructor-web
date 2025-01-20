export interface GridPoint {
	coordinates: { x: number; y: number };
}

export interface GridData {
	allHandPointsStrict: Record<string, GridPoint>;
	allHandPointsNormal: Record<string, GridPoint>;
}
