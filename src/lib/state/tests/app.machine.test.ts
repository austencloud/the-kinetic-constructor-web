/**
 * Application State Machine Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appMachine } from '../machines/app/app.machine';
import { createActor } from 'xstate';
import { waitForState } from '$lib/state/core';

// Mock the initializeApplication function
vi.mock('$lib/utils/appInitializer', () => ({
  initializeApplication: vi.fn((callback) => {
    // Simulate progress updates
    callback(25, 'Loading resources...');
    callback(50, 'Processing data...');
    callback(75, 'Finalizing...');
    
    // Return a successful initialization
    return Promise.resolve(true);
  })
}));

describe('App Machine', () => {
  let actor: ReturnType<typeof createActor>;
  
  beforeEach(() => {
    // Create a fresh actor for each test
    actor = createActor(appMachine);
    actor.start();
  });
  
  it('should start in the initializingBackground state', () => {
    const snapshot = actor.getSnapshot();
    expect(snapshot.matches('initializingBackground')).toBe(true);
  });
  
  it('should transition to initializingApp when background is ready', async () => {
    // Send the BACKGROUND_READY event
    actor.send({ type: 'BACKGROUND_READY' });
    
    // Wait for the state to change
    const snapshot = await waitForState(actor, 'initializingApp');
    
    // Verify the state
    expect(snapshot.matches('initializingApp')).toBe(true);
    expect(snapshot.context.backgroundIsReady).toBe(true);
  });
  
  it('should update progress during initialization', async () => {
    // Start in the initializingApp state
    actor.send({ type: 'BACKGROUND_READY' });
    
    // Send a progress update
    actor.send({ type: 'UPDATE_PROGRESS', progress: 42, message: 'Testing progress' });
    
    // Verify the context was updated
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.loadingProgress).toBe(42);
    expect(snapshot.context.loadingMessage).toBe('Testing progress');
  });
  
  it('should transition to ready state after successful initialization', async () => {
    // Start in the initializingApp state
    actor.send({ type: 'BACKGROUND_READY' });
    
    // Wait for the initialization to complete
    const snapshot = await waitForState(actor, 'ready');
    
    // Verify the state
    expect(snapshot.matches('ready')).toBe(true);
    expect(snapshot.context.contentVisible).toBe(true);
  });
  
  it('should handle tab changes correctly', async () => {
    // Start in the ready state
    actor.send({ type: 'BACKGROUND_READY' });
    await waitForState(actor, 'ready');
    
    // Change the tab
    actor.send({ type: 'CHANGE_TAB', tab: 2 });
    
    // Verify the context was updated
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.currentTab).toBe(2);
    expect(snapshot.context.previousTab).toBe(0);
  });
  
  it('should toggle fullscreen mode', async () => {
    // Start in the ready state
    actor.send({ type: 'BACKGROUND_READY' });
    await waitForState(actor, 'ready');
    
    // Toggle fullscreen
    actor.send({ type: 'TOGGLE_FULLSCREEN' });
    
    // Verify the context was updated
    expect(actor.getSnapshot().context.isFullScreen).toBe(true);
    
    // Toggle again
    actor.send({ type: 'TOGGLE_FULLSCREEN' });
    
    // Verify the context was updated
    expect(actor.getSnapshot().context.isFullScreen).toBe(false);
  });
  
  it('should handle settings panel open/close', async () => {
    // Start in the ready state
    actor.send({ type: 'BACKGROUND_READY' });
    await waitForState(actor, 'ready');
    
    // Open settings
    actor.send({ type: 'OPEN_SETTINGS' });
    
    // Verify the context was updated
    expect(actor.getSnapshot().context.isSettingsOpen).toBe(true);
    
    // Close settings
    actor.send({ type: 'CLOSE_SETTINGS' });
    
    // Verify the context was updated
    expect(actor.getSnapshot().context.isSettingsOpen).toBe(false);
  });
  
  it('should update the background', async () => {
    // Start in the ready state
    actor.send({ type: 'BACKGROUND_READY' });
    await waitForState(actor, 'ready');
    
    // Update the background
    actor.send({ type: 'UPDATE_BACKGROUND', background: 'snowfall' });
    
    // Verify the context was updated
    expect(actor.getSnapshot().context.background).toBe('snowfall');
  });
  
  it('should validate background types', async () => {
    // Start in the ready state
    actor.send({ type: 'BACKGROUND_READY' });
    await waitForState(actor, 'ready');
    
    // Try to update with an invalid background
    actor.send({ type: 'UPDATE_BACKGROUND', background: 'invalid' });
    
    // Verify the context was not updated
    expect(actor.getSnapshot().context.background).toBe('snowfall');
  });
});
