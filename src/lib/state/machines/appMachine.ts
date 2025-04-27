/**
 * App State Machine
 *
 * Manages the application initialization, background loading, and UI state.
 */

import { createMachine, assign, fromCallback } from 'xstate';
import { stateRegistry } from '../core/registry';
import { initializeApplication } from '$lib/utils/appInitializer';

// Background types
export type BackgroundType = 'snowfall' | 'nightSky';

// Context for the app state machine
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

// Events for the app state machine
export type AppMachineEvent =
	| { type: 'BACKGROUND_READY' }
	| { type: 'INITIALIZATION_SUCCESS' }
	| { type: 'INITIALIZATION_FAILURE'; error: string }
	| { type: 'UPDATE_PROGRESS'; progress: number; message: string }
	| { type: 'RETRY_INITIALIZATION' }
	| { type: 'CHANGE_TAB'; tab: number }
	| { type: 'SET_FULLSCREEN'; value: boolean }
	| { type: 'TOGGLE_FULLSCREEN' }
	| { type: 'OPEN_SETTINGS' }
	| { type: 'CLOSE_SETTINGS' }
	| { type: 'UPDATE_BACKGROUND'; background: string };

// Define the app machine
export const appMachine = createMachine(
	{
		id: 'appMachine',
		types: {} as {
			context: AppMachineContext;
			events: AppMachineEvent;
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
					src: 'initializeApplication'
				},
				on: {
					UPDATE_PROGRESS: {
						actions: assign({
							loadingProgress: ({ event }) => event.progress,
							loadingMessage: ({ event }) => event.message
						})
					},
					INITIALIZATION_SUCCESS: {
						target: 'ready',
						actions: assign({
							loadingProgress: 100,
							loadingMessage: 'Ready!',
							initializationError: null
						})
					},
					INITIALIZATION_FAILURE: {
						target: 'initializationFailed',
						actions: assign({
							initializationError: ({ event }) => event.error || 'Unknown initialization error',
							loadingProgress: 0
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
						actions: assign({
							previousTab: ({ context }) => context.currentTab,
							currentTab: ({ event }) => event.tab
						})
					},
					SET_FULLSCREEN: {
						actions: assign({
							isFullScreen: ({ event }) => event.value
						})
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
								const validBackgrounds: BackgroundType[] = ['snowfall', 'nightSky'];
								return validBackgrounds.includes(event.background as BackgroundType)
									? (event.background as BackgroundType)
									: context.background;
							}
						})
					}
				}
			}
		}
	},
	{
		actors: {
			initializeApplication: fromCallback(({ sendBack }) => {
				// Create a progress callback that sends UPDATE_PROGRESS events
				const progressCallback = (progress: number, message: string) => {
					sendBack({ type: 'UPDATE_PROGRESS', progress, message });
				};

				// Start the initialization process
				initializeApplication(progressCallback)
					.then(() => {
						sendBack({ type: 'INITIALIZATION_SUCCESS' });
					})
					.catch((error) => {
						sendBack({
							type: 'INITIALIZATION_FAILURE',
							error: error instanceof Error ? error.message : 'Unknown error'
						});
					});

				// Return a cleanup function if needed
				return () => {
					// No cleanup needed for this actor
				};
			})
		}
	}
);

// Create and register the app actor
export const appActor = stateRegistry.registerMachine('app', appMachine, {
	persist: false,
	description: 'Manages application initialization, background loading, and UI state'
});

// Helper functions to interact with the app machine
export const appActions = {
	backgroundReady: () => {
		appActor.send({ type: 'BACKGROUND_READY' });
	},
	retryInitialization: () => {
		appActor.send({ type: 'RETRY_INITIALIZATION' });
	},
	changeTab: (tab: number) => {
		appActor.send({ type: 'CHANGE_TAB', tab });
	},
	setFullScreen: (value: boolean) => {
		appActor.send({ type: 'SET_FULLSCREEN', value });
	},
	toggleFullScreen: () => {
		appActor.send({ type: 'TOGGLE_FULLSCREEN' });
	},
	openSettings: () => {
		appActor.send({ type: 'OPEN_SETTINGS' });
	},
	closeSettings: () => {
		appActor.send({ type: 'CLOSE_SETTINGS' });
	},
	updateBackground: (background: string) => {
		appActor.send({ type: 'UPDATE_BACKGROUND', background });
	}
};

// Helper functions to get current state
export const appSelectors = {
	isLoading: () => {
		return (
			appActor.getSnapshot().matches('initializingBackground') ||
			appActor.getSnapshot().matches('initializingApp')
		);
	},
	isInitializingApp: () => {
		return appActor.getSnapshot().matches('initializingApp');
	},
	hasInitializationFailed: () => {
		return appActor.getSnapshot().matches('initializationFailed');
	},
	isReady: () => {
		return appActor.getSnapshot().matches('ready');
	},
	background: () => {
		return appActor.getSnapshot().context.background;
	},
	initializationError: () => {
		return appActor.getSnapshot().context.initializationError;
	},
	loadingProgress: () => {
		return appActor.getSnapshot().context.loadingProgress;
	},
	loadingMessage: () => {
		return appActor.getSnapshot().context.loadingMessage;
	},
	isSettingsOpen: () => {
		return appActor.getSnapshot().context.isSettingsOpen;
	},
	isFullScreen: () => {
		return appActor.getSnapshot().context.isFullScreen;
	},
	currentTab: () => {
		return appActor.getSnapshot().context.currentTab;
	},
	previousTab: () => {
		return appActor.getSnapshot().context.previousTab;
	},
	activeTabData: () => {
		const currentTab = appActor.getSnapshot().context.currentTab;
		// This would be replaced with actual tab data
		const tabs = [
			{ id: 'generate', title: 'Generate' },
			{ id: 'sequence', title: 'Sequence' },
			{ id: 'visualize', title: 'Visualize' }
		];
		return tabs[currentTab] || tabs[0];
	}
};
