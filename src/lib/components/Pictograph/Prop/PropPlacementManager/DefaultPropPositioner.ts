import type { GridData, GridPoint } from "../../Grid/GridInterface";
import type { GridMode } from "../../Motion/MotionInterface";
import type { PropInterface } from "../PropInterface";

export class DefaultPropPositioner {
	private locationPointsCache: Record<string, GridPoint> = {};

	constructor(
		private gridData: GridData,
		private gridMode: GridMode,
		private gridWidth: number,
		private gridHeight: number
	) {}

	public setToDefaultPosition(prop: PropInterface): void {
		const strict = this.hasStrictlyPlacedProps(prop);
		const pointSuffix = strict ? '_strict' : '';
		const pointName = `${prop.loc}_${this.gridMode}_hand_point${pointSuffix}`;

		console.debug(`Attempting to place prop '${prop.propType}' at point '${pointName}'.`);

		// Fetch the grid point based on the prop's location and grid mode
		const gridPoint = this.getGridPoint(pointName, strict);

		if (gridPoint?.coordinates) {
			console.debug(`Found coordinates for '${pointName}':`, gridPoint.coordinates);
			this.placePropAtHandPoint(prop, gridPoint.coordinates);
		} else {
			console.warn(`Hand point '${pointName}' not found or has no coordinates.`);
		}
	}

	private placePropAtHandPoint(prop: PropInterface, handPoint: { x: number; y: number }): void {
		// Calculate scaling factor
		const scaleFactorX = this.gridWidth / 950;
		const scaleFactorY = this.gridHeight / 950;
	
		// Scale coordinates based on container dimensions
		const scaledHandPoint = {
			x: handPoint.x * scaleFactorX,
			y: handPoint.y * scaleFactorY,
		};
	
		// Update prop coordinates
		prop.coords = {
			x: scaledHandPoint.x,
			y: scaledHandPoint.y,
		};
	
		console.debug(`Placed prop at scaled coordinates:`, prop.coords);
	}
	

	private getGridPoint(pointName: string, strict: boolean): GridPoint | undefined {
		if (this.locationPointsCache[pointName]) {
			return this.locationPointsCache[pointName];
		}

		const gridPoints = strict
			? this.gridData.allHandPointsStrict
			: this.gridData.allHandPointsNormal;
		const gridPoint = gridPoints[pointName];
		if (gridPoint) {
			this.locationPointsCache[pointName] = gridPoint;
		}
		return gridPoint;
	}

	private hasStrictlyPlacedProps(prop: PropInterface): boolean {
		const strictlyPlacedProps = ['Bigdoublestar', 'Bighoop', 'Bigbuugeng'];
		return strictlyPlacedProps.includes(prop.propType);
	}
}
