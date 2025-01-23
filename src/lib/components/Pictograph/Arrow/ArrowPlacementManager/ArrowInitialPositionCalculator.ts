// ArrowInitialPosCalculator.ts
import { ANTI, DASH, FLOAT, PRO, STATIC } from '$lib/types/Constants';
import type { PictographInterface } from '$lib/types/PictographInterface';
import type { ArrowInterface } from '../ArrowInterface';
import type { GridData } from '../../Grid/GridInterface';

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
				return this.getStaticCoords(arrow);
			default:
				return { x: 0, y: 0 };
		}
	}

	private getShiftCoords(arrow: ArrowInterface): { x: number; y: number } {
		// Something like "n_diamond_layer2_point" or "ne_box_layer2_point"
		const pointName = `${arrow.loc}_${this.pictographData.gridMode || 'diamond'}_layer2_point`;

		const shiftCoord = this.getShiftCoordFromGrid(pointName);
		if (!shiftCoord) {
			console.warn(`Shift coordinate for '${pointName}' not found.`);
			return { x: 0, y: 0 };
		}
		return shiftCoord;
	}

	private getStaticCoords(arrow: ArrowInterface): { x: number; y: number } {
		// Something like "n_diamond_hand_point" etc.
		const pointName = `${arrow.loc}_${this.pictographData.gridMode || 'diamond'}_hand_point`;

		const staticCoord = this.getStaticCoordFromGrid(pointName);
		if (!staticCoord) {
			console.warn(`Static coordinate for '${pointName}' not found.`);
			return { x: 0, y: 0 };
		}
		return staticCoord;
	}

	private getShiftCoordFromGrid(pointName: string): { x: number; y: number } | null {
		// Many times you’ll store shift coords in `allLayer2PointsStrict`.
		// If you have multiple sets (strict vs normal), pick which one you want.
		// For example:
		const point = this.gridData.allLayer2PointsNormal[pointName];
		return point?.coordinates ?? null;
	}

	private getStaticCoordFromGrid(pointName: string): { x: number; y: number } | null {
		// For static coords, you might store them in `allHandPointsStrict`.
		// If you prefer 'normal', use `allHandPointsNormal`. Adapt as needed.
		const point = this.gridData.allHandPointsStrict[pointName];
		return point?.coordinates ?? null;
	}
}
