// src/lib/components/Pictograph/utils/componentStatusUtils.ts
import type { RenderStage } from '../constants/trackingConstants';

/**
 * Tracks the loading status of individual pictograph components
 */
export type ComponentLoadingStatus = {
  grid: boolean;
  redProp: boolean;
  blueProp: boolean;
  redArrow: boolean;
  blueArrow: boolean;
};

/**
 * Tracks the positioning status of individual pictograph components
 */
export type ComponentPositioningStatus = {
  redProp: boolean;
  blueProp: boolean;
  redArrow: boolean;
  blueArrow: boolean;
};

/**
 * Check if all tracked components are loaded
 * 
 * @param componentLoading - Object tracking loading status of all components
 * @returns true if all components are loaded, false otherwise
 */
export function checkAllComponentsLoaded(
  componentLoading: ComponentLoadingStatus
): boolean {
  return Object.values(componentLoading).every((loaded) => loaded);
}

/**
 * Check if all tracked components are positioned
 * 
 * @param componentPositioning - Object tracking positioning status of all components
 * @returns true if all components are positioned, false otherwise
 */
export function checkAllComponentsPositioned(
  componentPositioning: ComponentPositioningStatus
): boolean {
  return Object.values(componentPositioning).every((positioned) => positioned);
}

/**
 * Determine the next render stage based on current component status
 * 
 * @param currentStage - The current render stage
 * @param allLoaded - Whether all components are loaded
 * @param allPositioned - Whether all components are positioned
 * @returns The next appropriate render stage
 */
export function determineNextStage(
  currentStage: RenderStage, 
  allLoaded: boolean, 
  allPositioned: boolean
): RenderStage {
  // If everything is positioned, we're complete
  if (allPositioned) {
    return 'complete';
  }
  
  // If everything is loaded but not positioned
  if (allLoaded) {
    // Move from grid ready to components ready
    if (currentStage === 'grid_ready') {
      return 'components_ready';
    } 
    // Move from positioning to complete if we're in the positioning stage
    else if (currentStage === 'positioning') {
      return 'complete';
    }
  }
  
  // No stage change needed
  return currentStage;
}

/**
 * Handle component errors by marking components as loaded
 * This allows rendering to continue even when some components fail
 * 
 * @param component - The component that experienced an error
 * @param componentLoading - Current loading status object
 * @returns Updated loading status with failed component marked as loaded
 */
export function handleComponentError(
  component: string,
  componentLoading: ComponentLoadingStatus
): ComponentLoadingStatus {
  const updatedLoading = { ...componentLoading };
  
  // Determine which component had an error and mark it as loaded
  if (component.includes('prop')) {
    const color = component.includes('red') ? 'red' : 'blue';
    updatedLoading[`${color}Prop` as keyof ComponentLoadingStatus] = true;
  } else if (component.includes('arrow')) {
    const color = component.includes('red') ? 'red' : 'blue';
    updatedLoading[`${color}Arrow` as keyof ComponentLoadingStatus] = true;
  } else if (component.includes('grid')) {
    updatedLoading.grid = true;
  }
  
  // Log the error for debugging
  console.warn(`Marked ${component} as loaded after error`);
  
  return updatedLoading;
}