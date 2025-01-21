import type { GridData, GridPoint } from "../../Grid/GridInterface";
import type { PropInterface } from "../PropInterface";

export class DefaultPropPositioner {
	private locationPointsCache: Record<string, GridPoint> = {};

	constructor(
		private gridData: GridData,
		private gridMode: string,
		private gridWidth: number,
		private gridHeight: number
	) {}

	public setToDefaultPosition(prop: PropInterface): void {
		const pointName = `${prop.loc}_${this.gridMode}_hand_point`;
		console.debug(`Looking for point: ${pointName}`);
		
		const gridPoint = this.getGridPoint(pointName, false);
		console.debug(`Grid point for ${prop.propType}:`, gridPoint);
		
		if (gridPoint?.coordinates) {
			console.debug(`Placing ${prop.propType} at`, gridPoint.coordinates);
			this.placePropAtHandPoint(prop, gridPoint.coordinates);
		} else {
			console.warn(`No coordinates found for ${pointName}`);
		}
	}
	

	private placePropAtHandPoint(prop: PropInterface, handPoint: { x: number; y: number }): void {
		const scaleFactorX = this.gridWidth / 950;
		const scaleFactorY = this.gridHeight / 950;

		const scaledHandPoint = {
			x: handPoint.x * scaleFactorX,
			y: handPoint.y * scaleFactorY,
		};

		const centerPoint = prop.svgCenter || { x: 0, y: 0 };
		const offset = {
			x: scaledHandPoint.x - centerPoint.x,
			y: scaledHandPoint.y - centerPoint.y,
		};

		prop.coords = {
			x: offset.x,
			y: offset.y,
		};

		console.debug(`Placed prop '${prop.propType}' at coordinates:`, prop.coords);
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
