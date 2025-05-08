/**
 * Modern UI Store
 * 
 * This module provides a modern implementation of the UI store using
 * the new container-based approach.
 */

import { createContainer, createDerived } from '$lib/state/core/modern';
import { registerContainer } from '$lib/state/core/adapters';

// Define the UI state interface
export interface UiState {
  activeTab: number;
  sidebarOpen: boolean;
  modalOpen: boolean;
  modalContent: string | null;
  theme: 'light' | 'dark' | 'system';
  isMobile: boolean;
  isLoading: boolean;
}

// Create the initial state
const initialState: UiState = {
  activeTab: 0,
  sidebarOpen: false,
  modalOpen: false,
  modalContent: null,
  theme: 'system',
  isMobile: false,
  isLoading: false
};

/**
 * Creates the UI store
 * 
 * @returns The UI store container
 */
function createUiStore() {
  // Create the container with state and actions
  const container = createContainer(
    initialState,
    (state, update) => ({
      // Tab actions
      setActiveTab: (tab: number) => {
        state.activeTab = tab;
      },
      
      // Sidebar actions
      openSidebar: () => {
        state.sidebarOpen = true;
      },
      closeSidebar: () => {
        state.sidebarOpen = false;
      },
      toggleSidebar: () => {
        state.sidebarOpen = !state.sidebarOpen;
      },
      
      // Modal actions
      openModal: (content: string) => {
        state.modalOpen = true;
        state.modalContent = content;
      },
      closeModal: () => {
        state.modalOpen = false;
        state.modalContent = null;
      },
      
      // Theme actions
      setTheme: (theme: 'light' | 'dark' | 'system') => {
        state.theme = theme;
      },
      
      // Device actions
      setMobile: (isMobile: boolean) => {
        state.isMobile = isMobile;
      },
      
      // Loading actions
      setLoading: (isLoading: boolean) => {
        state.isLoading = isLoading;
      }
    })
  );
  
  // Create derived values
  const isDarkTheme = createDerived(() => {
    if (container.state.theme === 'system') {
      // Check system preference
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    }
    return container.state.theme === 'dark';
  });
  
  // Return the container with derived values
  return {
    ...container,
    get isDarkTheme() { return isDarkTheme.value; }
  };
}

// Create and export the UI store
export const uiStore = createUiStore();

// Register with the registry for backward compatibility
export const uiStoreCompat = registerContainer('ui', uiStore, {
  persist: true,
  description: 'UI state store'
});
