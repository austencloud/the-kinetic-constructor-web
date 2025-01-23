// ArrowInitialPosCalculator.ts
import { ANTI, DASH, FLOAT, PRO, STATIC } from '$lib/types/Constants';
import type { PictographInterface } from '$lib/types/PictographInterface';
import type { ArrowInterface } from '../ArrowInterface';

export class ArrowInitialPosCalculator {
	private pictographData: PictographInterface;

	constructor(pcitographData: PictographInterface) {
		// You can store the pictograph data if needed
		this.pictographData = pcitographData;
	}

	public getInitialCoords(arrow: ArrowInterface): { x: number; y: number } {
		switch (arrow.motion.motionType) {
			case PRO:
			case ANTI:
			case FLOAT:
				return this.getShiftCoords(arrow);
			case STATIC:
			case DASH:
				return this.getStaticCoords(arrow);
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

	private getStaticCoords(arrow: ArrowInterface): { x: number; y: number } {
		const pointName = `${arrow.loc}_${this.pictographData.gridMode || 'diamond'}_hand_point`;
		const staticCoord = this.getStaticCoordFromGrid(pointName);
		if (!staticCoord) {
			console.warn(`Static coordinate for '${pointName}' not found.`);
			return { x: 0, y: 0 };
		}
		return staticCoord;
	}

	private getShiftCoordFromGrid(pointName: string): { x: number; y: number } | null {

		return null;
	}

	private getStaticCoordFromGrid(pointName: string): { x: number; y: number } | null {
		return null;
	}
}
