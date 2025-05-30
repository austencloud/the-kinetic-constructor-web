/**
 * App Machine - Svelte 5 Runes Implementation
 * Replaces XState app machine with simple reactive state
 */

import { appState } from '$lib/state/simple/appState.svelte';

/**
 * App machine using simple state management
 */
export const appMachine = {
	id: 'app',
	initial: 'loading',
	states: {
		loading: {},
		ready: {},
		error: {}
	},
	// Compatibility layer
	getSnapshot() {
		return {
			value: appState.isReady ? 'ready' : 'loading',
			context: {
				currentTab: appState.currentTab,
				background: appState.background,
				isLoading: appState.isLoading
			}
		};
	}
};
