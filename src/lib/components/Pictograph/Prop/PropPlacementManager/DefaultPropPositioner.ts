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
		// Align the prop's center to the hand point
		const propCenterOffset = this.getSvgCenterOffset();
		const scaledHandPoint = {
			x: (handPoint.x / 950) * this.gridWidth,
			y: (handPoint.y / 950) * this.gridHeight,
		};
		prop.coords = {
			x: scaledHandPoint.x - propCenterOffset.x,
			y: scaledHandPoint.y - propCenterOffset.y,
		};
		console.debug(`Placed prop at scaled coordinates:`, prop.coords);
	}

	private getSvgCenterOffset(): { x: number; y: number } {
		// Hardcoded center offset for props based on the SVG's "centerPoint"
		// Replace these values with the actual "centerPoint" offset if dynamic
		return { x: 5, y: 5 }; // Example offset; replace with actual centerPoint data
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
