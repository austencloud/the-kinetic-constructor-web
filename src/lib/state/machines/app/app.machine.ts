/**
 * Application State Machine
 *
 * This machine manages the core application state, including:
 * - Initialization
 * - Tab navigation
 * - Settings
 * - Background management
 */

import { createMachine, assign, fromPromise } from 'xstate';
import { createAppMachine } from '$lib/state/core';
import { initializeApplication } from '$lib/utils/appInitializer';
import type { BackgroundType } from '$lib/components/MainWidget/state/appState';
import { browser } from '$app/environment';
import { type AppMachineContext, type AppMachineEvents } from './types';

// Storage key for the last active tab
const LAST_ACTIVE_TAB_KEY = 'last_active_tab';

// Function to load the last active tab from localStorage
function loadLastActiveTab(): number {
	if (!browser) return 0;

	try {
		const savedTab = localStorage.getItem(LAST_ACTIVE_TAB_KEY);
		console.log('Loading last active tab from localStorage:', savedTab);

		if (savedTab !== null) {
			const tabIndex = parseInt(savedTab, 10);
			console.log('Parsed tab index:', tabIndex);

			// Ensure the tab index is valid (between 0 and 4)
			if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 4) {
				console.log('Using saved tab index:', tabIndex);
				return tabIndex;
			}
		}
	} catch (error) {
		console.error('Error loading last active tab:', error);
	}

	console.log('Using default tab index: 0');
	return 0; // Default to the first tab if no saved tab or error
}

// --- State Machine Definition ---
export const appMachine = createMachine(
	{
		id: 'appMachine',
		types: {} as {
			context: AppMachineContext;
			events: AppMachineEvents;
		},
		context: {
			currentTab: loadLastActiveTab(),
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
					src: 'initializeApplication',
					onDone: {
						target: 'ready',
						actions: assign({
							loadingProgress: 100,
							loadingMessage: 'Ready!',
							initializationError: null
						})
					},
					onError: {
						target: 'initializationFailed',
						actions: assign({
							initializationError: (_, event: any) => {
								// Safely extract error message from the event
								return typeof event?.data === 'object'
									? event.data?.message || 'Unknown error'
									: 'Initialization failed';
							},
							loadingProgress: 0
						})
					}
				},
				on: {
					UPDATE_PROGRESS: {
						actions: assign({
							loadingProgress: ({ event }) => event.progress,
							loadingMessage: ({ event }) => event.message
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
				entry: [
					assign({
						contentVisible: true,
						loadingProgress: 0,
						loadingMessage: ''
					}),
					// Add this new action to enforce the tab selection from localStorage
					({ self }) => {
						if (browser) {
							try {
								const savedTab = localStorage.getItem(LAST_ACTIVE_TAB_KEY);
								if (savedTab !== null) {
									const tabIndex = parseInt(savedTab, 10);
									// Ensure the tab index is valid (between 0 and 4)
									if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 4) {
										console.log('Enforcing tab from localStorage in ready state:', tabIndex);
										// Use a small timeout to ensure this happens after other initialization
										setTimeout(() => {
											self.send({ type: 'CHANGE_TAB', tab: tabIndex });
										}, 50);
									}
								}
							} catch (error) {
								console.error('Error enforcing tab on ready state:', error);
							}
						}
					}
				],
				on: {
					CHANGE_TAB: {
						target: 'ready',
						actions: [
							assign({
								previousTab: ({ context }) => context.currentTab,
								currentTab: ({ event }) => event.tab
							}),
							({ event }) => {
								// Save the current tab to localStorage
								if (browser) {
									try {
										console.log('Saving tab to localStorage:', event.tab);
										localStorage.setItem(LAST_ACTIVE_TAB_KEY, event.tab.toString());
										console.log('Tab saved successfully');
									} catch (error) {
										console.error('Error saving last active tab:', error);
									}
								}
							}
						],
						guard: ({ context, event }) => context.currentTab !== event.tab
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
								const validBackgrounds: BackgroundType[] = ['snowfall'];
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
			initializeApplication: fromPromise(async ({ self }) => {
				const progressCallback = (progress: number, message: string) => {
					self.send({ type: 'UPDATE_PROGRESS', progress, message });
				};

				try {
					const success = await initializeApplication(progressCallback);
					if (!success) {
						throw new Error('Initialization returned false.');
					}
					return success;
				} catch (error) {
					throw error;
				}
			})
		}
	}
);

// Create and register the app machine
export const appService = createAppMachine('app', appMachine, {
	persist: true,
	description: 'Core application state machine'
});
