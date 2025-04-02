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

			// If a transition is already in progress, complete it immediately
			if (currentState.transitionInProgress) {
				appState.update((s) => ({
					...s,
					previousTab: newTabIndex > s.currentTab ? s.currentTab : s.previousTab,
					currentTab: newTabIndex,
					contentVisible: true,
					transitionInProgress: true
				}));

				dispatch('tabChange', {
					index: newTabIndex,
					id: tabs[newTabIndex].id
				});

				resolve();
				return;
			}

			// Start the transition: fade out current content
			appState.update((s) => ({
				...s,
				previousTab: s.currentTab,
				transitionInProgress: true,
				contentFadeOut: true
			}));

			// Wait for fade-out to complete before switching tabs
			setTimeout(() => {
				// Switch tabs after fade-out
				appState.update((s) => ({
					...s,
					currentTab: newTabIndex,
					contentFadeOut: false // Prepare for fade-in
				}));

				// Dispatch tab change event
				dispatch('tabChange', {
					index: newTabIndex,
					id: tabs[newTabIndex].id
				});

				// Complete transition after a short delay
				setTimeout(() => {
					appState.update((s) => ({
						...s,
						transitionInProgress: false
					}));
					resolve();
				}, 300);
			}, 300); // Match the fade duration
		});
	}
});