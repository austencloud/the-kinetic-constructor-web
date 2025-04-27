/**
 * Application State Machine
 * 
 * This machine manages the core application state, including:
 * - Initialization
 * - Tab navigation
 * - Settings
 * - Background management
 */

import { createMachine, assign } from 'xstate';
import { createAppMachine } from '$lib/state/core';
import { initializeApplication } from '$lib/utils/appInitializer';
import type { BackgroundType } from '$lib/components/MainWidget/state/appState';

// --- Context Definition ---
export interface AppMachineContext {
  currentTab: number;
  previousTab: number;
  background: BackgroundType;
  isFullScreen: boolean;
  isSettingsOpen: boolean;
  initializationError: string | null;
  loadingProgress: number;
  loadingMessage: string;
  contentVisible: boolean;
  backgroundIsReady: boolean;
}

// --- Event Definitions ---
export type AppMachineEvents =
  | { type: 'BACKGROUND_READY' }
  | { type: 'INITIALIZATION_SUCCESS' }
  | { type: 'INITIALIZATION_FAILURE'; error: string }
  | { type: 'UPDATE_PROGRESS'; progress: number; message: string }
  | { type: 'RETRY_INITIALIZATION' }
  | { type: 'CHANGE_TAB'; tab: number }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'OPEN_SETTINGS' }
  | { type: 'CLOSE_SETTINGS' }
  | { type: 'UPDATE_BACKGROUND'; background: string };

// --- State Machine Definition ---
export const appMachine = createMachine({
  id: 'appMachine',
  types: {} as {
    context: AppMachineContext;
    events: AppMachineEvents;
  },
  context: {
    currentTab: 0,
    previousTab: 0,
    background: 'snowfall',
    isFullScreen: false,
    isSettingsOpen: false,
    initializationError: null,
    loadingProgress: 0,
    loadingMessage: 'Initializing...',
    contentVisible: false,
    backgroundIsReady: false
  },
  initial: 'initializingBackground',
  states: {
    initializingBackground: {
      entry: assign({
        backgroundIsReady: false,
        initializationError: null,
        loadingProgress: 0,
        loadingMessage: 'Loading background...',
        contentVisible: false
      }),
      on: {
        BACKGROUND_READY: {
          target: 'initializingApp',
          actions: assign({ backgroundIsReady: true })
        }
      }
    },
    initializingApp: {
      entry: assign({
        initializationError: null,
        loadingProgress: 0,
        loadingMessage: 'Initializing application...',
        contentVisible: false
      }),
      invoke: {
        src: 'initializeApplication',
        onDone: {
          target: 'ready',
          actions: assign({
            loadingProgress: 100,
            loadingMessage: 'Ready!',
            initializationError: null
          })
        },
        onError: {
          target: 'initializationFailed',
          actions: assign({
            initializationError: (_, event) => event.data?.message || 'Unknown error',
            loadingProgress: 0
          })
        }
      },
      on: {
        UPDATE_PROGRESS: {
          actions: assign({
            loadingProgress: ({ event }) => event.progress,
            loadingMessage: ({ event }) => event.message
          })
        }
      }
    },
    initializationFailed: {
      on: {
        RETRY_INITIALIZATION: {
          target: 'initializingApp',
          guard: ({ context }) => context.backgroundIsReady
        }
      }
    },
    ready: {
      entry: assign({
        contentVisible: true,
        loadingProgress: 0,
        loadingMessage: ''
      }),
      on: {
        CHANGE_TAB: {
          target: 'ready',
          actions: assign({
            previousTab: ({ context }) => context.currentTab,
            currentTab: ({ event }) => event.tab
          }),
          guard: ({ context, event }) => context.currentTab !== event.tab
        },
        TOGGLE_FULLSCREEN: {
          actions: assign({
            isFullScreen: ({ context }) => !context.isFullScreen
          })
        },
        OPEN_SETTINGS: {
          actions: assign({ isSettingsOpen: true })
        },
        CLOSE_SETTINGS: {
          actions: assign({ isSettingsOpen: false })
        },
        UPDATE_BACKGROUND: {
          actions: assign({
            background: ({ event, context }) => {
              const validBackgrounds: BackgroundType[] = ['snowfall'];
              return validBackgrounds.includes(event.background as BackgroundType)
                ? (event.background as BackgroundType)
                : context.background;
            }
          })
        }
      }
    }
  }
}, {
  services: {
    initializeApplication: async ({ sendBack }) => {
      const progressCallback = (progress: number, message: string) => {
        sendBack({ type: 'UPDATE_PROGRESS', progress, message });
      };
      
      try {
        const success = await initializeApplication(progressCallback);
        if (!success) {
          throw new Error('Initialization returned false.');
        }
      } catch (error) {
        throw error;
      }
    }
  }
});

// Create and register the app machine
export const appService = createAppMachine('app', appMachine, {
  persist: true,
  description: 'Core application state machine'
});
