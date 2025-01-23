import { BetaPropDirectionCalculator } from './BetaPropDirectionCalculator';
import type { Direction } from '../../Motion/MotionInterface';
import type { PropInterface } from '../PropInterface';
import type { PictographInterface } from '$lib/types/PictographInterface';

export class BetaPropPositioner {
	private dirCalculator: BetaPropDirectionCalculator;
	constructor(private pictographData: PictographInterface) {
		this.dirCalculator = new BetaPropDirectionCalculator(this.pictographData);
	}

	public reposition(props: PropInterface[]): void {
		props.forEach((prop) => {
			const direction = this.dirCalculator.getDirection(prop);
			if (direction) {
				prop.coords = this.calculateNewCoords(prop.coords, direction);
			}
		});
	}

	private calculateNewCoords(
		position: { x: number; y: number },
		direction: Direction
	): { x: number; y: number } {
		const offset = 25; // Example offset
		const movementMap = {
			up: { x: 0, y: -offset },
			down: { x: 0, y: offset },
			left: { x: -offset, y: 0 },
			right: { x: offset, y: 0 },
			upright: { x: offset, y: -offset },
			upleft: { x: -offset, y: -offset },
			downright: { x: offset, y: offset },
			downleft: { x: -offset, y: offset }
		};
		const movement = movementMap[direction] || { x: 0, y: 0 };
		return {
			x: position.x + movement.x,
			y: position.y + movement.y
		};
	}
}
