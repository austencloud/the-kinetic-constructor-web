/**
 * Tests for the modern sequence machine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sequenceContainer, sequenceActions } from './modernSequenceMachine';
import { waitForState } from '$lib/state/core/modernTesting';

describe('Modern Sequence Machine', () => {
  // Reset the machine before each test
  beforeEach(() => {
    // Reset the machine by stopping and starting it
    sequenceContainer.stop();
    sequenceContainer.actor.start();
    
    // Mock timers
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('should have the correct initial state', () => {
    const state = sequenceContainer.state;
    
    expect(state.value).toBe('idle');
    expect(state.context).toEqual({
      sequence: [],
      selectedBeatIndex: null,
      isGenerating: false,
      generationProgress: 0,
      generationMessage: '',
      error: null
    });
  });
  
  it('should transition to generating state when generate action is called', () => {
    sequenceActions.generate({ type: 'test' });
    
    const state = sequenceContainer.state;
    expect(state.value).toBe('generating');
    expect(state.context.isGenerating).toBe(true);
    expect(state.context.generationProgress).toBe(0);
    expect(state.context.generationMessage).toBe('Initializing sequence generation...');
  });
  
  it('should update progress during generation', async () => {
    sequenceActions.generate({ type: 'test' });
    
    // Fast-forward timers
    vi.advanceTimersByTime(500);
    
    // Check progress update
    expect(sequenceContainer.state.context.generationProgress).toBe(30);
    expect(sequenceContainer.state.context.generationMessage).toBe('Generating sequence...');
    
    // Fast-forward more
    vi.advanceTimersByTime(500);
    
    // Check second progress update
    expect(sequenceContainer.state.context.generationProgress).toBe(70);
    expect(sequenceContainer.state.context.generationMessage).toBe('Finalizing sequence...');
  });
  
  it('should complete generation and update sequence', async () => {
    sequenceActions.generate({ type: 'test' });
    
    // Fast-forward all timers
    vi.advanceTimersByTime(1500);
    
    // Check final state
    expect(sequenceContainer.state.value).toBe('idle');
    expect(sequenceContainer.state.context.isGenerating).toBe(false);
    expect(sequenceContainer.state.context.generationProgress).toBe(100);
    expect(sequenceContainer.state.context.sequence.length).toBe(8);
  });
  
  it('should cancel generation', async () => {
    sequenceActions.generate({ type: 'test' });
    
    // Fast-forward a bit
    vi.advanceTimersByTime(500);
    
    // Cancel generation
    sequenceActions.cancelGeneration();
    
    // Check state
    expect(sequenceContainer.state.value).toBe('idle');
    expect(sequenceContainer.state.context.isGenerating).toBe(false);
    expect(sequenceContainer.state.context.generationMessage).toBe('Generation cancelled');
  });
  
  it('should select and deselect beats', () => {
    // Select a beat
    sequenceActions.selectBeat(3);
    expect(sequenceContainer.state.context.selectedBeatIndex).toBe(3);
    
    // Deselect
    sequenceActions.deselectBeat();
    expect(sequenceContainer.state.context.selectedBeatIndex).toBe(null);
  });
  
  it('should add beats to the sequence', () => {
    const beat = { id: 'test-beat', data: { value: 42 } };
    
    // Add a beat
    sequenceActions.addBeat(beat);
    
    // Check sequence
    expect(sequenceContainer.state.context.sequence).toEqual([beat]);
    
    // Add another beat
    const beat2 = { id: 'test-beat-2', data: { value: 43 } };
    sequenceActions.addBeat(beat2);
    
    // Check sequence
    expect(sequenceContainer.state.context.sequence).toEqual([beat, beat2]);
  });
  
  it('should remove beats from the sequence', () => {
    // Add some beats
    sequenceActions.addBeat({ id: 'beat-1', data: { value: 1 } });
    sequenceActions.addBeat({ id: 'beat-2', data: { value: 2 } });
    sequenceActions.addBeat({ id: 'beat-3', data: { value: 3 } });
    
    // Remove the middle beat
    sequenceActions.removeBeat(1);
    
    // Check sequence
    expect(sequenceContainer.state.context.sequence).toEqual([
      { id: 'beat-1', data: { value: 1 } },
      { id: 'beat-3', data: { value: 3 } }
    ]);
  });
  
  it('should update beats in the sequence', () => {
    // Add some beats
    sequenceActions.addBeat({ id: 'beat-1', data: { value: 1 } });
    sequenceActions.addBeat({ id: 'beat-2', data: { value: 2 } });
    
    // Update the first beat
    sequenceActions.updateBeat(0, { id: 'beat-1-updated', data: { value: 42 } });
    
    // Check sequence
    expect(sequenceContainer.state.context.sequence).toEqual([
      { id: 'beat-1-updated', data: { value: 42 } },
      { id: 'beat-2', data: { value: 2 } }
    ]);
  });
  
  it('should clear the sequence', () => {
    // Add some beats
    sequenceActions.addBeat({ id: 'beat-1', data: { value: 1 } });
    sequenceActions.addBeat({ id: 'beat-2', data: { value: 2 } });
    
    // Select a beat
    sequenceActions.selectBeat(0);
    
    // Clear the sequence
    sequenceActions.clearSequence();
    
    // Check state
    expect(sequenceContainer.state.context.sequence).toEqual([]);
    expect(sequenceContainer.state.context.selectedBeatIndex).toBe(null);
  });
});
