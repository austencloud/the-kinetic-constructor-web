import type { GridData, GridPoint } from '../../Grid/GridInterface';
import type { PropInterface } from '../PropInterface';

export class DefaultPropPositioner {
	private locationPointsCache: Record<string, GridPoint> = {};

	constructor(
		private gridData: GridData,
		private gridMode: string,
		private gridWidth: number,
		private gridHeight: number
	) {}
	private async getSvgCenterPoint(svgPath: string): Promise<{ x: number; y: number } | null> {
		try {
			// Fetch the SVG file
			const response = await fetch(svgPath);
			if (!response.ok) throw new Error(`Failed to load SVG: ${svgPath}`);

			// Parse the SVG content
			const svgText = await response.text();
			const parser = new DOMParser();
			const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');

			// Find the 'centerPoint' element
			const centerElement = svgDoc.getElementById('centerPoint');
			if (!centerElement) {
				console.warn(`No 'centerPoint' found in SVG: ${svgPath}`);
				return null;
			}

			// Extract the x and y attributes
			const x = parseFloat(centerElement.getAttribute('cx') || '0');
			const y = parseFloat(centerElement.getAttribute('cy') || '0');

			return { x, y };
		} catch (error) {
			console.error(`Error parsing SVG for center point: ${error}`);
			return null;
		}
	}

	public async setToDefaultPosition(prop: PropInterface): Promise<void> {
		// Retrieve and cache the SVG center point
		prop.svgCenter = await this.getSvgCenterPoint(`/images/props/${prop.propType}.svg`);

		// Place the prop
		this.placePropAtHandPoint(prop);
	}

	private placePropAtHandPoint(prop: PropInterface): void {
		const pointName = `${prop.loc}_${this.gridMode}_hand_point`;
		console.debug(`Looking for point: ${pointName}`);
		// log the prop loc
		console.log(`Prop loc: ${prop.loc}`);
		const gridPoint = this.getGridPoint(pointName, false);
		console.debug(`Grid point for ${prop.propType}:`, gridPoint);
		const handPoint = gridPoint?.coordinates || { x: 0, y: 0 };
		const scaleFactorX = this.gridWidth / 950;
		const scaleFactorY = this.gridHeight / 950;

		const scaledHandPoint = {
			x: handPoint.x * scaleFactorX,
			y: handPoint.y * scaleFactorY
		};

		const centerPoint = prop.svgCenter || { x: 0, y: 0 };
		const offset = {
			x: scaledHandPoint.x - centerPoint.x,
			y: scaledHandPoint.y - centerPoint.y
		};
		console.debug('Prop SVG center point:', centerPoint);

		prop.coords = {
			x: offset.x,
			y: offset.y
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
