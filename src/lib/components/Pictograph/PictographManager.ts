import type { PictographInterface } from '$lib/types/PictographInterface';
import type { GridData } from './Grid/GridInterface';
import { Motion } from './Motion/Motion';
import { PropPlacementManager } from './Prop/PropPlacementManager/PropPlacementManager';

export class PictographManager {
	private motions: Motion[] = [];
	private propPlacementManager: PropPlacementManager;

	constructor(
		private pictographData: PictographInterface,
		private gridData: GridData
	) {
		this.propPlacementManager = new PropPlacementManager(pictographData, gridData);
		this.initializeMotions();
	}

	private initializeMotions(): void {
		const { redMotionData, blueMotionData } = this.pictographData;

		if (redMotionData && blueMotionData) {
			this.motions = [
				new Motion(redMotionData, this), // Pass the instance of PictographManager
				new Motion(blueMotionData, this),
			];
		}
	}

	public getMotions(): Motion[] {
		return this.motions;
	}

	public getPropPlacementManager(): PropPlacementManager {
		return this.propPlacementManager;
	}
}
