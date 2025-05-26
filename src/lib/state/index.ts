/**
 * State Management System
 *
 * This is the main entry point for the state management system.
 * It exports all the necessary components for managing application state.
 */

// Export core utilities
export * from './core/runesRegistry.svelte';

// Import at the top to avoid circular dependencies
import { runesStateRegistry } from './core/runesRegistry.svelte';
import { appActions } from './machines/app/app.actions';
import * as appSelectors from './machines/app/app.selectors';
import { appService as appActor } from './machines/app/app.machine';
import { sequenceActor, sequenceActions, sequenceSelectors } from './machines/sequenceMachine';

// Export state machines (excluding sequenceContainer to avoid ambiguity)
export { appMachine } from './machines';

// Modern runes-based state - no legacy stores

// Re-export specific machines for convenience
export { appActions, appSelectors, appActor };
export { sequenceActions, sequenceSelectors, sequenceActor };

/**
 * Initialize the state management system
 * This should be called early in the application lifecycle
 */
export function initializeStateManagement(): void {
	// Verify actors are registered before adding dependencies
	const registeredContainers = runesStateRegistry.getAll().map((container) => container.id);
	const hasSequenceActor = registeredContainers.includes('sequenceActor');
	const hasAppActor = registeredContainers.includes('appActor');

	// Modern runes registry doesn't need complex dependency management
	// Just ensure actors are started
	console.log('🚀 Initializing state management with runes registry');
	console.log('📊 Registry stats:', runesStateRegistry.getStats());

	// Explicitly start critical actors that must be running
	try {
		if (appActor && appActor.getSnapshot().status !== 'active') {
			appActor.start();
		}
	} catch (error) {
		console.error('Error starting appActor:', error);
	}

	try {
		if (sequenceActor && sequenceActor.getSnapshot().status !== 'active') {
			sequenceActor.start();
		}
	} catch (error) {
		console.error('Error starting sequenceActor:', error);
	}

	// Signal that the background is ready to start the app initialization
	appActions.backgroundReady();

	// Add global access for debugging in development
	if (import.meta.env.DEV && typeof window !== 'undefined') {
		(window as any).__STATE__ = {
			registry: runesStateRegistry,
			appActor,
			sequenceActor,
			appActions,
			sequenceActions,
			getState: (id: string) => {
				const container = runesStateRegistry.get(id);
				if (!container) return undefined;

				if (container.instance && 'getSnapshot' in container.instance) {
					return container.instance.getSnapshot();
				}

				return container.instance;
			}
		};
	}
}
