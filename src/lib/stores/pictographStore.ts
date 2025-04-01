// src/lib/stores/pictographStore.ts
import { writable } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';

// Define the structure of the pictograph store state
export interface PictographStoreState {
	status: 'idle' | 'loading' | 'complete' | 'error';
	data: PictographData | null;
	error: Error | null;
	loadProgress: number;
	components: {
		grid: boolean;
		redProp: boolean;
		blueProp: boolean;
		redArrow: boolean;
		blueArrow: boolean;
	};
}

function createPictographStore() {
	const { subscribe, set, update } = writable<PictographStoreState>({
		status: 'idle',
		data: null,
		error: null,
		loadProgress: 0,
		components: {
			grid: false,
			redProp: false,
			blueProp: false,
			redArrow: false,
			blueArrow: false
		}
	});

	return {
		subscribe,

		// Update the pictograph data
		setData: (data: PictographData) => update((state) => ({ ...state, data, status: 'loading' })),

		// Mark a specific component as loaded
		updateComponentLoaded: (component: keyof PictographStoreState['components']) =>
			update((state) => {
				const updatedComponents = {
					...state.components,
					[component]: true
				};

				const loadedCount = Object.values(updatedComponents).filter(Boolean).length;
				const totalComponents = Object.keys(updatedComponents).length;

				return {
					...state,
					components: updatedComponents,
					loadProgress: Math.floor((loadedCount / totalComponents) * 100),
					status: loadedCount === totalComponents ? 'complete' : 'loading'
				};
			}),

		// Set an error state
		setError: (error: Error) =>
			update((state) => ({
				...state,
				status: 'error',
				error,
				loadProgress: 0
			})),

		// Update grid data
		updateGridData: (gridData: GridData) =>
			update((state) => {
				if (state.data) {
					return {
						...state,
						data: { ...state.data, gridData },
						components: { ...state.components, grid: true }
					};
				}
				return state;
			}),

		// Update prop data
		updatePropData: (color: 'red' | 'blue', propData: PropData) =>
			update((state) => {
				if (state.data) {
					const key = color === 'red' ? 'redPropData' : 'bluePropData';
					const componentKey = color === 'red' ? 'redProp' : 'blueProp';

					return {
						...state,
						data: {
							...state.data,
							[key]: propData
						},
						components: {
							...state.components,
							[componentKey]: true
						}
					};
				}
				return state;
			}),

		// Update arrow data
		updateArrowData: (color: 'red' | 'blue', arrowData: ArrowData) =>
			update((state) => {
				if (state.data) {
					const key = color === 'red' ? 'redArrowData' : 'blueArrowData';
					const componentKey = color === 'red' ? 'redArrow' : 'blueArrow';

					return {
						...state,
						data: {
							...state.data,
							[key]: arrowData
						},
						components: {
							...state.components,
							[componentKey]: true
						}
					};
				}
				return state;
			}),

		// Reset the store to initial state
		reset: () =>
			set({
				status: 'idle',
				data: null,
				error: null,
				loadProgress: 0,
				components: {
					grid: false,
					redProp: false,
					blueProp: false,
					redArrow: false,
					blueArrow: false
				}
			})
	};
}

export const pictographStore = createPictographStore();
