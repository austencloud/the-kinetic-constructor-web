import type { BenchFunction as Bench } from 'vitest';

interface BenchmarkResult {
	mean: number;
	p95: number;
}

interface BenchWithResult extends Bench {
	result?: BenchmarkResult;
}

export interface PerformanceBudget {
	mean: number;
	p95: number;
	margin: number;
}

export const defaultBudget: PerformanceBudget = {
	mean: 1,
	p95: 0.05,
	margin: process.env.CI ? 5 : 10
};

export function assertPerformance(
	bench: BenchWithResult,
	budget: PerformanceBudget = defaultBudget
) {
	if (!bench.result) return;

	if (!process.env.CI && !process.env.FORCE_PERF_ASSERTIONS) return;

	const mean = bench.result.mean * 1000;
	const p95 = bench.result.p95 * 1000;

	const marginMean = budget.mean * (1 + budget.margin / 100);
	const marginP95 = budget.p95 * (1 + budget.margin / 100);

	if (mean > marginMean) {
		throw new Error(
			`Performance budget exceeded: Mean time ${mean.toFixed(3)}ms exceeds budget ${budget.mean}ms (with ${budget.margin}% margin)`
		);
	}

	if (p95 > marginP95) {
		throw new Error(
			`Performance budget exceeded: P95 time ${p95.toFixed(3)}ms exceeds budget ${budget.p95}ms (with ${budget.margin}% margin)`
		);
	}
}

type BenchContext = { task: (fn: () => void) => Promise<void> };
type BenchFn = (this: Bench, ctx: BenchContext) => Promise<void> | void;

export function wrapBenchWithBudget(benchFn: BenchFn, budget?: PerformanceBudget): Bench {
	return function(this: Bench, ctx: BenchContext) {
		const result = benchFn.call(this, ctx);
		if (result instanceof Promise) {
			return result.then(() => {
				assertPerformance(this as BenchWithResult, budget);
			});
		}
		assertPerformance(this as BenchWithResult, budget);
		return result;
	} as Bench;
}
