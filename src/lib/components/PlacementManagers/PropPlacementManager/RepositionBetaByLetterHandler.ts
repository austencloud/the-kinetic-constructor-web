// reposition-beta-by-letter-handler.ts
import type { PropData } from '../PropData';
import { BetaPropDirectionCalculator } from './BetaPropDirectionCalculator';
import type { PictographData } from '$lib/types/PictographData';
export default class RepositionBetaByLetterHandler {
	private pictographData: PictographData;
	private directionCalculator: BetaPropDirectionCalculator;
	private offsetCalculator: any; // Would need proper type
	constructor(directionCalculator: BetaPropDirectionCalculator, pictographData: PictographData) {
		this.pictographData = pictographData;
		this.directionCalculator = directionCalculator;
	}

	reposition_G_H(): void {
		const redMotion = this.pictographData.redMotionData;
		const blueMotion = this.pictographData.blueMotionData;
		const redPropData = this.pictographData.redPropData;
		const bluePropData = this.pictographData.bluePropData;
		if (!redMotion || !blueMotion) return;

		if (!redPropData) return;
		const furtherDirection = this.directionCalculator.getDirection(redPropData);
		const otherDirection = furtherDirection
			? this.directionCalculator.getOppositeDirection(furtherDirection)
			: undefined;

		if (furtherDirection) {
			this.moveProp(redPropData, furtherDirection);
		}
		if (bluePropData && otherDirection) {
			this.moveProp(bluePropData, otherDirection);
		}
	}

	reposition_I(): void {
		const proProp = this.pictographData.motions.some((m) => m.motionType === 'pro')
			? this.pictographData.redPropData
			: this.pictographData.bluePropData;

		const antiProp = this.pictographData.motions.some((m) => m.motionType === 'anti')
			? this.pictographData.redPropData
			: this.pictographData.bluePropData;

		const proDirection = this.directionCalculator.getDirection(proProp);
		const antiDirection = proDirection
			? this.directionCalculator.getOppositeDirection(proDirection)
			: undefined;

		if (proDirection) {
			this.moveProp(proProp, proDirection);
		}
		if (antiDirection) {
			this.moveProp(antiProp, antiDirection);
		}
	}

	reposition_J_K_L(): void {
		const redDirection = this.directionCalculator.getDirection(this.pictographData.redPropData);
		const blueDirection = this.directionCalculator.getDirection(this.pictographData.bluePropData);

		if (redDirection && blueDirection) {
			this.moveProp(this.pictographData.redPropData, redDirection);
			this.moveProp(this.pictographData.bluePropData, blueDirection);
		}
	}

	reposition_Y_Z(): void {
		const shiftMotion = this.pictographData.motions.find((m) =>
			['pro', 'anti', 'float'].includes(m.motionType)
		);
		const staticMotion = this.pictographData.motions.find((m) => m.motionType === 'static');

		if (!shiftMotion || !staticMotion) return;

		if (!shiftMotion.prop) return;
		const direction = this.directionCalculator.getDirection(shiftMotion.prop.propData);
		if (!direction) return;

		this.moveProp(this.getPropByColor(shiftMotion.color), direction);
		this.moveProp(
			this.getPropByColor(staticMotion.color),
			this.directionCalculator.getOppositeDirection(direction)
		);
	}

	reposition_β(): void {
		const direction = this.directionCalculator.getDirection(this.pictographData.redPropData);
		if (direction) {
			this.moveProp(this.pictographData.redPropData, direction);
			this.moveProp(
				this.pictographData.bluePropData,
				this.directionCalculator.getOppositeDirection(direction)
			);
		}
	}

	private getPropByColor(color: 'red' | 'blue'): PropData {
		return color === 'red' ? this.pictographData.redPropData : this.pictographData.bluePropData;
	}

	private moveProp(prop: PropData, direction: string): void {
		// Implement actual movement logic using offset calculator
		const newPosition = this.offsetCalculator.calculateNewPositionWithOffset(
			prop.coords,
			direction
		);
		prop.coords = newPosition;
	}
}
