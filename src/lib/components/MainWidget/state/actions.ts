// src/lib/components/MainWidget/state/actions.ts
import { appState, tabs } from './appState';
import { get } from 'svelte/store';

// Define the event types more precisely
export type TabChangeEvent = {
    index: number;
    id: string;
};

export type SettingsChangeEvent = {
    background: string;
};

// Define a more specific type for the dispatch function
export type AppDispatch = {
    (type: 'tabChange', detail?: TabChangeEvent): void;
    (type: 'settingsChange', detail?: SettingsChangeEvent): void;
};

// Pure action creators that update state immutably
export const createActions = (dispatch: AppDispatch) => ({
    openSettings: () => {
        appState.update((state) => ({ ...state, isSettingsDialogOpen: true }));
    },

    closeSettings: () => {
        appState.update((state) => ({ ...state, isSettingsDialogOpen: false }));
    },

    updateBackground: (newBackground: string) => {
        appState.update((state) => ({ ...state, background: newBackground }));
        dispatch('settingsChange', { background: newBackground });
    },

    setFullScreen: (isFullScreen: boolean) => {
        appState.update((state) => ({ ...state, isFullScreen }));
    },

    setInitializationError: (hasError: boolean) => {
        appState.update((state) => ({ ...state, initializationError: hasError }));
    },

    changeTab: (newTabIndex: number): Promise<void> => {
        return new Promise((resolve) => {
            // Check if a transition is already in progress
            const currentState = get(appState);

            // Skip if already on this tab or transition in progress
            if (newTabIndex === currentState.currentTab || currentState.transitionInProgress) {
                resolve();
                return;
            }

            // Update the state
            appState.update((s) => ({
                ...s,
                previousTab: s.currentTab,
                currentTab: newTabIndex,
                contentVisible: false,
                transitionInProgress: true
            }));

            // Dispatch event
            dispatch('tabChange', {
                index: newTabIndex,
                id: tabs[newTabIndex].id
            });

            // Complete the transition after a delay
            setTimeout(() => {
                appState.update((s) => ({
                    ...s,
                    contentVisible: true,
                    transitionInProgress: false
                }));
                resolve();
            }, 300);
        });
    }
});