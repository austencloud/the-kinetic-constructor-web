/**
 * Grid Store Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { gridStore } from './grid.store';
import { selectIsGridLoaded, selectIsGridLoading, selectHasGridError } from './grid.selectors';
import type { GridData, GridMode } from '$lib/components/objects/Grid/types';

// Mock the parseGridCoordinates function
vi.mock('$lib/components/objects/Grid/gridUtils', () => ({
  parseGridCoordinates: vi.fn((mode: GridMode) => {
    // Return mock grid data
    return {
      handPoints: {
        normal: {
          'top': {
            coordinates: { x: 0, y: -100 },
            id: 'top',
            type: 'hand',
            variant: 'normal'
          },
          'bottom': {
            coordinates: { x: 0, y: 100 },
            id: 'bottom',
            type: 'hand',
            variant: 'normal'
          }
        },
        strict: {}
      },
      layer2Points: {
        normal: {},
        strict: {}
      },
      outerPoints: {},
      centerPoint: {
        coordinates: { x: 0, y: 0 },
        id: 'center',
        type: 'center',
        variant: 'none'
      },
      mode
    } as GridData;
  })
}));

describe('Grid Store', () => {
  beforeEach(() => {
    // Reset the store before each test
    gridStore.reset();
  });
  
  it('should have the correct initial state', () => {
    const state = get(gridStore);
    expect(state.status).toBe('idle');
    expect(state.mode).toBe('diamond');
    expect(state.data).toBeNull();
    expect(state.error).toBeNull();
    expect(state.debugMode).toBe(false);
  });
  
  it('should set mode', () => {
    gridStore.setMode('box');
    
    const state = get(gridStore);
    expect(state.mode).toBe('box');
  });
  
  it('should load data', async () => {
    const loadPromise = gridStore.loadData();
    
    // Check loading state
    let state = get(gridStore);
    expect(state.status).toBe('loading');
    expect(get(selectIsGridLoading)).toBe(true);
    
    // Wait for loading to complete
    await loadPromise;
    
    // Check loaded state
    state = get(gridStore);
    expect(state.status).toBe('loaded');
    expect(state.data).not.toBeNull();
    expect(state.data?.mode).toBe('diamond');
    expect(get(selectIsGridLoaded)).toBe(true);
  });
  
  it('should load data with specified mode', async () => {
    await gridStore.loadData('box');
    
    const state = get(gridStore);
    expect(state.mode).toBe('box');
    expect(state.data?.mode).toBe('box');
  });
  
  it('should set debug mode', () => {
    gridStore.setDebugMode(true);
    
    const state = get(gridStore);
    expect(state.debugMode).toBe(true);
  });
  
  it('should find closest point', async () => {
    await gridStore.loadData();
    
    const closestPoint = gridStore.findClosestPoint({ x: 0, y: -80 }, 'hand');
    expect(closestPoint).not.toBeNull();
    expect(closestPoint?.id).toBe('top');
  });
  
  it('should get point by key', async () => {
    await gridStore.loadData();
    
    const centerPoint = gridStore.getPointByKey('center');
    expect(centerPoint).not.toBeNull();
    expect(centerPoint?.coordinates).toEqual({ x: 0, y: 0 });
    
    const topPoint = gridStore.getPointByKey('top');
    expect(topPoint).not.toBeNull();
    expect(topPoint?.coordinates).toEqual({ x: 0, y: -100 });
  });
  
  it('should handle errors during loading', async () => {
    // Mock the parseGridCoordinates function to throw an error
    const parseGridCoordinatesMock = vi.fn().mockImplementationOnce(() => {
      throw new Error('Test error');
    });
    
    vi.doMock('$lib/components/objects/Grid/gridUtils', () => ({
      parseGridCoordinates: parseGridCoordinatesMock
    }));
    
    try {
      await gridStore.loadData();
    } catch (error) {
      // Ignore error
    }
    
    const state = get(gridStore);
    expect(state.status).toBe('error');
    expect(state.error).not.toBeNull();
    expect(state.error?.message).toBe('Test error');
    expect(get(selectHasGridError)).toBe(true);
  });
});
