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
	margin: 10
};

export function assertPerformance(
	bench: BenchWithResult,
	budget: PerformanceBudget = defaultBudget
) {
	if (!bench.result) return;

	const mean = bench.result.mean * 1000;
	const p95 = bench.result.p95 * 1000;

	const marginMean = budget.mean * (1 + budget.margin / 100);
	const marginP95 = budget.p95 * (1 + budget.margin / 100);

	if (mean > marginMean) {
		throw new Error(
			`Mean time ${mean.toFixed(3)}ms exceeds budget ${budget.mean}ms (with ${budget.margin}% margin)`
		);
	}

	if (p95 > marginP95) {
		throw new Error(
			`P95 time ${p95.toFixed(3)}ms exceeds budget ${budget.p95}ms (with ${budget.margin}% margin)`
		);
	}
}
