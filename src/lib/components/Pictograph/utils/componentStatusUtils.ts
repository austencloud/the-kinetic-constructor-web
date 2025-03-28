import type { RenderStage } from '../constants/trackingConstants';
import type { ComponentLoadingStatus, ComponentPositioningStatus } from '../constants/trackingConstants';

export function checkAllComponentsLoaded(
	componentLoading: ComponentLoadingStatus
): boolean {
	return Object.values(componentLoading).every((isLoaded) => isLoaded === true);
}

export function checkAllComponentsPositioned(
	componentPositioning: ComponentPositioningStatus
): boolean {
	return Object.values(componentPositioning).every((isPositioned) => isPositioned === true);
}

export function determineNextStage(
	currentStage: RenderStage,
	allLoaded: boolean,
	allPositioned: boolean
): RenderStage {
	if (allPositioned) {
		return 'complete';
	}

	if (allLoaded) {
		if (currentStage === 'grid_ready' || currentStage === 'loading') {
			return 'components_ready';
		}
		if (currentStage === 'components_ready' || currentStage === 'positioning') {
			return currentStage;
		}
	}

	if (!allLoaded && (currentStage === 'grid_ready' || currentStage === 'loading')) {
		return currentStage;
	}

	return currentStage;
}

export function handleComponentError(
	componentKey: keyof ComponentLoadingStatus,
	currentLoadingStatus: ComponentLoadingStatus
): ComponentLoadingStatus {
	const updatedStatus = { ...currentLoadingStatus };

	if (componentKey in updatedStatus) {
		updatedStatus[componentKey] = true;
		console.warn(`🚦 ComponentStatusUtil: Marked '${componentKey}' as loaded after an error to allow progression.`);
	} else {
		console.error(`❌ ComponentStatusUtil: Tried to handle error for unknown component key: ${componentKey}`);
	}
	return updatedStatus;
}
