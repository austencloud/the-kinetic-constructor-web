// src/lib/components/MainWidget/state/appSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AppState {
  isSettingsDialogOpen: boolean;
  isFullScreen: boolean;
  background: string;
  initializationError: boolean;
  currentTab: number;
  previousTab: number;
  contentVisible: boolean;
  dynamicHeight: string;
  transitionInProgress: boolean;
  contentFadeOut: boolean;
}

export const initialState: AppState = {
  isSettingsDialogOpen: false,
  isFullScreen: false,
  background: 'Snowfall',
  initializationError: false,
  currentTab: 0,
  previousTab: 0,
  contentVisible: true,
  dynamicHeight: '100vh',
  transitionInProgress: false,
  contentFadeOut: false
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    openSettings: (state) => {
      state.isSettingsDialogOpen = true;
    },
    closeSettings: (state) => {
      state.isSettingsDialogOpen = false;
    },
    updateBackground: (state, action: PayloadAction<string>) => {
      state.background = action.payload;
    },
    setFullScreen: (state, action: PayloadAction<boolean>) => {
      state.isFullScreen = action.payload;
    },
    setInitializationError: (state, action: PayloadAction<boolean>) => {
      state.initializationError = action.payload;
    },
    changeTab: (state, action: PayloadAction<number>) => {
      // Preserve previous tab logic
      state.previousTab = state.currentTab;
      state.currentTab = action.payload;
      
      // Transition state management
      state.transitionInProgress = true;
      state.contentFadeOut = true;

      // Reset after transition
      setTimeout(() => {
        state.transitionInProgress = false;
        state.contentFadeOut = false;
      }, 600);
    },
    setContentVisibility: (state, action: PayloadAction<boolean>) => {
      state.contentVisible = action.payload;
    },
    setDynamicHeight: (state, action: PayloadAction<string>) => {
      state.dynamicHeight = action.payload;
    }
  }
});

export const {
  openSettings,
  closeSettings,
  updateBackground,
  setFullScreen,
  setInitializationError,
  changeTab,
  setContentVisibility,
  setDynamicHeight
} = appSlice.actions;

export default appSlice.reducer;