// FILE: src/lib/components/MainWidget/state/store.ts
import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createActor } from 'xstate';
import { appStateMachine } from './appStateMachine';
import { tabs } from './appState';

// Create a slice that mirrors the XState machine's context
const appSlice = createSlice({
  name: 'app',
  initialState: {
    currentTab: 0,
    previousTab: 0,
    background: 'Snowfall',
    isFullScreen: false,
    isSettingsOpen: false,
    initializationError: false,
    contentVisible: true,
    contentFadeOut: false  // Add this line
  },
  reducers: {
    changeTab: (state, action: PayloadAction<number>) => {
      state.previousTab = state.currentTab;
      state.currentTab = action.payload;
      
      // Add content visibility toggle logic
      state.contentFadeOut = true;
      state.contentVisible = false;
      setTimeout(() => {
        state.contentFadeOut = false;
        state.contentVisible = true;
      }, 300);  // Match transition duration
    },
    toggleFullScreen: (state) => {
      state.isFullScreen = !state.isFullScreen;
    },
    openSettings: (state) => {
      state.isSettingsOpen = true;
    },
    closeSettings: (state) => {
      state.isSettingsOpen = false;
    },
    updateBackground: (state, action: PayloadAction<string>) => {
      state.background = action.payload;
    },
    setInitializationError: (state) => {
      state.initializationError = true;
    },
    resetError: (state) => {
      state.initializationError = false;
    },
    // Add a new reducer to explicitly manage content visibility
    setContentVisibility: (state, action: PayloadAction<boolean>) => {
      state.contentVisible = action.payload;
    },
    // Add a new reducer to manage content fade
    setContentFadeOut: (state, action: PayloadAction<boolean>) => {
      state.contentFadeOut = action.payload;
    }
  }
});

// Create the XState actor with explicit typing
export const appService = createActor(appStateMachine).start();

// Add transition listener separately
appService.subscribe((snapshot) => {
  // Optional: Add any side effects or logging
  if (import.meta.env.DEV) {
    console.log('App Machine State:', snapshot.value);
  }
});

// Configure store
export const store = configureStore({
  reducer: {
    app: appSlice.reducer
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false
    }),
  devTools: import.meta.env.DEV
});

// Export actions
export const {
  changeTab,
  toggleFullScreen,
  openSettings,
  closeSettings,
  updateBackground,
  setInitializationError,
  resetError,
  setContentVisibility,
  setContentFadeOut  // Add the new action
} = appSlice.actions;

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Custom selector implementation to match previous behavior
export function useSelector<T>(selector: (state: RootState) => T): T {
  let value: T;
  store.subscribe(() => {
    value = selector(store.getState());
  });
  // Initial value
  value = selector(store.getState());
  return value;
}

// Selector helpers
export const selectAppState = (state: RootState) => state.app;

// Selector for active tab
export const selectActiveTab = (state: RootState) => {
  const { currentTab } = state.app;
  return tabs[currentTab];
};

// Selector for slide direction
export const selectSlideDirection = (state: RootState) =>
  state.app.currentTab > state.app.previousTab;

// Helper to dispatch XState events
export const dispatchToXState = (eventType: string, payload?: any) => {
  appService.send({ type: eventType, ...payload });
};

// Cleanup the service when the app closes
// Only run in browser environment to prevent SSR errors
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    appService.stop();
  });
}