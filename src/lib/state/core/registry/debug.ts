/**
 * Debugging utilities for the state registry
 */
import { get, type Readable } from 'svelte/store';
import type { AnyActorRef } from 'xstate';
import type { StateContainer } from './types';

/**
 * Debug helper to log the current state of all containers
 */
export function debugRegistry(containers: StateContainer[]): void {
	// Debug logging only in development
	if (import.meta.env.DEV) {
		containers.forEach((container) => {
			try {
				const instance = container.instance;
				if (
					container.type === 'machine' &&
					instance &&
					typeof (instance as AnyActorRef).send === 'function'
				) {
					const actor = instance as AnyActorRef;
					actor.getSnapshot();
				} else if (container.type === 'store') {
					const store = instance as Readable<any>;
					get(store);
				}
			} catch (error) {
				console.error(`Error getting state for ${container.id}:`, error);
			}
		});
	}
}
