// src/lib/components/PlacementManagers/ArrowPlacementManager/DirectionalTupleManager.ts
import {
	generateStaticDirectionTuples,
	generateDashDirectionTuples,
	generateShiftDirectionTuples
} from './directionTuples';

import { ANTI, DASH, FLOAT, PRO, STATIC } from '$lib/types/Constants';
import type { Motion } from '$lib/components/objects/Motion/Motion';
import type { GridMode, PropRotDir, ShiftHandRotDir, MotionType } from '$lib/types/Types';

export class DirectionalTupleManager {
	constructor(private motion: Motion) {}

	public generateDirectionalTuples(x: number, y: number): Array<[number, number]> {
		switch (this.motion.motionType) {
			case PRO:
			case ANTI:
			case FLOAT:
				return generateShiftDirectionTuples(
					x,
					y,
					this.motion.motionType as MotionType,
					this.motion.propRotDir as PropRotDir,
					this._getGridMode(),
					this.motion.handRotDirCalculator?.getHandRotDir(
						this.motion.startLoc,
						this.motion.endLoc
					) as ShiftHandRotDir | null
				);
			case DASH:
				return generateDashDirectionTuples(
					x,
					y,
					this.motion.propRotDir as PropRotDir,
					this._getGridMode(),
					this.motion.startOri
				);
			case STATIC:
				return generateStaticDirectionTuples(
					x,
					y,
					this.motion.propRotDir as PropRotDir,
					this._getGridMode()
				);
			default:
				return [];
		}
	}

	private _getGridMode(): GridMode {
		const mode = this.motion.gridMode || 'diamond';
		if (mode !== 'box' && mode !== 'diamond') return 'diamond';
		return mode as GridMode;
	}
}