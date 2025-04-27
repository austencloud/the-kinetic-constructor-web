/**
 * State Management Integration Tests
 * 
 * These tests verify that different parts of the state management system
 * work together correctly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { stateRegistry, resetAllState } from '$lib/state/core';
import { initializeStateManagement } from '$lib/state';
import { settingsStore } from '$lib/state/stores/settings';
import { backgroundStore } from '$lib/state/stores/background';
import { gridStore } from '$lib/state/stores/grid';
import { pictographStore } from '$lib/state/stores/pictograph';
import { appService } from '$lib/state/machines/app';

describe('State Management Integration', () => {
  beforeEach(() => {
    // Reset all state before each test
    resetAllState();
  });
  
  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });
  
  it('should initialize all state containers', () => {
    // Initialize state management
    initializeStateManagement();
    
    // Verify that all state containers are registered
    const containers = stateRegistry.getAll();
    const containerIds = containers.map(container => container.id);
    
    expect(containerIds).toContain('settings');
    expect(containerIds).toContain('background');
    expect(containerIds).toContain('grid');
    expect(containerIds).toContain('pictograph');
    expect(containerIds).toContain('app');
  });
  
  it('should sync settings with background store', () => {
    // Initialize state management
    initializeStateManagement();
    
    // Update settings
    settingsStore.setBackground('nightSky');
    settingsStore.setBackgroundQuality('high');
    
    // Verify that background store is updated
    const backgroundState = get(backgroundStore);
    expect(backgroundState.currentBackground).toBe('nightSky');
    expect(backgroundState.quality).toBe('high');
  });
  
  it('should persist state across resets', () => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
      removeItem: vi.fn(),
      key: vi.fn(),
      length: 0
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });
    
    // Initialize state management
    initializeStateManagement();
    
    // Update settings
    settingsStore.setTheme('dark');
    
    // Trigger persistence
    stateRegistry.persistState();
    
    // Verify that localStorage.setItem was called
    expect(localStorageMock.setItem).toHaveBeenCalled();
    
    // Get the persisted data
    const persistedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    
    // Verify that settings were persisted
    expect(persistedData.settings).toBeDefined();
    expect(persistedData.settings.value.theme).toBe('dark');
  });
  
  it('should handle interactions between app machine and stores', async () => {
    // Initialize state management
    initializeStateManagement();
    
    // Mock the initializeApplication function
    vi.mock('$lib/utils/appInitializer', () => ({
      initializeApplication: vi.fn((callback) => {
        callback(50, 'Loading...');
        return Promise.resolve(true);
      })
    }));
    
    // Signal that the background is ready
    appService.send({ type: 'BACKGROUND_READY' });
    
    // Wait for the app to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify that the app is in the ready state
    const appState = appService.getSnapshot();
    expect(appState.matches('ready')).toBe(true);
    
    // Change the background via the app machine
    appService.send({ type: 'UPDATE_BACKGROUND', background: 'snowfall' });
    
    // Verify that the app state was updated
    const updatedAppState = appService.getSnapshot();
    expect(updatedAppState.context.background).toBe('snowfall');
  });
  
  it('should handle interactions between grid and pictograph stores', async () => {
    // Initialize state management
    initializeStateManagement();
    
    // Mock the parseGridCoordinates function
    vi.mock('$lib/components/objects/Grid/gridUtils', () => ({
      parseGridCoordinates: vi.fn(() => ({
        handPoints: { normal: {}, strict: {} },
        layer2Points: { normal: {}, strict: {} },
        outerPoints: {},
        centerPoint: { coordinates: { x: 0, y: 0 } },
        mode: 'diamond'
      }))
    }));
    
    // Load grid data
    await gridStore.loadData();
    
    // Set pictograph data
    pictographStore.setData({
      id: 'test',
      gridMode: 'diamond',
      redPropData: null,
      bluePropData: null,
      redArrowData: null,
      blueArrowData: null
    });
    
    // Update grid component loaded
    pictographStore.updateComponentLoaded('grid');
    
    // Verify that the pictograph store was updated
    const pictographState = get(pictographStore);
    expect(pictographState.components.grid).toBe(true);
    expect(pictographState.loadProgress).toBeGreaterThan(0);
  });
});
