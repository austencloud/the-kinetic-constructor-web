/**
 * Actor Supervision System - Supervisor
 *
 * This file contains the implementation of the supervisor that manages supervised actors.
 */

import { LogLevel, log } from '../logger';
import type {
	Supervisor as ISupervisor,
	SupervisedActor,
	SupervisionStrategy,
	SupervisionError
} from './types';
import { RestartStrategy } from './strategies';

/**
 * Implementation of a supervisor
 */
export class Supervisor implements ISupervisor {
	/**
	 * The unique ID of the supervisor
	 */
	public readonly id: string;

	/**
	 * The parent supervisor, if any
	 */
	public parent?: ISupervisor;

	/**
	 * The supervised actors managed by this supervisor
	 */
	public actors: Map<string, SupervisedActor<any>> = new Map();

	/**
	 * The default strategy to use for actors that don't specify one
	 */
	public defaultStrategy: SupervisionStrategy;

	/**
	 * Error handler for supervision errors
	 */
	private onError?: (error: SupervisionError) => void;

	/**
	 * Whether to enable debug logging
	 */
	private debug: boolean;

	constructor(
		id: string,
		options: {
			parent?: ISupervisor;
			defaultStrategy?: SupervisionStrategy;
			onError?: (error: SupervisionError) => void;
			debug?: boolean;
		} = {}
	) {
		this.id = id;
		this.parent = options.parent;
		this.defaultStrategy = options.defaultStrategy || new RestartStrategy();
		this.onError = options.onError;
		this.debug = options.debug || false;

		if (this.debug) {
			log(
				this.id,
				LogLevel.DEBUG,
				`[Supervisor] Created with parent: ${this.parent?.id || 'none'}`
			);
		}
	}

	/**
	 * Register an actor with this supervisor
	 */
	registerActor(actor: SupervisedActor<any>): void {
		if (this.actors.has(actor.id)) {
			log(
				this.id,
				LogLevel.WARN,
				`[Supervisor] Actor with ID ${actor.id} is already registered. Overwriting.`
			);
		}

		this.actors.set(actor.id, actor);

		if (this.debug) {
			log(this.id, LogLevel.DEBUG, `[Supervisor] Registered actor: ${actor.id}`);
		}
	}

	/**
	 * Unregister an actor from this supervisor
	 */
	unregisterActor(actorId: string): void {
		if (this.actors.has(actorId)) {
			this.actors.delete(actorId);

			if (this.debug) {
				log(this.id, LogLevel.DEBUG, `[Supervisor] Unregistered actor: ${actorId}`);
			}
		} else {
			log(this.id, LogLevel.WARN, `[Supervisor] Attempted to unregister unknown actor: ${actorId}`);
		}
	}

	/**
	 * Handle an error from a supervised actor
	 */
	async handleActorError(
		actor: SupervisedActor<any>,
		error: Error,
		context?: Record<string, any>
	): Promise<void> {
		if (this.debug) {
			log(
				this.id,
				LogLevel.DEBUG,
				`[Supervisor] Handling error for actor ${actor.id}:`,
				error.message
			);
		}

		// Call error handler if provided
		if (this.onError) {
			try {
				this.onError({
					error,
					actorId: actor.id,
					timestamp: Date.now(),
					actorState: actor.getSnapshot(),
					context
				});
			} catch (handlerError) {
				log(this.id, LogLevel.ERROR, `[Supervisor] Error in error handler:`, handlerError);
			}
		}

		// Apply the actor's strategy
		try {
			await actor.strategy.handleError(this, actor, error);
		} catch (strategyError) {
			log(
				this.id,
				LogLevel.ERROR,
				`[Supervisor] Error applying strategy for actor ${actor.id}:`,
				strategyError
			);

			// If the strategy fails, escalate to parent if available
			if (this.parent) {
				await this.escalateError(actor, strategyError as Error, {
					originalError: error,
					...context
				});
			} else {
				// No parent to escalate to, log the error
				log(
					this.id,
					LogLevel.ERROR,
					`[Supervisor] No parent supervisor to escalate error to. Error will be unhandled.`
				);

				// Re-throw the error
				throw strategyError;
			}
		}
	}

	/**
	 * Escalate an error to the parent supervisor
	 */
	async escalateError(
		actor: SupervisedActor<any>,
		error: Error,
		context?: Record<string, any>
	): Promise<void> {
		if (this.parent) {
			if (this.debug) {
				log(
					this.id,
					LogLevel.DEBUG,
					`[Supervisor] Escalating error for actor ${actor.id} to parent supervisor: ${this.parent.id}`
				);
			}

			await this.parent.handleActorError(actor, error, {
				escalatedFrom: this.id,
				...context
			});
		} else {
			log(this.id, LogLevel.ERROR, `[Supervisor] Cannot escalate error: no parent supervisor`);

			// Re-throw the error
			throw error;
		}
	}

	/**
	 * Stop all supervised actors
	 */
	async stopAllActors(): Promise<void> {
		const stopPromises: Promise<void>[] = [];

		for (const actor of this.actors.values()) {
			stopPromises.push(
				(async () => {
					try {
						await actor.stop();
					} catch (error) {
						log(this.id, LogLevel.ERROR, `[Supervisor] Error stopping actor ${actor.id}:`, error);
					}
				})()
			);
		}

		await Promise.all(stopPromises);
		this.actors.clear();

		if (this.debug) {
			log(this.id, LogLevel.DEBUG, `[Supervisor] Stopped all actors`);
		}
	}

	/**
	 * Get all supervised actors
	 */
	getAllActors(): SupervisedActor<any>[] {
		return Array.from(this.actors.values());
	}

	/**
	 * Get a supervised actor by ID
	 */
	getActor(actorId: string): SupervisedActor<any> | undefined {
		return this.actors.get(actorId);
	}
}
