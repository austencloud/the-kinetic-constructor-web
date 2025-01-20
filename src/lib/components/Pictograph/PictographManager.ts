import type { PictographInterface } from '$lib/types/PictographInterface';
import type { GridData } from './Grid/GridInterface';
import { Motion } from './Motion/Motion';
import type { MotionInterface } from './Motion/MotionInterface';
import { PropPlacementManager } from './Prop/PropPlacementManager/PropPlacementManager';

export class PictographManager {
	private motions: Motion[] = [];
	private arrows: { motion: Motion; color: 'red' | 'blue' }[] = [];
	private propPlacementManager: PropPlacementManager;

	constructor(
		private pictographData: PictographInterface,
		private gridData: GridData
	) {
		this.propPlacementManager = new PropPlacementManager(pictographData, gridData);
		this.initializeMotions();
		this.initializeComponents();
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

	private initializeComponents(): void {
		this.motions.forEach((motion) => {
			const color = motion.color;
			this.arrows.push({ motion, color });
		});
	}

	public getMotions(): Motion[] {
		return this.motions;
	}

	public getArrows(): { motion: Motion; color: 'red' | 'blue' }[] {
		return this.arrows;
	}

	public getPropPlacementManager(): PropPlacementManager {
		return this.propPlacementManager;
	}
}
