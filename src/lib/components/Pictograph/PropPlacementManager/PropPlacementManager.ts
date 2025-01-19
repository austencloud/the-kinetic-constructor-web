import { BetaPropDirectionCalculator, type Direction } from './BetaPropDirectionCalculator';

export class PropPlacementManager {
	private directionCalculator: BetaPropDirectionCalculator;

	constructor() {
		this.directionCalculator = new BetaPropDirectionCalculator();
	}

	/**
	 * Updates all prop positions using the appropriate logic (default or beta).
	 * @param props List of props in the pictograph
	 */
	public updatePropPositions(props: any[]): void {
		props.forEach((prop) => {
			if (prop.isBeta) {
				this.positionBetaProp(prop);
			} else {
				this.positionDefaultProp(prop);
			}
		});
	}

	private positionBetaProp(prop: any): void {
		const direction = this.directionCalculator.getDir(prop.motion);
		if (direction) {
			const position = this.calculatePositionFromDirection(prop.position, direction);
			prop.position = position;
		}
	}

	private positionDefaultProp(prop: any): void {
		// Example logic for default positioning
		prop.position = { x: 100, y: 100 }; // Replace with actual logic
	}

	private calculatePositionFromDirection(
		position: { x: number; y: number },
		direction: Direction
	): { x: number; y: number } {
		const offset = 50; // Example offset
		const movementMap = {
			up: { x: 0, y: -offset },
			down: { x: 0, y: offset },
			left: { x: -offset, y: 0 },
			right: { x: offset, y: 0 },
			upright: { x: offset, y: -offset },
			downleft: { x: -offset, y: offset },
			downright: { x: offset, y: offset },
			upleft: { x: -offset, y: -offset }
		};
		const movement = movementMap[direction] || { x: 0, y: 0 };
		return {
			x: position.x + movement.x,
			y: position.y + movement.y
		};
	}
}
