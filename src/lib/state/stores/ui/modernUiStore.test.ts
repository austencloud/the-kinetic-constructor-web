/**
 * Tests for the modern UI store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { uiStore } from './modernUiStore';
import { getState } from '$lib/state/core/modernTesting';

describe('Modern UI Store', () => {
  // Reset the store before each test
  beforeEach(() => {
    uiStore.reset();
  });
  
  it('should have the correct initial state', () => {
    const state = getState(uiStore);
    
    expect(state).toEqual({
      activeTab: 0,
      sidebarOpen: false,
      modalOpen: false,
      modalContent: null,
      theme: 'system',
      isMobile: false,
      isLoading: false
    });
  });
  
  it('should update the active tab', () => {
    uiStore.setActiveTab(2);
    
    const state = getState(uiStore);
    expect(state.activeTab).toBe(2);
  });
  
  it('should open and close the sidebar', () => {
    // Initially closed
    expect(getState(uiStore).sidebarOpen).toBe(false);
    
    // Open
    uiStore.openSidebar();
    expect(getState(uiStore).sidebarOpen).toBe(true);
    
    // Close
    uiStore.closeSidebar();
    expect(getState(uiStore).sidebarOpen).toBe(false);
  });
  
  it('should toggle the sidebar', () => {
    // Initially closed
    expect(getState(uiStore).sidebarOpen).toBe(false);
    
    // Toggle to open
    uiStore.toggleSidebar();
    expect(getState(uiStore).sidebarOpen).toBe(true);
    
    // Toggle to closed
    uiStore.toggleSidebar();
    expect(getState(uiStore).sidebarOpen).toBe(false);
  });
  
  it('should open and close the modal with content', () => {
    // Initially closed
    expect(getState(uiStore).modalOpen).toBe(false);
    expect(getState(uiStore).modalContent).toBe(null);
    
    // Open with content
    uiStore.openModal('Test Content');
    expect(getState(uiStore).modalOpen).toBe(true);
    expect(getState(uiStore).modalContent).toBe('Test Content');
    
    // Close
    uiStore.closeModal();
    expect(getState(uiStore).modalOpen).toBe(false);
    expect(getState(uiStore).modalContent).toBe(null);
  });
  
  it('should set the theme', () => {
    // Initially system
    expect(getState(uiStore).theme).toBe('system');
    
    // Set to dark
    uiStore.setTheme('dark');
    expect(getState(uiStore).theme).toBe('dark');
    
    // Set to light
    uiStore.setTheme('light');
    expect(getState(uiStore).theme).toBe('light');
  });
  
  it('should set mobile state', () => {
    // Initially false
    expect(getState(uiStore).isMobile).toBe(false);
    
    // Set to true
    uiStore.setMobile(true);
    expect(getState(uiStore).isMobile).toBe(true);
  });
  
  it('should set loading state', () => {
    // Initially false
    expect(getState(uiStore).isLoading).toBe(false);
    
    // Set to true
    uiStore.setLoading(true);
    expect(getState(uiStore).isLoading).toBe(true);
  });
  
  it('should reset to initial state', () => {
    // Change multiple values
    uiStore.setActiveTab(3);
    uiStore.openSidebar();
    uiStore.openModal('Test');
    uiStore.setTheme('dark');
    uiStore.setMobile(true);
    uiStore.setLoading(true);
    
    // Reset
    uiStore.reset();
    
    // Check all values are reset
    const state = getState(uiStore);
    expect(state).toEqual({
      activeTab: 0,
      sidebarOpen: false,
      modalOpen: false,
      modalContent: null,
      theme: 'system',
      isMobile: false,
      isLoading: false
    });
  });
});
