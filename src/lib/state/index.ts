/**
 * State Management System
 *
 * This is the main entry point for the state management system.
 * It exports all the necessary components for managing application state.
 */

// Export core utilities
export * from './core/store';
export * from './core/registry';

// Import at the top to avoid circular dependencies
import { stateRegistry } from './core/registry';
import { appActor, appActions, appSelectors } from './machines/appMachine';
import { sequenceActor, sequenceActions, sequenceSelectors } from './machines/sequenceMachine';

// Export state machines
export * from './machines';

// Export stores
export * from './stores/sequenceStore';
export * from './stores/uiStore';

// Re-export specific machines for convenience
export { appActions, appSelectors, appActor };
export { sequenceActions, sequenceSelectors, sequenceActor };

/**
 * Initialize the state management system
 * This should be called early in the application lifecycle
 */
export function initializeStateManagement(): void {
	// Ensure the app actor is started
	if (appActor && appActor.getSnapshot().status !== 'active') {
		console.log('Starting app actor');
		appActor.start();
	}

	// Ensure the sequence actor is started
	if (sequenceActor && sequenceActor.getSnapshot().status !== 'active') {
		console.log('Starting sequence actor');
		sequenceActor.start();
	}

	// Signal that the background is ready to start the app initialization
	appActions.backgroundReady();

	// Add global access for debugging in development
	if (import.meta.env.DEV && typeof window !== 'undefined') {
		(window as any).__STATE__ = {
			registry: stateRegistry,
			appActor,
			sequenceActor,
			appActions,
			sequenceActions,
			getState: (id: string) => {
				const container = stateRegistry.get(id);
				if (!container) return undefined;

				if ('getSnapshot' in container) {
					return container.getSnapshot();
				} else if ('subscribe' in container) {
					// It's a store
					const { subscribe } = container as { subscribe: any };
					let value: any;
					const unsubscribe = subscribe((v: any) => {
						value = v;
					});
					unsubscribe();
					return value;
				}

				return undefined;
			}
		};
	}

	console.log('State management system initialized');
}
