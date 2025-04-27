/**
 * Pictograph Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { pictographStore } from './pictograph.store';
import { selectIsLoading, selectIsComplete, selectHasError } from './pictograph.selectors';
import type { PictographData } from '$lib/types/PictographData';

describe('Pictograph Store', () => {
  beforeEach(() => {
    // Reset the store before each test
    pictographStore.reset();
  });
  
  it('should have the correct initial state', () => {
    const state = get(pictographStore);
    expect(state.status).toBe('idle');
    expect(state.data).toBeNull();
    expect(state.error).toBeNull();
    expect(state.loadProgress).toBe(0);
    expect(state.components).toEqual({
      grid: false,
      redProp: false,
      blueProp: false,
      redArrow: false,
      blueArrow: false
    });
  });
  
  it('should set data and update status', () => {
    const mockData: PictographData = {
      id: 'test',
      gridMode: 'diamond',
      redPropData: null,
      bluePropData: null,
      redArrowData: null,
      blueArrowData: null
    };
    
    pictographStore.setData(mockData);
    
    const state = get(pictographStore);
    expect(state.data).toEqual(mockData);
    expect(state.status).toBe('grid_loading');
  });
  
  it('should update component loaded status and progress', () => {
    pictographStore.updateComponentLoaded('grid');
    
    let state = get(pictographStore);
    expect(state.components.grid).toBe(true);
    expect(state.loadProgress).toBe(20); // 1 out of 5 components = 20%
    
    pictographStore.updateComponentLoaded('redProp');
    pictographStore.updateComponentLoaded('blueProp');
    
    state = get(pictographStore);
    expect(state.components.redProp).toBe(true);
    expect(state.components.blueProp).toBe(true);
    expect(state.loadProgress).toBe(60); // 3 out of 5 components = 60%
  });
  
  it('should transition to complete when all components are loaded', () => {
    pictographStore.updateComponentLoaded('grid');
    pictographStore.updateComponentLoaded('redProp');
    pictographStore.updateComponentLoaded('blueProp');
    pictographStore.updateComponentLoaded('redArrow');
    pictographStore.updateComponentLoaded('blueArrow');
    
    const state = get(pictographStore);
    expect(state.status).toBe('complete');
    expect(state.loadProgress).toBe(100);
    expect(get(selectIsComplete)).toBe(true);
  });
  
  it('should set error state', () => {
    pictographStore.setError('Test error', 'grid');
    
    const state = get(pictographStore);
    expect(state.status).toBe('error');
    expect(state.error).toEqual({
      message: 'Test error',
      component: 'grid',
      timestamp: expect.any(Number)
    });
    expect(get(selectHasError)).toBe(true);
  });
  
  it('should update prop data', () => {
    const mockData: PictographData = {
      id: 'test',
      gridMode: 'diamond',
      redPropData: null,
      bluePropData: null,
      redArrowData: null,
      blueArrowData: null
    };
    
    pictographStore.setData(mockData);
    
    const redPropData = { type: 'circle', position: { x: 0, y: 0 } };
    pictographStore.updatePropData('red', redPropData);
    
    const state = get(pictographStore);
    expect(state.data?.redPropData).toEqual(redPropData);
    expect(state.components.redProp).toBe(true);
  });
  
  it('should update arrow data', () => {
    const mockData: PictographData = {
      id: 'test',
      gridMode: 'diamond',
      redPropData: null,
      bluePropData: null,
      redArrowData: null,
      blueArrowData: null
    };
    
    pictographStore.setData(mockData);
    
    const blueArrowData = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
    pictographStore.updateArrowData('blue', blueArrowData);
    
    const state = get(pictographStore);
    expect(state.data?.blueArrowData).toEqual(blueArrowData);
    expect(state.components.blueArrow).toBe(true);
  });
  
  it('should track state transitions in history', () => {
    pictographStore.transitionTo('initializing', 'Test reason');
    pictographStore.transitionTo('grid_loading');
    
    const state = get(pictographStore);
    expect(state.stateHistory).toHaveLength(2);
    expect(state.stateHistory[0]).toEqual({
      from: 'idle',
      to: 'initializing',
      reason: 'Test reason',
      timestamp: expect.any(Number)
    });
    expect(state.stateHistory[1]).toEqual({
      from: 'initializing',
      to: 'grid_loading',
      timestamp: expect.any(Number)
    });
  });
  
  it('should limit history to 10 entries', () => {
    // Add 12 transitions
    for (let i = 0; i < 12; i++) {
      pictographStore.transitionTo('initializing', `Transition ${i}`);
      pictographStore.transitionTo('grid_loading', `Transition ${i}`);
    }
    
    const state = get(pictographStore);
    expect(state.stateHistory).toHaveLength(10);
    // The first two transitions should be dropped
    expect(state.stateHistory[0].reason).toBe('Transition 2');
  });
});
