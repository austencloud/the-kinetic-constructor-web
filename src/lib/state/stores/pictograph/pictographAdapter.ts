/**
 * Pictograph Store Adapter
 *
 * This module provides an adapter between the modern pictograph container
 * and the legacy pictograph store API for backward compatibility.
 * 
 * @deprecated Use the modern pictograph container directly instead.
 */

import { derived } from 'svelte/store';
import { pictographContainer } from './modernPictographContainer';
import { pictographMachineContainer } from '$lib/state/machines/pictographMachine/pictographMachine';
import type { PictographData } from '$lib/types/PictographData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { PropData } from '$lib/components/objects/Prop/PropData';

/**
 * Create a store that derives its value from the container
 */
const derivedStore = derived(pictographContainer, $container => ({
  status: $container.status,
  data: $container.data,
  error: $container.error,
  loadProgress: $container.loadProgress,
  components: $container.components,
  stateHistory: $container.stateHistory
}));

/**
 * Legacy pictograph store API that forwards to the modern container
 * 
 * @deprecated Use the modern pictograph container directly instead.
 */
export const pictographStore = {
  subscribe: derivedStore.subscribe,
  
  setData: (data: PictographData) => {
    console.warn('Using deprecated pictographStore.setData. Consider migrating to pictographContainer.setData');
    pictographContainer.setData(data);
    
    // Also send to the machine for state management
    pictographMachineContainer.send({
      type: 'SET_DATA',
      data
    });
  },
  
  updateComponentLoaded: (component: keyof typeof pictographContainer.state.components) => {
    console.warn('Using deprecated pictographStore.updateComponentLoaded. Consider migrating to pictographContainer.updateComponentLoaded');
    pictographContainer.updateComponentLoaded(component);
    
    // Also send to the machine for state management
    pictographMachineContainer.send({
      type: 'UPDATE_COMPONENT_LOADED',
      component
    });
  },
  
  setError: (message: string, component?: string) => {
    console.warn('Using deprecated pictographStore.setError. Consider migrating to pictographContainer.setError');
    pictographContainer.setError(message, component);
    
    // Also send to the machine for state management
    pictographMachineContainer.send({
      type: 'SET_ERROR',
      message,
      component
    });
  },
  
  updateGridData: (gridData: GridData) => {
    console.warn('Using deprecated pictographStore.updateGridData. Consider migrating to pictographContainer.updateGridData');
    pictographContainer.updateGridData(gridData);
    
    // Also send to the machine for state management
    pictographMachineContainer.send({
      type: 'UPDATE_GRID_DATA',
      gridData
    });
  },
  
  updatePropData: (color: 'red' | 'blue', propData: PropData) => {
    console.warn('Using deprecated pictographStore.updatePropData. Consider migrating to pictographContainer.updatePropData');
    pictographContainer.updatePropData(color, propData);
    
    // Also send to the machine for state management
    pictographMachineContainer.send({
      type: 'UPDATE_PROP_DATA',
      color,
      propData
    });
  },
  
  updateArrowData: (color: 'red' | 'blue', arrowData: ArrowData) => {
    console.warn('Using deprecated pictographStore.updateArrowData. Consider migrating to pictographContainer.updateArrowData');
    pictographContainer.updateArrowData(color, arrowData);
    
    // Also send to the machine for state management
    pictographMachineContainer.send({
      type: 'UPDATE_ARROW_DATA',
      color,
      arrowData
    });
  },
  
  reset: () => {
    console.warn('Using deprecated pictographStore.reset. Consider migrating to pictographContainer.reset');
    pictographContainer.reset();
    
    // Also send to the machine for state management
    pictographMachineContainer.send({
      type: 'RESET'
    });
  },
  
  transitionTo: (newState: typeof pictographContainer.state.status, reason?: string) => {
    console.warn('Using deprecated pictographStore.transitionTo. Consider migrating to pictographContainer.transitionTo');
    pictographContainer.transitionTo(newState, reason);
  }
};
