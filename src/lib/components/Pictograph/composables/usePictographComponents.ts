// src/lib/components/Pictograph/composables/usePictographComponents.ts
import { get } from 'svelte/store';
import type { PictographState } from './usePictographState';
import { createAndPositionComponents as createAndPositionComponentsUtil } from '../utils/componentPositioning';
import { hasRequiredMotionData as hasRequiredMotionDataUtil } from '../managers/PictographLoadingManager';
import { updateComponentsFromData as updateComponentsFromDataUtil } from '../managers/PictographStateManager';

export function usePictographComponents(state: PictographState, preloadAllSvgs: () => void) {
	function createAndPositionComponents() {
		try {
			const pictographData = get(state.pictographDataStore);
			const service = get(state.service);
			const gridData = get(state.gridData);

			if (!pictographData || !service) return;

			const stateContext = {
				requiredComponents: get(state.requiredComponents),
				totalComponentsToLoad: get(state.totalComponentsToLoad)
			};

			const result = createAndPositionComponentsUtil(
				pictographData,
				service,
				gridData,
				stateContext
			);

			// Update state
			state.requiredComponents.set(stateContext.requiredComponents);
			state.totalComponentsToLoad.set(stateContext.totalComponentsToLoad);
			state.redPropData.set(result.redPropData);
			state.bluePropData.set(result.bluePropData);
			state.redArrowData.set(result.redArrowData);
			state.blueArrowData.set(result.blueArrowData);

			// Preload SVGs
			preloadAllSvgs();
		} catch (error) {
			throw error; // Let the error handler deal with it
		}
	}

	function updateComponentsFromData() {
		try {
			const result = updateComponentsFromDataUtil(
				state.pictographDataStore,
				get(state.service),
				get(state.state),
				get(state.errorMessage),
				get(state.gridData),
				createAndPositionComponents,
				get(state.requiredComponents),
				get(state.loadedComponents),
				hasRequiredMotionDataUtil
			);

			// Update local state
			state.state.set(result.state);
			state.errorMessage.set(result.errorMessage);
			if (result.renderCount > 0) {
				state.renderCount.update((count) => count + result.renderCount);
			}
		} catch (error) {
			throw error; // Let the error handler deal with it
		}
	}

	return {
		createAndPositionComponents,
		updateComponentsFromData
	};
}
