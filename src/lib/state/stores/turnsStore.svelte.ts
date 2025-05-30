/**
 * Turns Store - Svelte 5 Runes Implementation
 */

export type Direction = 'clockwise' | 'counterclockwise' | 'none';

interface TurnsState {
	direction: Direction;
	intensity: number;
}

function createTurnsStore() {
	let direction = $state<Direction>('none');
	let intensity = $state(1);

	return {
		get direction() { return direction; },
		get intensity() { return intensity; },
		
		setDirection(newDirection: Direction) {
			direction = newDirection;
		},
		
		setIntensity(newIntensity: number) {
			intensity = newIntensity;
		},
		
		reset() {
			direction = 'none';
			intensity = 1;
		}
	};
}

export const turnsStore = createTurnsStore();
