/**
 * Application State Machine with Supervision
 *
 * This is an example of how to use the supervision system with the app machine.
 */

import { createMachine, assign, fromPromise } from 'xstate';
import { createSupervisedMachine } from '$lib/state/core/machine';
import { RootSupervisor } from '$lib/state/core/supervision/RootSupervisor';
import { RestartStrategy, EscalateStrategy } from '$lib/state/core/supervision/strategies';
import { initializeApplication } from '$lib/utils/appInitializer';
import type { BackgroundType } from '$lib/components/MainWidget/state/appState';
import { LogLevel, log } from '$lib/state/core/logger';

// --- Context Definition ---
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

// --- Event Definitions ---
export type AppMachineEvents =
	| { type: 'BACKGROUND_READY' }
	| { type: 'INITIALIZATION_SUCCESS' }
	| { type: 'INITIALIZATION_FAILURE'; error: string }
	| { type: 'UPDATE_PROGRESS'; progress: number; message: string }
	| { type: 'RETRY_INITIALIZATION' }
	| { type: 'CHANGE_TAB'; tab: number }
	| { type: 'TOGGLE_FULLSCREEN' }
	| { type: 'OPEN_SETTINGS' }
	| { type: 'CLOSE_SETTINGS' }
	| { type: 'UPDATE_BACKGROUND'; background: string };

// --- State Machine Definition ---
export const appMachine = createMachine(
	{
		id: 'appMachine',
		types: {} as {
			context: AppMachineContext;
			events: AppMachineEvents;
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
				entry: assign({
					contentVisible: true,
					loadingProgress: 0,
					loadingMessage: ''
				}),
				on: {
					CHANGE_TAB: {
						target: 'ready',
						actions: assign({
							previousTab: ({ context }) => context.currentTab,
							currentTab: ({ event }) => event.tab
						}),
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

// Create and register the app machine with supervision
export const appService = createSupervisedMachine('app', appMachine, {
	// Use the root supervisor
	supervisor: RootSupervisor.getInstance(),

	// Use a restart strategy with fixed backoff type
	strategy: new RestartStrategy({
		maxRestarts: 3,
		withinTimeWindow: 10000, // 10 seconds
		backoffType: undefined, // Remove explicit backoff type to use default
		resetTimeout: 30000, // Reset failure count after 30 seconds of stability
		preserveState: true // Preserve state when restarting
	}),

	// Enable persistence
	persist: true,

	// Add a description
	description: 'Core application state machine with supervision',

	// Add error handling
	onError: (error) => {
		log('app', LogLevel.ERROR, `[AppMachine] Supervised actor error:`, error);

		// You could also report the error to an error tracking service
		// reportErrorToService(error);
	},

	// Add restart handling
	onRestart: (actor) => {
		log(
			'app',
			LogLevel.WARN,
			`[AppMachine] Actor restarted. Health metrics:`,
			actor.getHealthMetrics()
		);

		// You could also notify the user that the application recovered from an error
		// notifyUser('Application recovered from an error');
	}
});
