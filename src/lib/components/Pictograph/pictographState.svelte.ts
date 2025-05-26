// src/lib/components/Pictograph/pictographState.ts
import type { PictographData } from '$lib/types/PictographData';
import type { PropData } from '../objects/Prop/PropData';
import type { ArrowData } from '../objects/Arrow/ArrowData';
import type { GridData } from '../objects/Grid/GridData';
import type { PictographService } from './PictographService';
import { defaultPictographData } from './utils/defaultPictographData';
import type { PictographDataSnapshot } from './utils/dataComparison';

export interface IPictographState {
	pictographData: PictographData;
	currentState: string; // Renamed from 'state' to avoid conflict
	errorMessage: string | null;
	gridData: GridData | null;
	redPropData: PropData | null;
	bluePropData: PropData | null;
	redArrowData: ArrowData | null;
	blueArrowData: ArrowData | null;
	loadedComponents: Set<string>;
	requiredComponents: string[];
	totalComponentsToLoad: number;
	componentsLoadedCount: number; // Renamed from 'componentsLoaded'
	renderCount: number;
	loadProgress: number;
	service: PictographService | null;
	lastDataSnapshot: PictographDataSnapshot | null;
}

export function createPictographState(initialData?: PictographData): {
	state: IPictographState;
	updatePictographData: (data: PictographData) => void;
	updateCurrentState: (state: string) => void;
	setError: (error: string | null) => void;
	setGridData: (data: GridData | null) => void;
	setRedPropData: (data: PropData | null) => void;
	setBluePropData: (data: PropData | null) => void;
	setRedArrowData: (data: ArrowData | null) => void;
	setBlueArrowData: (data: ArrowData | null) => void;
	addLoadedComponent: (component: string) => void;
	setRequiredComponents: (components: string[]) => void;
	incrementRenderCount: () => void;
	updateLoadProgress: () => void;
	setService: (service: PictographService | null) => void;
	setLastDataSnapshot: (snapshot: PictographDataSnapshot | null) => void;
	reset: () => void;
} {
	let state = $state<IPictographState>({
		pictographData: initialData || defaultPictographData,
		currentState: 'initializing',
		errorMessage: null,
		gridData: null,
		redPropData: null,
		bluePropData: null,
		redArrowData: null,
		blueArrowData: null,
		loadedComponents: new Set<string>(),
		requiredComponents: ['grid'],
		totalComponentsToLoad: 1,
		componentsLoadedCount: 0,
		renderCount: 0,
		loadProgress: 0,
		service: null,
		lastDataSnapshot: null
	});

	const initialState = { ...state };

	return {
		get state() {
			return state;
		},
		updatePictographData: (data: PictographData) => {
			state.pictographData = data;
		},
		updateCurrentState: (newState: string) => {
			state.currentState = newState;
		},
		setError: (error: string | null) => {
			state.errorMessage = error;
		},
		setGridData: (data: GridData | null) => {
			state.gridData = data;
		},
		setRedPropData: (data: PropData | null) => {
			state.redPropData = data;
		},
		setBluePropData: (data: PropData | null) => {
			state.bluePropData = data;
		},
		setRedArrowData: (data: ArrowData | null) => {
			state.redArrowData = data;
		},
		setBlueArrowData: (data: ArrowData | null) => {
			state.blueArrowData = data;
		},
		addLoadedComponent: (component: string) => {
			state.loadedComponents.add(component);
			state.componentsLoadedCount = state.loadedComponents.size;
		},
		setRequiredComponents: (components: string[]) => {
			state.requiredComponents = components;
			state.totalComponentsToLoad = components.length;
		},
		incrementRenderCount: () => {
			state.renderCount++;
		},
		updateLoadProgress: () => {
			state.loadProgress =
				state.totalComponentsToLoad > 0
					? (state.componentsLoadedCount / state.totalComponentsToLoad) * 100
					: 0;
		},
		setService: (service: PictographService | null) => {
			state.service = service;
		},
		setLastDataSnapshot: (snapshot: PictographDataSnapshot | null) => {
			state.lastDataSnapshot = snapshot;
		},
		reset: () => {
			state = { ...initialState };
		}
	};
}

// It might be beneficial to also move functions that primarily interact with this state here.
// For example, functions to reset state, update specific parts of the state, etc.
// For now, we'll keep it focused on the state variables themselves.
