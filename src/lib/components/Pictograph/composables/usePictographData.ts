// src/lib/components/Pictograph/composables/usePictographData.ts
import { get } from 'svelte/store';
import type { PictographData } from '$lib/types/PictographData';
import type { PictographState } from './usePictographState';
import { setupPictographDataSubscription } from '../managers/PictographStateManager';
import {
	initializePictograph,
	createInitializationContext,
	type InitializationContext
} from '../managers/PictographLifecycle';
import { PictographService } from '../PictographService';

export function usePictographData(
	state: PictographState,
	dispatch: (event: string, detail?: any) => void,
	updateComponentsFromData: () => void,
	handleError: (source: string, error: any) => void,
	debug = false
) {
	// Initialize pictograph service
	function initializePictographService(pictographDataStore: any) {
		return new PictographService(get(pictographDataStore));
	}

	// Create initialization context
	function createContext(): InitializationContext {
		return createInitializationContext(
			state.pictographDataStore,
			{
				set: (value) => state.service.set(value),
				update: (updater) => state.service.update(updater),
				subscribe: () => () => {}
			},
			{
				set: (value) => state.state.set(value),
				update: (updater) => state.state.update(updater),
				subscribe: () => () => {}
			},
			{
				set: (value) => state.lastDataSnapshot.set(value),
				update: (updater) => state.lastDataSnapshot.update(updater),
				subscribe: () => () => {}
			},
			initializePictographService,
			handleError
		);
	}

	// Initialize the pictograph
	function initialize() {
		const context = createContext();
		return initializePictograph(context, debug);
	}

	// Set up data subscription
	function setupDataSubscription() {
		return setupPictographDataSubscription(
			state.pictographDataStore,
			get(state.service),
			get(state.lastDataSnapshot),
			updateComponentsFromData,
			dispatch,
			debug
		);
	}

	// Update pictograph data
	function updatePictographData(newData: PictographData) {
		state.pictographDataStore.set(newData);
	}

	return {
		initialize,
		setupDataSubscription,
		updatePictographData
	};
}
