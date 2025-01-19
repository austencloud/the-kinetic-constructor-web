import type { PropInterface } from '../Prop/PropInterface';
import type { GridPoint } from '../Grid/GridInterface';

export class DefaultPropPositioner {
	private locationPointsCache: Record<string, GridPoint> = {};

	public setToDefaultPosition(propData: PropInterface): void {
		const strict = this.hasStrictlyPlacedProps(propData);
		const pointSuffix = strict ? '_strict' : '';
		const pointName = `${propData.loc}_${propData.motion.pictographData.gridMode}_hand_point${pointSuffix}`;

		console.debug(`Attempting to place prop '${propData.propType}' at point '${pointName}'.`);

		const gridPoint = this.getGridPoint(pointName, strict);

		if (gridPoint?.coordinates) {
			console.debug(`Found coordinates for '${pointName}':`, gridPoint.coordinates);
			this.placePropAtHandPoint(propData, gridPoint.coordinates);
		} else {
			console.warn(`Hand point '${pointName}' not found or has no coordinates.`);
		}
	}

	private placePropAtHandPoint(propData: PropInterface, handPoint: { x: number; y: number }): void {
		const centerPoint = this.getSvgCenterPoint(propData);
		const offsetX = handPoint.x - centerPoint.x;
		const offsetY = handPoint.y - centerPoint.y;
		propData.coords = { x: propData.coords.x + offsetX, y: propData.coords.y + offsetY };
	}

	private getSvgCenterPoint(propData: PropInterface): { x: number; y: number } {
		const boundingBox = { x: 50, y: 50, width: 100, height: 100 };
		return {
			x: boundingBox.x + boundingBox.width / 2,
			y: boundingBox.y + boundingBox.height / 2
		};
	}

	private getGridPoint(pointName: string, strict: boolean): GridPoint | undefined {
		if (this.locationPointsCache[pointName]) {
			return this.locationPointsCache[pointName];
		}

		const gridData = strict ? this.getStrictGridData() : this.getNormalGridData();
		const gridPoint = gridData[pointName];
		if (gridPoint) {
			this.locationPointsCache[pointName] = gridPoint;
		}
		return gridPoint;
	}

	private hasStrictlyPlacedProps(propData: PropInterface): boolean {
		return propData.motion.pictographData.gridMode === 'diamond';
	}

	private getStrictGridData(): Record<string, GridPoint> {
		return {
			'loc_diamond_hand_point_strict': { coordinates: { x: 150, y: 150 } }
		};
	}

	private getNormalGridData(): Record<string, GridPoint> {
		return {
			'loc_diamond_hand_point': { coordinates: { x: 100, y: 100 } }
		};
	}
}
