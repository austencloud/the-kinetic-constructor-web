/**
 * App Actions - Svelte 5 Runes Implementation
 * Provides action interface for app state management
 */

import { appState } from '$lib/state/simple/appState.svelte';

/**
 * App actions using simple state management
 */
export const appActions = {
	setTab: (tab: number) => appState.setTab(tab),
	setBackground: (background: string) => appState.setBackground(background),
	toggleFullScreen: () => appState.toggleFullScreen(),
	openSettings: () => appState.openSettings(),
	closeSettings: () => appState.closeSettings(),
	toggleSettings: () => appState.toggleSettings(),
	backgroundReady: () => appState.backgroundReady(),
	setLoading: (loading: boolean) => appState.setLoading(loading),
	updateProgress: (progress: number, message: string) => appState.updateProgress(progress, message),
	setInitializationError: (error: string | null) => appState.setInitializationError(error),
	reset: () => appState.reset()
};
