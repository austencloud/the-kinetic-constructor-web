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
			const currentState = get(appState);

			// Skip if already on this tab
			if (newTabIndex === currentState.currentTab) {
				resolve();
				return;
			}

			// CHANGE: If a transition is in progress, we need to handle it differently
			if (currentState.transitionInProgress) {
				// Immediately complete the current transition
				appState.update((s) => ({
					...s,
					previousTab: newTabIndex > s.currentTab ? s.currentTab : s.previousTab,
					currentTab: newTabIndex,
					contentVisible: true, // Make content immediately visible
					transitionInProgress: true // Keep transition flag true
				}));

				// Dispatch event for the new tab
				dispatch('tabChange', {
					index: newTabIndex,
					id: tabs[newTabIndex].id
				});

				// Don't wait for a full transition cycle, just resolve
				resolve();
				return;
			}

			// Normal case - no transition in progress
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
