// src/lib/stores/pictograph/storeFactory.ts
import { writable, derived, get, type Readable } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';

export interface PictographLoadingState {
	status:
		| 'idle'
		| 'initializing'
		| 'grid_loading'
		| 'props_loading'
		| 'arrows_loading'
		| 'complete'
		| 'error';
	loadProgress: number;
	components: {
		grid: boolean;
		redProp: boolean;
		blueProp: boolean;
		redArrow: boolean;
		blueArrow: boolean;
	};
	error: { message: string; component?: string; timestamp: number } | null;
}

export interface PictographStoreState {
	loading: PictographLoadingState;
	data: PictographData;
}

export interface PictographStores {
	// Base stores
	state: Readable<PictographStoreState>;

	// Derived stores
	isComplete: Readable<boolean>;
	isLoading: Readable<boolean>;
	hasError: Readable<boolean>;

	// Action creators
	actions: {
		updateData(updates: Partial<PictographData>): void;
		setError(message: string, component?: string): void;
		updateGridData(gridData: GridData): void;
		updatePropData(color: 'red' | 'blue', propData: PropData): void;
		updateArrowData(color: 'red' | 'blue', arrowData: ArrowData): void;
		reset(): void;
	};
}

/**
 * Creates a complete set of stores and actions for managing a single pictograph
 * This factory pattern ensures related stores stay in sync and encapsulates
 * all the logic for managing a pictograph's state.
 */
export function createPictographStores(initialData: PictographData): PictographStores {
	// Initial loading state
	const initialLoadingState: PictographLoadingState = {
		status: 'idle',
		loadProgress: 0,
		components: {
			grid: false,
			redProp: false,
			blueProp: false,
			redArrow: false,
			blueArrow: false
		},
		error: null
	};

	// Create the main writable store
	const stateStore = writable<PictographStoreState>({
		loading: initialLoadingState,
		data: initialData
	});

	// Helper function to transition state
	function transitionTo(newStatus: PictographLoadingState['status'], reason?: string) {
		stateStore.update((state) => {
			if (state.loading.status === newStatus) return state;

			return {
				...state,
				loading: {
					...state.loading,
					status: newStatus
				}
			};
		});
	}

	// Calculate loading progress based on component state
	function calculateProgress(components: Record<string, boolean>): number {
		const loadedCount = Object.values(components).filter(Boolean).length;
		const totalComponents = Object.keys(components).length;
		return Math.floor((loadedCount / totalComponents) * 100);
	}

	// Derived stores
	const isComplete = derived(stateStore, ($state) => $state.loading.status === 'complete');

	const isLoading = derived(
		stateStore,
		($state) => $state.loading.status !== 'complete' && $state.loading.status !== 'error'
	);

	const hasError = derived(stateStore, ($state) => $state.loading.status === 'error');

	// Actions to manipulate the store
	const actions = {
		updateData: (updates: Partial<PictographData>) => {
			stateStore.update((state) => ({
				...state,
				data: {
					...state.data,
					...updates
				}
			}));
		},

		setError: (message: string, component?: string) => {
			const timestamp = Date.now();
			transitionTo('error', message);

			stateStore.update((state) => ({
				...state,
				loading: {
					...state.loading,
					error: { message, component, timestamp },
					loadProgress: 0
				}
			}));
		},

		updateGridData: (gridData: GridData) => {
			stateStore.update((state) => {
				// Update component status
				const updatedComponents = {
					...state.loading.components,
					grid: true
				};

				// Calculate new progress
				const newProgress = calculateProgress(updatedComponents);

				// Determine if all components are loaded
				const allLoaded = Object.values(updatedComponents).every(Boolean);

				// Update state
				return {
					...state,
					data: {
						...state.data,
						gridData
					},
					loading: {
						...state.loading,
						components: updatedComponents,
						loadProgress: newProgress,
						status: allLoaded ? 'complete' : 'props_loading'
					}
				};
			});
		},

		updatePropData: (color: 'red' | 'blue', propData: PropData) => {
			stateStore.update((state) => {
				// Determine which component key to update
				const componentKey = color === 'red' ? 'redProp' : 'blueProp';
				const dataKey = color === 'red' ? 'redPropData' : 'bluePropData';

				// Update component status
				const updatedComponents = {
					...state.loading.components,
					[componentKey]: true
				};

				// Calculate new progress
				const newProgress = calculateProgress(updatedComponents);

				// Determine if all components are loaded
				const allLoaded = Object.values(updatedComponents).every(Boolean);

				// Update state
				return {
					...state,
					data: {
						...state.data,
						[dataKey]: propData
					},
					loading: {
						...state.loading,
						components: updatedComponents,
						loadProgress: newProgress,
						status: allLoaded ? 'complete' : 'arrows_loading'
					}
				};
			});
		},

		updateArrowData: (color: 'red' | 'blue', arrowData: ArrowData) => {
			stateStore.update((state) => {
				// Determine which component key to update
				const componentKey = color === 'red' ? 'redArrow' : 'blueArrow';
				const dataKey = color === 'red' ? 'redArrowData' : 'blueArrowData';

				// Update component status
				const updatedComponents = {
					...state.loading.components,
					[componentKey]: true
				};

				// Calculate new progress
				const newProgress = calculateProgress(updatedComponents);

				// Determine if all components are loaded
				const allLoaded = Object.values(updatedComponents).every(Boolean);

				// Update state
				return {
					...state,
					data: {
						...state.data,
						[dataKey]: arrowData
					},
					loading: {
						...state.loading,
						components: updatedComponents,
						loadProgress: newProgress,
						status: allLoaded ? 'complete' : state.loading.status
					}
				};
			});
		},

		reset: () => {
			stateStore.set({
				loading: initialLoadingState,
				data: initialData
			});
		}
	};

	// Return the store and its associated utilities
	return {
		state: stateStore,
		isComplete,
		isLoading,
		hasError,
		actions
	};
}

/**
 * Example usage:
 *
 * // Component setup
 * const pictograph = createPictographStores(initialPictographData);
 *
 * // Subscribe to loading state
 * $: isLoading = $pictograph.isLoading;
 *
 * // Update data
 * function handleGridLoaded(gridData) {
 *   pictograph.actions.updateGridData(gridData);
 * }
 *
 * // Access data
 * $: currentData = $pictograph.state.data;
 */
