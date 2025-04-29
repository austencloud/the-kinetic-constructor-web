/**
 * App State Machine
 * 
 * This is a placeholder for the example component.
 */
import { createMachine, assign } from 'xstate';
import { stateRegistry } from '../core/registry';

// Define the app machine
export const appMachine = createMachine({
  id: 'app',
  initial: 'loading',
  context: {
    currentTab: 0,
    isLoading: true
  },
  states: {
    loading: {
      entry: assign({
        isLoading: true
      }),
      on: {
        LOADED: {
          target: 'ready',
          actions: assign({
            isLoading: false
          })
        }
      },
      after: {
        1000: {
          target: 'ready',
          actions: assign({
            isLoading: false
          })
        }
      }
    },
    ready: {
      entry: assign({
        isLoading: false
      }),
      on: {
        CHANGE_TAB: {
          actions: assign({
            currentTab: (_, event) => event.tab
          })
        }
      }
    }
  }
});

// Create and register the app actor
export const appActor = stateRegistry.registerMachine('app', appMachine, {
  persist: true,
  description: 'Main application state'
});

// Helper functions to interact with the app machine
export const appActions = {
  changeTab: (tab: number) => {
    appActor.send({ type: 'CHANGE_TAB', tab });
  },
  setLoading: (isLoading: boolean) => {
    appActor.send({ type: isLoading ? 'LOADING' : 'LOADED' });
  }
};

// Helper functions to get current state
export const appSelectors = {
  isLoading: () => {
    return appActor.getSnapshot().context.isLoading;
  },
  currentTab: () => {
    return appActor.getSnapshot().context.currentTab;
  }
};
