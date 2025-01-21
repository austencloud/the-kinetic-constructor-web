import type { GridData, GridPoint } from '../../Grid/GridInterface';
import type { PropInterface } from '../PropInterface';

export class DefaultPropPositioner {
	private locationPointsCache: Record<string, GridPoint> = {};

	constructor(private gridData: GridData, private gridMode: string) {}

	public async setToDefaultPosition(propData: PropInterface): Promise<void> {
		// Retrieve the center point from the prop's SVG
		propData.svgCenter = await this.getSvgCenterPoint(`/images/props/${propData.propType}.svg`);

		// Place the prop at the appropriate hand point
		this.placePropAtHandPoint(propData);
	}

	private placePropAtHandPoint(prop: PropInterface): void {
		const pointName = `${prop.loc}_${this.gridMode}_hand_point`;
		console.debug(`Looking for point: ${pointName}`);
	
		const gridPoint = this.getGridPoint(pointName, false);
		if (!gridPoint || !gridPoint.coordinates) {
			console.error(`Invalid grid point for ${pointName}`);
			return;
		}
	
		const handPoint = gridPoint.coordinates;
		const centerPoint = prop.svgCenter || { x: 0, y: 0 };
		prop.coords = {
			x: handPoint.x - centerPoint.x,
			y: handPoint.y - centerPoint.y,
		};
	
		console.debug(`Placed prop '${prop.propType}' at coordinates:`, prop.coords);
	}
	

	private async getSvgCenterPoint(svgPath: string): Promise<{ x: number; y: number } | null> {
		try {
			const response = await fetch(svgPath);
			if (!response.ok) throw new Error(`Failed to load SVG: ${svgPath}`);

			const svgText = await response.text();
			const parser = new DOMParser();
			const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');

			const centerElement = svgDoc.getElementById('centerPoint');
			if (centerElement) {
				const x = parseFloat(centerElement.getAttribute('cx') || '0');
				const y = parseFloat(centerElement.getAttribute('cy') || '0');
				return { x, y };
			}
		} catch (error) {
			console.error(`Error parsing SVG center point: ${error}`);
		}
		return null;
	}

	private getGridPoint(pointName: string, strict: boolean): GridPoint | undefined {
		console.debug('Fetching grid point:', pointName);
		
		const gridPoints = strict
			? this.gridData.allHandPointsStrict
			: this.gridData.allHandPointsNormal;
		const gridPoint = gridPoints[pointName];
	
		if (!gridPoint) {
			console.warn(`Grid point '${pointName}' not found.`);
		}
		return gridPoint;
	}
	
}
