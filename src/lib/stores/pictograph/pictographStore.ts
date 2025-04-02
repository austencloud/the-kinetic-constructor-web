// src/lib/stores/pictographStore.ts
import { writable } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';

export interface PictographStoreState {
	status:
		| 'idle'
		| 'initializing'
		| 'grid_loading'
		| 'props_loading'
		| 'arrows_loading'
		| 'complete'
		| 'error';
	data: PictographData | null;
	error: { message: string; component?: string; timestamp: number } | null;
	loadProgress: number;
	components: {
		grid: boolean;
		redProp: boolean;
		blueProp: boolean;
		redArrow: boolean;
		blueArrow: boolean;
	};
	stateHistory: {
		from: string;
		to: string;
		reason?: string;
		timestamp: number;
	}[];
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
		},
		stateHistory: []
	});

	function transitionTo(newState: PictographStoreState['status'], reason?: string) {
		update((state) => {
			if (state.status === newState) return state;

			const newTransition = {
				from: state.status,
				to: newState,
				reason,
				timestamp: Date.now()
			};

			const updatedHistory = [...state.stateHistory, newTransition].slice(-10);

			return {
				...state,
				status: newState,
				stateHistory: updatedHistory
			};
		});
	}

	function calculateProgress(components: Record<string, boolean>): number {
		const loadedCount = Object.values(components).filter(Boolean).length;
		const totalComponents = Object.keys(components).length;
		return Math.floor((loadedCount / totalComponents) * 100);
	}

	return {
		subscribe,

		setData: (data: PictographData) => {
			transitionTo('initializing', 'Starting to load pictograph');
			update((state) => ({ ...state, data, status: 'grid_loading' }));
		},

		updateComponentLoaded: (component: keyof PictographStoreState['components']) => {
			update((state) => {
				const updatedComponents = {
					...state.components,
					[component]: true
				};
				const newProgress = calculateProgress(updatedComponents);
				const allLoaded = Object.values(updatedComponents).every(Boolean);
				const newState = allLoaded ? 'complete' : state.status;
				if (allLoaded && newState !== 'complete') transitionTo('complete', 'All components loaded');
				return {
					...state,
					components: updatedComponents,
					loadProgress: newProgress,
					status: newState
				};
			});
		},

		setError: (message: string, component?: string) => {
			const timestamp = Date.now();
			transitionTo('error', message);
			update((state) => ({
				...state,
				error: { message, component, timestamp },
				loadProgress: 0
			}));
		},

		updateGridData: (gridData: GridData) => {
			update((state) => {
				if (!state.data) return state;
				transitionTo('props_loading', 'Grid data loaded');
				return {
					...state,
					data: { ...state.data, gridData },
					components: { ...state.components, grid: true }
				};
			});
		},

		updatePropData: (color: 'red' | 'blue', propData: PropData) => {
			update((state) => {
				if (!state.data) return state;
				const key = color === 'red' ? 'redPropData' : 'bluePropData';
				const componentKey = color === 'red' ? 'redProp' : 'blueProp';
				transitionTo('arrows_loading', `${color} prop loaded`);
				return {
					...state,
					data: { ...state.data, [key]: propData },
					components: { ...state.components, [componentKey]: true }
				};
			});
		},

		updateArrowData: (color: 'red' | 'blue', arrowData: ArrowData) => {
			update((state) => {
				if (!state.data) return state;
				const key = color === 'red' ? 'redArrowData' : 'blueArrowData';
				const componentKey = color === 'red' ? 'redArrow' : 'blueArrow';
				return {
					...state,
					data: { ...state.data, [key]: arrowData },
					components: { ...state.components, [componentKey]: true }
				};
			});
		},

		reset: () => {
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
				},
				stateHistory: []
			});
		},

		transitionTo
	};
}

export const pictographStore = createPictographStore();
