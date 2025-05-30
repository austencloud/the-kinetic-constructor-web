/**
 * State Machine Utilities - Svelte 5 Runes Implementation
 * Provides compatibility layer for XState-like patterns using pure Svelte 5
 */

import { browser } from '$app/environment';

export interface MachineConfig {
	id: string;
	initial: string;
	states: Record<string, any>;
	context?: any;
}

export interface MachineContainer {
	id: string;
	state: any;
	send: (event: string | { type: string; [key: string]: any }) => void;
	getSnapshot: () => any;
}

/**
 * Create a modern machine using Svelte 5 runes
 */
export function createModernMachine(config: MachineConfig): any {
	// Simple state machine implementation using runes
	let currentState = $state(config.initial);
	let context = $state(config.context || {});

	return {
		id: config.id,
		get state() {
			return currentState;
		},
		get context() {
			return context;
		},
		send(event: string | { type: string; [key: string]: any }) {
			const eventType = typeof event === 'string' ? event : event.type;
			console.log(`Machine ${config.id}: Received event ${eventType}`);
			// Simple state transitions would go here
		},
		getSnapshot() {
			return {
				value: currentState,
				context: context
			};
		}
	};
}

/**
 * Create a machine container
 */
export function createMachineContainer(machine: any): MachineContainer {
	return {
		id: machine.id,
		state: machine.state,
		send: machine.send,
		getSnapshot: machine.getSnapshot
	};
}

/**
 * Create a supervised machine (simplified)
 */
export function createSupervisedMachine(config: MachineConfig): any {
	return createModernMachine(config);
}
