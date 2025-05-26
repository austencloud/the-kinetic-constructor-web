/**
 * Application State Selectors - MODERNIZED WITH SVELTE 5 RUNES
 *
 * This file contains selectors for the app state machine.
 * Selectors are functions that extract specific pieces of state from the machine.
 *
 * NO STORES - RUNES ONLY!
 */

import { appService } from './app.machine';
import { createMachineSelector } from '$lib/state/core';

// Basic selectors - modernized with pure runes, NO STORES!
export const selectAppContext = createMachineSelector(appService, (snapshot) => snapshot.context, {
	id: 'app.context',
	description: 'Full application context'
});

export const selectIsSettingsOpen = createMachineSelector(
	appService,
	(snapshot) => snapshot.context.isSettingsOpen,
	{ id: 'app.isSettingsOpen', description: 'Whether the settings panel is open' }
);

export const selectBackground = createMachineSelector(
	appService,
	(snapshot) => snapshot.context.background,
	{ id: 'app.background', description: 'Current background type' }
);

export const selectCurrentTab = createMachineSelector(
	appService,
	(snapshot) => snapshot.context.currentTab,
	{ id: 'app.currentTab', description: 'Current active tab index' }
);

export const selectPreviousTab = createMachineSelector(
	appService,
	(snapshot) => snapshot.context.previousTab,
	{ id: 'app.previousTab', description: 'Previous active tab index' }
);

export const selectContentVisible = createMachineSelector(
	appService,
	(snapshot) => snapshot.context.contentVisible,
	{ id: 'app.contentVisible', description: 'Whether the main content is visible' }
);

export const selectInitializationError = createMachineSelector(
	appService,
	(snapshot) => snapshot.context.initializationError,
	{ id: 'app.initializationError', description: 'Error message from initialization' }
);

export const selectLoadingProgress = createMachineSelector(
	appService,
	(snapshot) => snapshot.context.loadingProgress,
	{ id: 'app.loadingProgress', description: 'Current loading progress (0-100)' }
);

export const selectLoadingMessage = createMachineSelector(
	appService,
	(snapshot) => snapshot.context.loadingMessage,
	{ id: 'app.loadingMessage', description: 'Current loading message' }
);

// Derived selectors - pure runes, NO STORES!
export const selectIsLoading = createMachineSelector(
	appService,
	(snapshot) => snapshot.matches('initializingBackground') || snapshot.matches('initializingApp'),
	{ id: 'app.isLoading', description: 'Whether the app is in a loading state' }
);

export const selectIsInitializingApp = createMachineSelector(
	appService,
	(snapshot) => snapshot.matches('initializingApp'),
	{ id: 'app.isInitializingApp', description: 'Whether the app is initializing' }
);

export const selectIsReady = createMachineSelector(
	appService,
	(snapshot) => snapshot.matches('ready'),
	{ id: 'app.isReady', description: 'Whether the app is ready' }
);

export const selectHasInitializationFailed = createMachineSelector(
	appService,
	(snapshot) => snapshot.matches('initializationFailed'),
	{ id: 'app.hasInitializationFailed', description: 'Whether initialization has failed' }
);

export const selectSlideDirection = createMachineSelector(
	appService,
	(snapshot) => snapshot.context.currentTab > snapshot.context.previousTab,
	{ id: 'app.slideDirection', description: 'Direction of tab slide animation' }
);
