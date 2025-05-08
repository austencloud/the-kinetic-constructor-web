/**
 * Modern state machine utilities
 *
 * This module provides utilities for working with XState v5 in a way that's
 * compatible with our new state management approach.
 */

import {
	createMachine as xstateCreateMachine,
	setup,
	createActor,
	type AnyActorRef,
	type AnyStateMachine,
	type ActorOptions
} from 'xstate';
import { stateRegistry } from './registry';
import { createContainer } from './container';

// Check if we're running in a Svelte 5 environment with runes support
const hasRunes = typeof globalThis.$state !== 'undefined';

/**
 * Creates an XState machine with improved ergonomics
 *
 * @param options Machine configuration options
 * @returns An XState machine
 */
export function createModernMachine<
	TContext extends Record<string, any>,
	TEvent extends { type: string }
>(options: {
	id: string;
	initial: string;
	context: TContext;
	states: Record<string, any>;
	actions?: Record<string, any>;
	services?: Record<string, any>;
	guards?: Record<string, any>;
}) {
	return setup({
		types: {} as {
			context: TContext;
			events: TEvent;
		},
		actions: options.actions || {},
		actors: options.services || {},
		guards: options.guards || {}
	}).createMachine({
		id: options.id,
		initial: options.initial,
		context: options.context,
		states: options.states
	});
}

/**
 * Creates a state container from an XState machine
 *
 * This provides a unified API for working with state machines that's
 * compatible with our container-based approach.
 *
 * @param machine An XState machine
 * @param options Actor options
 * @returns A state container wrapping the machine
 */
export function createMachineContainer<
	TMachine extends AnyStateMachine,
	TSnapshot = any,
	TEvent extends { type: string } = any
>(machine: TMachine, options: ActorOptions<TMachine> = {}) {
	// Create the actor
	const actor = createActor(machine, options);

	// Start the actor
	actor.start();

	if (hasRunes) {
		// Create a reactive state object using runes
		// @ts-ignore - $state is not recognized by TypeScript yet
		const state = $state({
			value: (actor.getSnapshot() as any).value,
			context: (actor.getSnapshot() as any).context,
			status: (actor.getSnapshot() as any).status
		});

		// Set up an effect to update the state when the actor changes
		// @ts-ignore - $effect is not recognized by TypeScript yet
		$effect(() => {
			const unsubscribe = actor.subscribe((snapshot) => {
				state.value = snapshot.value;
				state.context = snapshot.context;
				state.status = snapshot.status;
			});

			return unsubscribe;
		});

		// Create a container with the state and actions
		return {
			get state() {
				return state;
			},
			send: (event: TEvent) => actor.send(event),
			getSnapshot: () => actor.getSnapshot(),
			stop: () => actor.stop(),
			actor
		};
	} else {
		// For Svelte 4, use a container with a writable store
		return createContainer(
			{
				value: actor.getSnapshot().value,
				context: actor.getSnapshot().context,
				status: actor.getSnapshot().status
			},
			(state, update) => {
				// Set up subscription to update state
				actor.subscribe((snapshot) => {
					update(() => {
						state.value = snapshot.value;
						state.context = snapshot.context;
						state.status = snapshot.status;
					});
				});

				return {
					send: (event: TEvent) => actor.send(event),
					getSnapshot: () => actor.getSnapshot(),
					stop: () => actor.stop()
				};
			}
		);
	}
}

/**
 * Registers a machine with the state registry
 *
 * @param id The ID to register the machine under
 * @param machine The XState machine
 * @param options Registration options
 * @returns The actor
 */
export function registerModernMachine<TMachine extends AnyStateMachine>(
	id: string,
	machine: TMachine,
	options: {
		persist?: boolean;
		description?: string;
		actorOptions?: ActorOptions<TMachine>;
	} = {}
): AnyActorRef {
	// Create the actor
	const actor = createActor(machine, options.actorOptions);

	// Start the actor
	actor.start();

	// Register with the registry
	stateRegistry.registerMachine(id, machine, {
		persist: options.persist,
		description: options.description
	});

	return actor;
}
