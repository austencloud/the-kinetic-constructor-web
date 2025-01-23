// ArrowInitialPosCalculator.ts
import type { ArrowInterface } from '../ArrowInterface';

export class ArrowInitialPosCalculator {
	constructor(/* pass references, e.g. a "pictographData" or "gridData" */) {}

	public getInitialCoords(arrow: ArrowInterface): { x: number; y: number } {
		// If you have multiple motion types, replicate the Python pattern
		switch (arrow.motion.motionType) {
			case 'pro':
			case 'anti':
			case 'float':
				return this.getShiftCoords(arrow);
			case 'static':
			case 'dash':
				return this.getStaticCoords(arrow);
			default:
				// fallback
				return { x: 0, y: 0 };
		}
	}

	private getShiftCoords(arrow: ArrowInterface): { x: number; y: number } {
		// This matches your Python `_get_shift_coords()`
		// In Python, you do something like:
		//     point_name = f"{arrow.loc}_{arrow.pictograph.grid_mode}_layer2_point"
		// Then you look up `grid_data.get_shift_coord(point_name)`.
		//
		// So in TS, adapt as needed:
		const pointName = `${arrow.loc}_${arrow.pictograph?.gridMode || 'diamond'}_layer2_point`;

		// Let's assume you have a function or data that fetches this shift coordinate:
		const shiftCoord = this.getShiftCoordFromGrid(pointName);
		if (!shiftCoord) {
			console.warn(`Shift coordinate for '${pointName}' not found.`);
			return { x: 0, y: 0 };
		}
		return shiftCoord;
	}

	private getStaticCoords(arrow: ArrowInterface): { x: number; y: number } {
		// This matches your Python `_get_static_coords()`
		const pointName = `${arrow.loc}_${arrow.pictograph?.gridMode || 'diamond'}_hand_point`;
		const staticCoord = this.getStaticCoordFromGrid(pointName);
		if (!staticCoord) {
			console.warn(`Static coordinate for '${pointName}' not found.`);
			return { x: 0, y: 0 };
		}
		return staticCoord;
	}

	// Example stubs:
	private getShiftCoordFromGrid(pointName: string): { x: number; y: number } | null {
		// Possibly read from a big map or something
		// For example, if you have gridData, you can do:
		//    return gridData.getShiftCoord(pointName);
		// For now, just return dummy
		return null;
	}

	private getStaticCoordFromGrid(pointName: string): { x: number; y: number } | null {
		// same idea
		return null;
	}
}
