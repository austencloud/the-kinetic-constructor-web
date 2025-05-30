/**
 * Simple App State - Pure Svelte 5 Runes
 * Replaces the XState app machine with simple reactive state
 */

import { browser } from '$app/environment';

// Load preferences from localStorage
function loadActiveTabPreference(): number {
	if (!browser) return 0;
	try {
		const saved = localStorage.getItem('activeTab');
		return saved ? parseInt(saved, 10) : 0;
	} catch {
		return 0;
	}
}

function loadBackgroundPreference(): string {
	if (!browser) return 'none';
	try {
		return localStorage.getItem('background') || 'none';
	} catch {
		return 'none';
	}
}

// Create a simple reactive state object
function createAppState() {
	// State variables using Svelte 5 runes
	let currentTab = $state(loadActiveTabPreference());
	let previousTab = $state(0);
	let background = $state(loadBackgroundPreference());
	let isFullScreen = $state(false);
	let isSettingsOpen = $state(false);
	let initializationError = $state<string | null>(null);
	let loadingProgress = $state(0);
	let loadingMessage = $state('Initializing...');
	let contentVisible = $state(false);
	let backgroundIsReady = $state(false);
	let isLoading = $state(true);

	// Return the state object with actions and getters
	return {
		// Getters
		get currentTab() {
			return currentTab;
		},
		get previousTab() {
			return previousTab;
		},
		get background() {
			return background;
		},
		get isFullScreen() {
			return isFullScreen;
		},
		get isSettingsOpen() {
			return isSettingsOpen;
		},
		get initializationError() {
			return initializationError;
		},
		get loadingProgress() {
			return loadingProgress;
		},
		get loadingMessage() {
			return loadingMessage;
		},
		get contentVisible() {
			return contentVisible;
		},
		get backgroundIsReady() {
			return backgroundIsReady;
		},
		get isLoading() {
			return isLoading;
		},
		get isReady() {
			return !isLoading && backgroundIsReady;
		},

		// Actions
		setTab(tab: number) {
			if (tab !== currentTab) {
				previousTab = currentTab;
				currentTab = tab;

				// Save to localStorage
				if (browser) {
					try {
						localStorage.setItem('activeTab', tab.toString());
					} catch (error) {
						console.warn('Failed to save active tab preference:', error);
					}
				}
			}
		},

		setBackground(bg: string) {
			background = bg;

			// Save to localStorage
			if (browser) {
				try {
					localStorage.setItem('background', bg);
				} catch (error) {
					console.warn('Failed to save background preference:', error);
				}
			}
		},

		toggleFullScreen() {
			isFullScreen = !isFullScreen;
		},

		openSettings() {
			isSettingsOpen = true;
		},

		closeSettings() {
			isSettingsOpen = false;
		},

		toggleSettings() {
			isSettingsOpen = !isSettingsOpen;
		},

		backgroundReady() {
			backgroundIsReady = true;
			contentVisible = true;
		},

		setLoading(loading: boolean) {
			isLoading = loading;
		},

		updateProgress(progress: number, message: string) {
			loadingProgress = progress;
			loadingMessage = message;
		},

		setInitializationError(error: string | null) {
			initializationError = error;
		},

		reset() {
			currentTab = 0;
			previousTab = 0;
			isFullScreen = false;
			isSettingsOpen = false;
			initializationError = null;
			loadingProgress = 0;
			loadingMessage = 'Initializing...';
			contentVisible = false;
			backgroundIsReady = false;
			isLoading = true;
		}
	};
}

// Create the singleton instance
export const appState = createAppState();

// Export actions from the appState object
export const {
	setTab,
	setBackground,
	toggleFullScreen,
	openSettings,
	closeSettings,
	toggleSettings,
	backgroundReady,
	setLoading,
	updateProgress,
	setInitializationError,
	reset
} = appState;
