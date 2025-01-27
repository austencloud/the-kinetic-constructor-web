import { ANTI, DASH, FLOAT, PRO, STATIC } from '$lib/types/Constants';
import type { PictographInterface } from '$lib/types/PictographInterface';
import type { GridData } from '../../Grid/GridData';
import type { ArrowInterface } from '../ArrowInterface';


export class ArrowInitialPosCalculator {
	private pictographData: PictographInterface;
	private gridData: GridData;

	constructor(pictographData: PictographInterface, gridData: GridData) {
		this.pictographData = pictographData;
		this.gridData = gridData;
	}

	public getInitialCoords(arrow: ArrowInterface): { x: number; y: number } {
		switch (arrow.motion.motionType) {
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

	private getShiftCoords(arrow: ArrowInterface): { x: number; y: number } {
		const pointName = `${arrow.loc}_${this.pictographData.gridMode || 'diamond'}_layer2_point`;

		const shiftCoord = this.getShiftCoordFromGrid(pointName);
		if (!shiftCoord) {
			console.warn(`Shift coordinate for '${pointName}' not found.`);
			return { x: 0, y: 0 };
		}
		return shiftCoord;
	}

	private getStaticDashCoords(arrow: ArrowInterface): { x: number; y: number } {
		const pointName = `${arrow.loc}_${this.pictographData.gridMode || 'diamond'}_hand_point`;

		const staticCoord = this.getStaticCoordFromGrid(pointName);
		if (!staticCoord) {
			console.warn(`Static/Dash coordinate for '${pointName}' not found.`);
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
