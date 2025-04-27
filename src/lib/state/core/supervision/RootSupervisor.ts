/**
 * Actor Supervision System - Root Supervisor
 *
 * This file contains the implementation of the root supervisor that acts as the
 * top-level supervisor for the entire application.
 */

import { LogLevel, log } from '../logger';
import { Supervisor } from './Supervisor';
import { DefaultCircuitBreaker } from './CircuitBreaker';
import type {
	SupervisedActor,
	RootSupervisorOptions,
	CircuitBreaker,
	SupervisionError
} from './types';
import { RestartStrategy } from './strategies';

/**
 * Singleton instance of the root supervisor
 */
let rootSupervisorInstance: RootSupervisor | null = null;

/**
 * Implementation of the root supervisor
 */
export class RootSupervisor extends Supervisor {
	/**
	 * Circuit breaker for preventing cascading failures
	 */
	private circuitBreaker?: CircuitBreaker;

	/**
	 * Error history for global error tracking
	 */
	private errorHistory: SupervisionError[] = [];

	/**
	 * Maximum number of errors to keep in history
	 */
	private maxErrorHistory: number = 100;

	/**
	 * Create a new root supervisor
	 */
	private constructor(options: RootSupervisorOptions = {}) {
		super('root', {
			defaultStrategy: options.defaultStrategy || new RestartStrategy(),
			onError: options.onError,
			debug: options.debug
		});

		// Create circuit breaker if options provided
		if (options.circuitBreaker) {
			this.circuitBreaker = new DefaultCircuitBreaker('root', options.circuitBreaker);

			log(this.id, LogLevel.INFO, `[RootSupervisor] Initialized with circuit breaker`);
		}

		log(this.id, LogLevel.INFO, `[RootSupervisor] Initialized as the top-level supervisor`);
	}

	/**
	 * Get the singleton instance of the root supervisor
	 */
	static getInstance(options?: RootSupervisorOptions): RootSupervisor {
		if (!rootSupervisorInstance) {
			rootSupervisorInstance = new RootSupervisor(options);
		}
		return rootSupervisorInstance;
	}

	/**
	 * Reset the root supervisor (mainly for testing)
	 */
	static resetInstance(): void {
		if (rootSupervisorInstance) {
			rootSupervisorInstance.stopAllActors().catch((error) => {
				log('root', LogLevel.ERROR, `[RootSupervisor] Error stopping actors during reset:`, error);
			});

			if (rootSupervisorInstance.circuitBreaker) {
				(rootSupervisorInstance.circuitBreaker as DefaultCircuitBreaker).cleanup();
			}

			rootSupervisorInstance = null;
		}
	}

	/**
	 * Handle an error from a supervised actor
	 * Overrides the base implementation to add circuit breaker logic
	 */
	async handleActorError(
		actor: SupervisedActor<any>,
		error: Error,
		context?: Record<string, any>
	): Promise<void> {
		// Record the error in history
		const supervisionError: SupervisionError = {
			error,
			actorId: actor.id,
			timestamp: Date.now(),
			actorState: actor.getSnapshot(),
			context
		};

		this.errorHistory.unshift(supervisionError);

		// Trim error history if needed
		if (this.errorHistory.length > this.maxErrorHistory) {
			this.errorHistory = this.errorHistory.slice(0, this.maxErrorHistory);
		}

		// Check circuit breaker if available
		if (this.circuitBreaker) {
			// Record failure in circuit breaker
			this.circuitBreaker.recordFailure(error);

			// If circuit is open, don't process the error normally
			if (!this.circuitBreaker.isAllowed()) {
				log(
					this.id,
					LogLevel.WARN,
					`[RootSupervisor] Circuit breaker is open, fast-failing actor ${actor.id}`
				);

				// Stop the actor since we're in circuit breaker mode
				await actor.stop();
				return;
			}
		}

		// Process normally using parent implementation
		await super.handleActorError(actor, error, context);

		// If we get here without errors, record success in circuit breaker
		if (this.circuitBreaker) {
			this.circuitBreaker.recordSuccess();
		}
	}

	/**
	 * Escalate an error to the parent supervisor
	 * Since this is the root, there's no parent to escalate to
	 */
	async escalateError(
		actor: SupervisedActor<any>,
		error: Error,
		context?: Record<string, any>
	): Promise<void> {
		log(
			this.id,
			LogLevel.ERROR,
			`[RootSupervisor] Error escalated to root with no parent to handle it:`,
			error.message
		);

		// Record the error in history
		const supervisionError: SupervisionError = {
			error,
			actorId: actor.id,
			timestamp: Date.now(),
			actorState: actor.getSnapshot(),
			context: {
				escalatedToRoot: true,
				...context
			}
		};

		this.errorHistory.unshift(supervisionError);

		// Trim error history if needed
		if (this.errorHistory.length > this.maxErrorHistory) {
			this.errorHistory = this.errorHistory.slice(0, this.maxErrorHistory);
		}

		// Since we're the root, we have to handle it ourselves
		// Default behavior is to stop the actor
		try {
			await actor.stop();
		} catch (stopError) {
			log(
				this.id,
				LogLevel.ERROR,
				`[RootSupervisor] Error stopping actor ${actor.id} after escalation:`,
				stopError
			);
		}

		// Re-throw the error
		throw error;
	}

	/**
	 * Get the error history
	 */
	getErrorHistory(): SupervisionError[] {
		return [...this.errorHistory];
	}

	/**
	 * Clear the error history
	 */
	clearErrorHistory(): void {
		this.errorHistory = [];
	}

	/**
	 * Reset the circuit breaker
	 */
	resetCircuitBreaker(): void {
		if (this.circuitBreaker) {
			this.circuitBreaker.reset();
			log(this.id, LogLevel.INFO, `[RootSupervisor] Circuit breaker manually reset`);
		}
	}

	/**
	 * Get the circuit breaker state
	 */
	getCircuitBreakerState(): string | undefined {
		return this.circuitBreaker?.state;
	}
}
