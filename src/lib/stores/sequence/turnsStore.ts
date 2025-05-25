import { writable } from 'svelte/store';

export type Direction = 'cw' | 'ccw';

export interface TurnsData {
	redTurns: number;
	blueTurns: number;
	redDirection: Direction;
	blueDirection: Direction;
}

export interface TurnsState {
	data: TurnsData;
	isEditing: boolean;
	selectedColor: 'red' | 'blue' | null;
}

const initialState: TurnsState = {
	data: {
		redTurns: 0,
		blueTurns: 0,
		redDirection: 'cw',
		blueDirection: 'cw'
	},
	isEditing: false,
	selectedColor: null
};

function createTurnsStore() {
	const { subscribe, set, update } = writable<TurnsState>(initialState);

	return {
		subscribe,
		set,
		update,

		// Actions
		setTurns: (color: 'red' | 'blue', turns: number) => {
			update((state) => ({
				...state,
				data: {
					...state.data,
					[`${color}Turns`]: turns
				}
			}));
		},

		setDirection: (color: 'red' | 'blue', direction: Direction) => {
			update((state) => ({
				...state,
				data: {
					...state.data,
					[`${color}Direction`]: direction
				}
			}));
		},

		setEditing: (isEditing: boolean) => {
			update((state) => ({
				...state,
				isEditing
			}));
		},

		setSelectedColor: (color: 'red' | 'blue' | null) => {
			update((state) => ({
				...state,
				selectedColor: color
			}));
		},

		reset: () => {
			set(initialState);
		}
	};
}

export const turnsStore = createTurnsStore();
