import type { RenderStage } from '../constants/trackingConstants';

// Define the component loading type
export type ComponentLoadingStatus = {
  grid: boolean;
  redProp: boolean;
  blueProp: boolean;
  redArrow: boolean;
  blueArrow: boolean;
};

// Define the component positioning type
export type ComponentPositioningStatus = {
  redProp: boolean;
  blueProp: boolean;
  redArrow: boolean;
  blueArrow: boolean;
};

/**
 * Check if all tracked components are loaded
 */
export function checkAllComponentsLoaded(
  componentLoading: ComponentLoadingStatus
): boolean {
  return Object.values(componentLoading).every((loaded) => loaded);
}

/**
 * Check if all tracked components are positioned
 */
export function checkAllComponentsPositioned(
  componentPositioning: ComponentPositioningStatus
): boolean {
  return Object.values(componentPositioning).every((positioned) => positioned);
}

/**
 * Determine next stage based on current state
 */
export function determineNextStage(
  currentStage: RenderStage, 
  allLoaded: boolean, 
  allPositioned: boolean
): RenderStage {
  if (allPositioned) {
    return 'complete';
  }
  
  if (allLoaded) {
    if (currentStage === 'grid_ready') {
      return 'components_ready';
    } else if (currentStage === 'positioning') {
      return 'complete';
    }
  }
  
  return currentStage;
}

/**
 * Mark a component as loaded when an error occurs, so rendering can continue
 */
export function handleComponentError(
  component: string,
  componentLoading: ComponentLoadingStatus
): ComponentLoadingStatus {
  const updatedLoading = { ...componentLoading };
  
  if (component.includes('prop')) {
    const color = component.includes('red') ? 'red' : 'blue';
    updatedLoading[`${color}Prop` as keyof ComponentLoadingStatus] = true;
  } else if (component.includes('arrow')) {
    const color = component.includes('red') ? 'red' : 'blue';
    updatedLoading[`${color}Arrow` as keyof ComponentLoadingStatus] = true;
  } else if (component.includes('grid')) {
    updatedLoading.grid = true;
  }
  
  return updatedLoading;
}