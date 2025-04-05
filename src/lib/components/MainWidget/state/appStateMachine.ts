// FILE: src/lib/components/MainWidget/state/appStateMachine.ts
import { createMachine, assign } from 'xstate';

export interface AppMachineContext {
	currentTab: number;
	previousTab: number;
	background: string;
	isFullScreen: boolean;
	isSettingsOpen: boolean;
	initializationError: boolean;
}

export type AppMachineEvents =
	| { type: 'CHANGE_TAB'; tab: number }
	| { type: 'TOGGLE_FULLSCREEN' }
	| { type: 'OPEN_SETTINGS' }
	| { type: 'CLOSE_SETTINGS' }
	| { type: 'UPDATE_BACKGROUND'; background: string }
	| { type: 'SET_INITIALIZATION_ERROR' }
	| { type: 'RESET_ERROR' };

export const appStateMachine = createMachine({
	id: 'appMachine',
	types: {} as {
		context: AppMachineContext;
		events: AppMachineEvents;
	},
	context: {
		currentTab: 0,
		previousTab: 0,
		background: 'Snowfall',
		isFullScreen: false,
		isSettingsOpen: false,
		initializationError: false
	},
	initial: 'idle',
	states: {
		idle: {
			on: {
				CHANGE_TAB: {
					actions: assign(({ context, event }) => ({
						previousTab: context.currentTab,
						currentTab: event.tab
					}))
				},
				TOGGLE_FULLSCREEN: {
					actions: assign(({ context }) => ({
						isFullScreen: !context.isFullScreen
					}))
				},
				OPEN_SETTINGS: {
					actions: assign(() => ({ isSettingsOpen: true }))
				},
				CLOSE_SETTINGS: {
					actions: assign(() => ({ isSettingsOpen: false }))
				},
				UPDATE_BACKGROUND: {
					actions: assign(({ event }) => ({
						background: event.background
					}))
				},
				SET_INITIALIZATION_ERROR: {
					actions: assign(() => ({ initializationError: true }))
				},
				RESET_ERROR: {
					actions: assign(() => ({ initializationError: false }))
				}
			}
		}
	}
});
