import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import { ANTI, DASH, FLOAT, PRO, STATIC } from '$lib/types/Constants';
import type { PictographData } from '$lib/types/PictographData';

export class ArrowInitialPosCalculator {
	private pictographData: PictographData;
	private gridData: GridData;

	constructor(pictographData: PictographData, gridData: GridData) {
		this.pictographData = pictographData;
		this.gridData = gridData;
	}

	public getInitialCoords(arrow: ArrowData): { x: number; y: number } {
		switch (arrow.motionType) {
			case PRO:
			case ANTI:
			case FLOAT:
				return this.getShiftCoords(arrow);
			case STATIC:
			case DASH:
				return this.getStaticDashCoords(arrow);
			default:
				return { x: 0, y: 0 };
		}
	}

	private getShiftCoords(arrow: ArrowData): { x: number; y: number } {
		const pointName = `${arrow.loc}_${this.pictographData.gridMode || 'diamond'}_layer2_point`;
		let shiftCoord = this.getShiftCoordFromGrid(pointName);

		if (!shiftCoord) {
			console.warn(`Shift coordinate for '${pointName}' not found.`);
			return { x: 0, y: 0 };
		}

		return shiftCoord;
	}

	private getStaticDashCoords(arrow: ArrowData): { x: number; y: number } {
		const pointName = `${arrow.loc}_${this.pictographData.gridMode || 'diamond'}_hand_point`;
		let staticCoord = this.getStaticCoordFromGrid(pointName);

		if (!staticCoord) {
			console.warn(`Static coordinate for '${pointName}' not found.`);
			return { x: 0, y: 0 };
		}

		return staticCoord;
	}

	private getShiftCoordFromGrid(pointName: string): { x: number; y: number } | null {
		const point = this.gridData.allLayer2PointsNormal[pointName];
		return point?.coordinates ?? null;
	}

	private getStaticCoordFromGrid(pointName: string): { x: number; y: number } | null {
		const point = this.gridData.allHandPointsNormal[pointName];
		return point?.coordinates ?? null;
	}
}
