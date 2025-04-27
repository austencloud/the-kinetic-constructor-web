/**
 * Actor Supervision System – Supervised Actor (v3)
 *
 * – removes `implements Actor<TMachine>` to avoid TS 2720 (cannot implement a *class*)
 * – `getPersistedSnapshot` now matches interface signature (returns `SnapshotFrom<TMachine> | undefined`)
 * – keeps `options` public to satisfy structural typing in tests
 */

import {
	createActor,
	type AnyStateMachine,
	// we no longer import the concrete `Actor` class
	type EventObject,
	type Observer,
	type ActorLogic,
	type ActorRefFrom,
	type SnapshotFrom
} from 'xstate';
import { LogLevel, log } from '../logger';
import type {
	SupervisedActor as ISupervisedActor,
	SupervisedActorOptions,
	ActorHealthMetrics,
	Supervisor
} from './types';
import { ActorHealthStatus } from './types';
import { RestartStrategy } from './strategies';

export class SupervisedActor<TMachine extends AnyStateMachine>
	implements ISupervisedActor<TMachine>
{
	// **only** the interface, not the concrete class
	/** public so the class is structurally compatible with the ISupervisedActor interface */
	public options: SupervisedActorOptions<TMachine>;

	public readonly id: string;

	private actor!: ReturnType<typeof createActor<TMachine>>; // late‑init
	private machine: TMachine;

	public strategy: RestartStrategy;
	public supervisor?: Supervisor;

	private healthMetrics: ActorHealthMetrics;
	private isRestarting = false;

	// ------------------------------------------------------------------
	//  Actor‑like surface delegated to the internal actor instance
	// ------------------------------------------------------------------
	public readonly logic!: TMachine;
	public readonly clock: any; // internal – xstate implementation detail
	public readonly ref!: ActorRefFrom<TMachine>;

	public subscribe!: ReturnType<typeof createActor<TMachine>>['subscribe'];
	public send!: ReturnType<typeof createActor<TMachine>>['send'];
	public on!: ReturnType<typeof createActor<TMachine>>['on'];

	constructor(
		id: string,
		machine: TMachine,
		options: SupervisedActorOptions<TMachine> = {},
		supervisor?: Supervisor
	) {
		this.id = id;
		this.machine = machine;
		this.options = options;
		this.supervisor = supervisor;

		this.strategy =
			((options.strategy || supervisor?.defaultStrategy) as RestartStrategy) ??
			new RestartStrategy();

		this.healthMetrics = {
			status: options.initialHealth ?? ActorHealthStatus.HEALTHY,
			errorCount: 0,
			restartCount: 0,
			uptime: 0,
			createdAt: Date.now()
		};

		// spin‑up underlying actor ---------------------------------------
		this.actor = createActor(machine, options);
		this.actor.start();

		// delegate API surface -------------------------------------------
		this.logic = this.actor.logic as unknown as TMachine;
		this.clock = (this.actor as any).clock;
		this.ref = this.actor as unknown as ActorRefFrom<TMachine>;

		this.subscribe = this.actor.subscribe.bind(this.actor);
		this.send = this.actor.send.bind(this.actor);
		this.on =
			(this.actor as any).on?.bind(this.actor) ??
			((() => ({ unsubscribe() {} })) as unknown as typeof this.on);

		log(this.id, LogLevel.DEBUG, `[SupervisedActor] created – strategy:`, this.strategy.type);
	}

	// ------------------------------------------------------------------
	// Health helpers
	// ------------------------------------------------------------------
	getHealthMetrics(): ActorHealthMetrics {
		this.healthMetrics.uptime = Date.now() - this.healthMetrics.createdAt;
		return { ...this.healthMetrics };
	}

	async restart(preserveState = true): Promise<void> {
		if (this.isRestarting) return;
		this.isRestarting = true;

		try {
			const snapshot = preserveState ? this.actor.getSnapshot() : undefined;
			this.actor.stop();

			const opts: SupervisedActorOptions<TMachine> = { ...this.options, snapshot };
			this.actor = createActor(this.machine, opts);
			this.actor.start();

			// re‑delegate after swap
			this.subscribe = this.actor.subscribe.bind(this.actor);
			this.send = this.actor.send.bind(this.actor);
			this.on =
				(this.actor as any).on?.bind(this.actor) ??
				((() => ({ unsubscribe() {} })) as unknown as typeof this.on);

			this.healthMetrics.restartCount++;
			this.healthMetrics.lastRestartTime = Date.now();

			this.options.onRestart?.(this as any);
		} finally {
			this.isRestarting = false;
		}
	}

	// ------------------------------------------------------------------
	// API helpers
	// ------------------------------------------------------------------
	getMachine(): TMachine {
		return this.machine;
	}
	getOptions(): SupervisedActorOptions<TMachine> {
		return { ...this.options };
	}

	reportError(error: Error, context?: Record<string, any>): void {
		this.healthMetrics.errorCount++;
		this.healthMetrics.lastErrorTime = Date.now();
		this.healthMetrics.lastError = error;
		this.healthMetrics.status = ActorHealthStatus.DEGRADED;

		this.options.onError?.({
			error,
			actorId: this.id,
			timestamp: Date.now(),
			actorState: this.actor.getSnapshot(),
			context
		});

		if (this.supervisor) {
			void this.supervisor.handleActorError(this as any, error, context);
		} else {
			void this.strategy.handleError(
				{
					id: 'anonymous',
					actors: new Map(),
					defaultStrategy: this.strategy,
					registerActor() {},
					unregisterActor() {},
					handleActorError: async () => {},
					escalateError: async () => {},
					stopAllActors: async () => {},
					getAllActors: () => [],
					getActor: () => undefined
				},
				this as any,
				error
			);
		}
	}

	/* -------------------------------------------------------------- */
	/*  Persistence helpers                                           */
	/* -------------------------------------------------------------- */
	getPersistedSnapshot(): SnapshotFrom<TMachine> | undefined {
		return (this.actor as any).getPersistedSnapshot?.() as SnapshotFrom<TMachine> | undefined;
	}

	/* -------------------------------------------------------------- */
	/*  minimal facade (subset of Actor API)                          */
	/* -------------------------------------------------------------- */
	start() {
		this.actor.start();
		return this;
	}

	stop() {
		this.healthMetrics.status = ActorHealthStatus.STOPPED;
		this.options.onStop?.(this as any);
		this.actor.stop();
		return this;
	}

	getSnapshot = () => this.actor.getSnapshot();
	get [Symbol.observable]() {
		return (this.actor as any)[Symbol.observable];
	}
	get sessionId() {
		return (this.actor as any).sessionId;
	}
	get src() {
		return (this.actor as any).src;
	}
	get system() {
		return (this.actor as any).system;
	}

	toJSON() {
		return this.actor.toJSON();
	}
}
