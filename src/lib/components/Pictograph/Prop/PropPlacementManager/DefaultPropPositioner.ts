// --- DefaultPropPositioner.ts ---
import type { GridData, GridPoint } from '../../Grid/GridInterface';
import type { PropInterface } from '../PropInterface';

export class DefaultPropPositioner {
    private locationPointsCache: Record<string, GridPoint> = {};

    constructor(private gridData: GridData) {}

    public setToDefaultPosition(prop: PropInterface): void {
        const strict = this.hasStrictlyPlacedProps(prop);
        const pointSuffix = strict ? '_strict' : '';
        const pointName = `${prop.loc}_${prop.motion.pictographData.gridMode}_hand_point${pointSuffix}`;

        console.debug(`Attempting to place prop '${prop.propType}' at point '${pointName}'.`);

        const gridPoint = this.getGridPoint(pointName, strict);

        if (gridPoint?.coordinates) {
            console.debug(`Found coordinates for '${pointName}':`, gridPoint.coordinates);
            this.placePropAtHandPoint(prop, gridPoint.coordinates);
        } else {
            console.warn(`Hand point '${pointName}' not found or has no coordinates.`);
        }
    }

    private placePropAtHandPoint(prop: PropInterface, handPoint: { x: number; y: number }): void {
        const centerPoint = this.getSvgCenterPoint(prop);
        const offsetX = handPoint.x - centerPoint.x;
        const offsetY = handPoint.y - centerPoint.y;
        prop.coords = { x: handPoint.x - offsetX, y: handPoint.y - offsetY };
    }

    private getSvgCenterPoint(prop: PropInterface): { x: number; y: number } {
        const boundingBox = { x: 50, y: 50, width: 100, height: 100 }; // Replace with dynamic SVG bounds calculation
        return {
            x: boundingBox.x + boundingBox.width / 2,
            y: boundingBox.y + boundingBox.height / 2
        };
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