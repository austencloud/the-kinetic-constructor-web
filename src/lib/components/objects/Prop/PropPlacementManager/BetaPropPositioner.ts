import { BetaPropDirectionCalculator } from './BetaPropDirectionCalculator';
import type { PictographData } from '$lib/types/PictographData';
import type { Direction } from '$lib/types/Types';
import type { PropData } from '$lib/components/objects/Prop/PropData';

export class BetaPropPositioner {
	private dirCalculator: BetaPropDirectionCalculator;

	constructor(private pictographData: PictographData) {
		this.dirCalculator = new BetaPropDirectionCalculator(this.pictographData);
	}

	public reposition(props: PropData[]): void {
		if (!props || props.length === 0) {
			console.warn('No props to reposition');
			return;
		}

		// Store original positions for debugging
		const originalPositions = props.map((prop) => ({
			id: prop.id,
			color: prop.color,
			coords: { ...prop.coords }
		}));

		// Apply repositioning to each prop
		props.forEach((prop) => {
			const direction = this.dirCalculator.getDirection(prop);

			if (direction) {
				const oldCoords = { ...prop.coords };
				const newCoords = this.calculateNewCoords(oldCoords, direction);
				prop.coords = JSON.parse(JSON.stringify(newCoords));


			} else {
				console.warn(`No direction determined for ${prop.color} prop`);
			}
		});

		// Verify positions were changed
		const newPositions = props.map((prop) => ({
			id: prop.id,
			color: prop.color,
			coords: { ...prop.coords }
		}));

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

		// Return a new object rather than modifying the original
		return {
			x: position.x + movement.x,
			y: position.y + movement.y
		};
	}
}
