// src/lib/components/Pictograph/utils/componentStatusUtils.ts
import type { RenderStage } from '../constants/trackingConstants';
import type { ComponentLoadingStatus, ComponentPositioningStatus } from '../constants/trackingConstants'; // Use types from constants

/**
 * Checks if all components tracked in the `ComponentLoadingStatus` object
 * are marked as loaded (`true`).
 *
 * @param componentLoading - The status object tracking component loading.
 * @returns `true` if all components are loaded, `false` otherwise.
 */
export function checkAllComponentsLoaded(
	componentLoading: ComponentLoadingStatus
): boolean {
	// Assumes all keys in DEFAULT_COMPONENT_LOADING are relevant
	return Object.values(componentLoading).every((isLoaded) => isLoaded === true);
}

/**
 * Checks if all components tracked in the `ComponentPositioningStatus` object
 * are marked as positioned (`true`).
 *
 * @param componentPositioning - The status object tracking component positioning.
 * @returns `true` if all components are positioned, `false` otherwise.
 */
export function checkAllComponentsPositioned(
	componentPositioning: ComponentPositioningStatus
): boolean {
	// Assumes all keys in DEFAULT_COMPONENT_POSITIONING are relevant
	return Object.values(componentPositioning).every((isPositioned) => isPositioned === true);
}

/**
 * Determines the next logical `RenderStage` based on the current stage
 * and the loading/positioning completion status.
 *
 * @param currentStage - The current render stage.
 * @param allLoaded - Flag indicating if all components have finished loading.
 * @param allPositioned - Flag indicating if all components have finished positioning.
 * @returns The calculated next render stage.
 */
export function determineNextStage(
	currentStage: RenderStage,
	allLoaded: boolean,
	allPositioned: boolean
): RenderStage {

    // Final state: If everything is positioned, we are 'complete', regardless of current stage.
	if (allPositioned) {
		return 'complete';
	}

    // Intermediate state: If all components are loaded but not yet positioned.
	if (allLoaded) {
        // If we were waiting for the grid or loading components, and now they are all loaded,
        // the next step is to be ready for positioning.
        if (currentStage === 'grid_ready' || currentStage === 'loading') {
		    return 'components_ready';
        }
        // If we are already in 'components_ready' or 'positioning', stay there until 'allPositioned' becomes true.
        if (currentStage === 'components_ready' || currentStage === 'positioning') {
            return currentStage; // Stay in current stage
        }
	}

    // If not all loaded yet, and not initializing, stay in grid_ready or loading
    if (!allLoaded && (currentStage === 'grid_ready' || currentStage === 'loading')) {
        return currentStage;
    }

    // Default: No change from current stage if none of the above conditions are met.
    // This covers 'initializing' -> 'loading'/'grid_ready' transitions handled elsewhere,
    // and cases where the stage shouldn't change yet.
	return currentStage;
}

/**
 * Handles a component error during the loading phase by marking that specific
 * component as 'loaded' (`true`) in the status object. This allows the overall
 * loading process to potentially complete, even if one component failed.
 *
 * @param componentKey - The key (e.g., 'redProp', 'grid') of the component that failed.
 * @param currentLoadingStatus - The current loading status object.
 * @returns A *new* loading status object with the failed component marked as loaded.
 */
export function handleComponentError(
	componentKey: keyof ComponentLoadingStatus,
	currentLoadingStatus: ComponentLoadingStatus
): ComponentLoadingStatus {
	// Return a new object to avoid mutating the original state directly
	const updatedStatus = { ...currentLoadingStatus };

	if (componentKey in updatedStatus) {
		updatedStatus[componentKey] = true; // Mark as loaded despite the error
		console.warn(`🚦 ComponentStatusUtil: Marked '${componentKey}' as loaded after an error to allow progression.`);
	} else {
        console.error(`❌ ComponentStatusUtil: Tried to handle error for unknown component key: ${componentKey}`);
    }

	return updatedStatus;
}