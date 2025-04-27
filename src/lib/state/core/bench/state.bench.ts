import { bench, describe, beforeEach } from 'vitest';
import type { BenchFunction } from 'vitest';
import { createMachine } from 'xstate';
import { assertPerformance } from './utils';
import { createSupervisedMachine } from '../machine';
import { RestartStrategy, EscalateStrategy } from '../supervision/strategies';
import { RootSupervisor } from '../supervision/RootSupervisor';
import { stateRegistry } from '../registry';

type TaskFn = (fn: () => void) => void;

describe('State Management Performance', () => {
	beforeEach(() => {
		RootSupervisor.resetInstance();
		stateRegistry.clear();
	});

	describe('Actor Creation', () => {
		const testMachine = createMachine({
			id: 'test',
			initial: 'idle',
			states: { idle: {} }
		});

		bench('create supervised actor', (async ({ task }: { task: TaskFn }) => {
			await task(() => {
				createSupervisedMachine('bench-actor', testMachine, {
					strategy: new RestartStrategy()
				});
			});
		}) as BenchFunction);
	});

	describe('Actor Operations', () => {
		const actor = createSupervisedMachine(
			'bench-ops',
			createMachine({
				id: 'ops',
				initial: 'idle',
				states: {
					idle: { on: { NEXT: 'active' } },
					active: { on: { PREV: 'idle' } }
				}
			})
		);

		bench('send event', (async ({ task }: { task: TaskFn }) => {
			await task(() => {
				actor.send({ type: 'NEXT' });
				actor.send({ type: 'PREV' });
			});
		}) as BenchFunction);

		bench('get snapshot', (async ({ task }: { task: TaskFn }) => {
			await task(() => {
				actor.getSnapshot();
			});
		}) as BenchFunction);
	});

	describe('Registry Operations', () => {
		bench('register and unregister', (async ({ task }: { task: TaskFn }) => {
			await task(() => {
				const actor = createSupervisedMachine(
					'bench-reg',
					createMachine({
						id: 'reg',
						initial: 'idle',
						states: { idle: {} }
					})
				);
				stateRegistry.unregister('bench-reg');
			});
		}) as BenchFunction);
	});

	describe('Error Handling', () => {
		const actor = createSupervisedMachine(
			'bench-error',
			createMachine({
				id: 'error',
				initial: 'idle',
				states: { idle: {} }
			}),
			{
				strategy: new EscalateStrategy()
			}
		);

		bench('error reporting', (async ({ task }: { task: TaskFn }) => {
			await task(() => {
				actor.reportError(new Error('Benchmark error'));
			});
		}) as BenchFunction);
	});
});
