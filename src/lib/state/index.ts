/**
 * State Management System - MIGRATED TO PURE SVELTE 5 RUNES
 *
 * This is the main entry point for the state management system.
 * MIGRATION: Replaced XState machines with simple Svelte 5 runes state.
 */

// MIGRATION: Export simple runes-based state instead of XState
import { appState } from './simple/appState.svelte';
import { sequenceState } from './simple/sequenceState.svelte';

// Export simple state
export { appState };
export { sequenceState };

// LEGACY: XState exports (commented out during migration)
// export * from './core/runesRegistry.svelte';
// import { runesStateRegistry } from './core/runesRegistry.svelte';
// import { appActions } from './machines/app/app.actions';
// import * as appSelectors from './machines/app/app.selectors';
// import { appService as appActor } from './machines/app/app.machine';
// import { sequenceActor, sequenceActions, sequenceSelectors } from './machines/sequenceMachine';
// export { appMachine } from './machines';
// export { appActions, appSelectors, appActor };
// export { sequenceActions, sequenceSelectors, sequenceActor };

/**
 * Initialize the state management system - SIMPLIFIED FOR RUNES
 * This should be called early in the application lifecycle
 */
export function initializeStateManagement(): void {
	// MIGRATION: Simple runes-based state doesn't need complex initialization
	// Just log that we're using the new system - DISABLED FOR DEBUGGING
	// console.log('🚀 Initializing state management with runes registry');
	// console.log('📊 Registry stats: {total: 2, machines: 0, containers: 0, states: 2, persisted: 0}');

	// Add global access for debugging in development
	if (import.meta.env.DEV && typeof window !== 'undefined') {
		(window as any).__STATE__ = {
			appState,
			sequenceState,
			getAppState: () => ({
				currentTab: appState.currentTab,
				isLoading: appState.isLoading,
				isSettingsOpen: appState.isSettingsOpen,
				backgroundIsReady: appState.backgroundIsReady
			}),
			getSequenceState: () => ({
				beatCount: sequenceState.beatCount,
				isEmpty: sequenceState.isEmpty,
				isGenerating: sequenceState.isGenerating,
				hasSelection: sequenceState.hasSelection
			})
		};
	}
}
