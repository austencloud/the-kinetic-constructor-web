// QuadrantIndexHandler.ts
import type { PictographInterface } from '$lib/types/PictographInterface';
import type { GridData } from '../../Grid/GridInterface';
import type { ArrowInterface } from '../ArrowInterface';

export class QuadrantIndexHandler {

	private pictographData: PictographInterface;
	private gridData: GridData;

	constructor(pictographData: any, gridData: any) {
		this.pictographData = pictographData;
		this.gridData = gridData;
	}

	public getQuadrantIndex(arrow: ArrowInterface): number {
		const gridMode = this.pictographData.gridMode || 'diamond';
		const motionType = arrow.motion.motionType;

		// Replace with your actual 4-case checks:
		if (gridMode === 'diamond') {
			if (['pro', 'anti', 'float'].includes(motionType)) {
				return this.diamondShiftQuadrantIndex(arrow.loc ?? '');
			} else if (['static', 'dash'].includes(motionType)) {
				return this.diamondStaticDashQuadrantIndex(arrow.loc ?? '');
			}
		} else if (gridMode === 'box') {
			if (['pro', 'anti', 'float'].includes(motionType)) {
				return this.boxShiftQuadrantIndex(arrow.loc ?? '');
			} else if (['static', 'dash'].includes(motionType)) {
				return this.boxStaticDashQuadrantIndex(arrow.loc ?? '');
			}
		}
		return 0;
	}

	private diamondShiftQuadrantIndex(location: string): number {
		switch (location) {
			case 'ne':
				return 0;
			case 'se':
				return 1;
			case 'sw':
				return 2;
			case 'nw':
				return 3;
			default:
				return 0;
		}
	}

	private diamondStaticDashQuadrantIndex(location: string): number {
		switch (location) {
			case 'n':
				return 0;
			case 'e':
				return 1;
			case 's':
				return 2;
			case 'w':
				return 3;
			default:
				return 0;
		}
	}

	private boxShiftQuadrantIndex(location: string): number {
		// etc.
		return 0;
	}

	private boxStaticDashQuadrantIndex(location: string): number {
		// etc.
		return 0;
	}
}
