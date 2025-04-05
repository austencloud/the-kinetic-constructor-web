// src/lib/components/MainWidget/state/appStateMachine.ts

// 1. Fix import: Remove 'send'
import { createMachine, assign, fromPromise } from 'xstate'; // Import fromPromise
import { tabs, type BackgroundType } from './appState';
import { initializeApplication } from '$lib/utils/appInitializer';
// Import specific types for actor system if needed (might be complex)
// Alternatively, rely on inference where possible.
import type { ActorRefFrom, AnyActorLogic, ActorSystemInfo } from 'xstate';

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
}

export type AppMachineEvents =
	| { type: 'INITIALIZE' } // Note: This event isn't explicitly used to trigger the machine, it starts in 'initializing'
	| { type: 'INITIALIZATION_SUCCESS' }
	| { type: 'INITIALIZATION_FAILURE'; error: string }
	| { type: 'UPDATE_PROGRESS'; progress: number; message: string }
	| { type: 'RETRY_INITIALIZATION' }
	| { type: 'CHANGE_TAB'; tab: number }
	| { type: 'TAB_TRANSITION_START' }
	| { type: 'TAB_TRANSITION_FINISH' }
	| { type: 'TOGGLE_FULLSCREEN' }
	| { type: 'OPEN_SETTINGS' }
	| { type: 'CLOSE_SETTINGS' }
	| { type: 'UPDATE_BACKGROUND'; background: string };

// Define the output type of the initialization promise actor
type InitializationActorOutput =
	| { type: 'INITIALIZATION_SUCCESS' }
	| { type: 'INITIALIZATION_FAILURE'; error: string };

// Define the input type for the initialization actor (if any data is passed via invoke.input)
type InitializationActorInput = undefined | { someData?: string }; // Example if input is used

// Define the actor logic using fromPromise
const initializeApplicationActor = fromPromise<InitializationActorOutput, InitializationActorInput>(
	// 6. Add types for input and system (get system type from ActorRef maybe?)
	async ({ input, system }) => {
		// system is implicitly complex, need better typing or usage pattern
		const progressCallback = (progress: number, message: string) => {
			// The 'system' object isn't directly available here with fromPromise's signature.
			// Instead, the promise should only resolve or reject.
			// To send events *during* the promise execution, it needs a different structure,
			// perhaps invoking a callback actor or managing progress differently.

			// --- Let's simplify: Assume initializeApplication only resolves/rejects ---
			// --- and progress is handled externally or via a different pattern ---
			// --- For now, we remove the progressCallback from the core promise logic ---
			// --- and handle UPDATE_PROGRESS if sent from *outside* the promise ---
			// system.send({ type: 'UPDATE_PROGRESS', progress, message }); // This won't work directly here
			console.log(`Progress (from callback): ${progress}% - ${message}`); // Log for now
		};

		try {
			// Pass undefined or an actual callback if initializeApplication needs it for side effects,
			// but don't rely on it sending events *back* to the parent machine via 'system'.
			const success = await initializeApplication(progressCallback); // Or pass undefined if callback not needed by initializeApplication itself now

			if (success) {
				// Resolve with the success shape
				return { type: 'INITIALIZATION_SUCCESS' } as const;
			} else {
				// Reject with the failure shape
				throw { type: 'INITIALIZATION_FAILURE', error: 'Initialization returned false.' };
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
			// Reject with the failure shape
			throw { type: 'INITIALIZATION_FAILURE', error: errorMessage };
		}
	}
);

export const appStateMachine = createMachine(
	{
		id: 'appMachine',
		// 2. Fix types definition for actors
		types: {} as {
			context: AppMachineContext;
			events: AppMachineEvents;
			// Define the actor source and its potential output/input
			actors: {
				src: 'initializeApplication'; // Keep the key used in invoke
				logic: typeof initializeApplicationActor; // Reference the actor logic type
				// input: InitializationActorInput; // Define input type if needed
				// output: InitializationActorOutput; // Define output type
			};
		},
		context: {
			currentTab: 0,
			previousTab: 0,
			background: 'snowfall',
			isFullScreen: false,
			isSettingsOpen: false,
			initializationError: null,
			loadingProgress: 0, // Progress might need to be updated differently now
			loadingMessage: 'Initializing...',
			contentVisible: true
		},
		initial: 'initializing',
		states: {
			initializing: {
				entry: assign({
					initializationError: null,
					loadingProgress: 0,
					loadingMessage: 'Initializing application...',
					contentVisible: false
				}),
				invoke: {
					id: 'initApp',
					src: 'initializeApplication', // Matches key in actors config
					// input: ({ context, event }) => { /* prepare input data if needed */ return undefined; },
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
							initializationError: ({ event }) => {
								// In v5 onError for actors/promises, the thrown/rejected value
								// is typically available on event.error
								const rejectionReason = event.error;

								// Safely check if the rejectionReason has the shape we expect
								// (the object we threw from fromPromise)
								if (
									typeof rejectionReason === 'object' &&
									rejectionReason !== null &&
									'error' in rejectionReason &&
									typeof rejectionReason.error === 'string'
								) {
									return rejectionReason.error; // Extract the message
								}

								// Provide a fallback message if the error shape is unexpected
								return 'An unknown initialization error occurred.';
							},
							loadingProgress: 0 // Reset progress on error
						})
					}
				},
				on: {
					// UPDATE_PROGRESS would now likely be sent from outside, if needed at all
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
						target: 'initializing'
					}
				}
			},
			ready: {
				entry: assign({ contentVisible: true }),
				initial: 'idle',
				states: {
					idle: {},
					tabTransitioning: {
						on: { CHANGE_TAB: undefined },
						after: { 600: { target: 'idle', actions: 'finishTabTransition' } }
					}
				},
				on: {
					CHANGE_TAB: {
						target: '.tabTransitioning',
						actions: 'startTabTransition',
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
							// 3. & 4. Fix assign function signature and context usage
							background: ({ event, context: currentContext }) => {
								const validBackgrounds: BackgroundType[] = [
									'snowfall',
								];
								if (validBackgrounds.includes(event.background as BackgroundType)) {
									return event.background as BackgroundType;
								}
								console.warn(
									`Invalid background type in event: ${event.background}. Keeping previous.`
								);
								// Return previous value correctly
								return currentContext.background;
							}
						})
					}
				}
			}
		}
	},
	{
		actions: {
			startTabTransition: assign(({ context, event }) => {
				if (event.type === 'CHANGE_TAB') {
					return {
						previousTab: context.currentTab,
						currentTab: event.tab,
						contentVisible: false
					};
				}
				return {};
			}),
			finishTabTransition: assign({
				contentVisible: true
			})
		},
		// 2. Implement the actor using the defined logic
		actors: {
			initializeApplication: initializeApplicationActor
		},
		guards: {},
		delays: {}
	}
);
