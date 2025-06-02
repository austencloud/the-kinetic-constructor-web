/**
 * Reactive Loop Validator
 * Comprehensive testing and monitoring for reactive loop elimination
 */

import { browser } from '$app/environment';

export interface ReactiveLoopReport {
	hasLoops: boolean;
	effectCount: number;
	maxExecutions: number;
	problematicEffects: string[];
	performanceMetrics: {
		renderTime: number;
		memoryUsage: number;
		timestamp: number;
	};
}

export class ReactiveLoopValidator {
	private effectCounts = new Map<string, number>();
	private effectTimestamps = new Map<string, number[]>();
	private isMonitoring = false;
	private originalEffect: any;
	private report: ReactiveLoopReport = {
		hasLoops: false,
		effectCount: 0,
		maxExecutions: 0,
		problematicEffects: [],
		performanceMetrics: {
			renderTime: 0,
			memoryUsage: 0,
			timestamp: Date.now()
		}
	};

	constructor() {
		this.setupMonitoring();
	}

	get currentReport(): ReactiveLoopReport {
		return this.report;
	}

	private setupMonitoring() {
		if (!browser) return;

		// Check if we're in a context where effects are available
		const svelteContext = (globalThis as any).__SVELTE__;
		if (!svelteContext?.effect) return;

		// Store original effect
		this.originalEffect = svelteContext.effect;

		// Monitor effect executions without using runes
		const self = this;
		svelteContext.effect = function (fn: Function) {
			const effectId = self.generateEffectId();
			self.effectCounts.set(effectId, 0);
			self.effectTimestamps.set(effectId, []);

			return self.originalEffect(() => {
				const count = self.effectCounts.get(effectId)! + 1;
				const now = Date.now();

				self.effectCounts.set(effectId, count);

				const timestamps = self.effectTimestamps.get(effectId)!;
				timestamps.push(now);

				const recentTimestamps = timestamps.filter((t) => now - t < 5000);
				self.effectTimestamps.set(effectId, recentTimestamps);

				if (count > 10) {
					console.error(`🚨 REACTIVE LOOP DETECTED: Effect ${effectId} executed ${count} times`);
					self.report.hasLoops = true;
					self.report.problematicEffects.push(effectId);

					if (typeof window !== 'undefined') {
						window.dispatchEvent(
							new CustomEvent('reactive-loop-detected', {
								detail: { effectId, count, timestamps: recentTimestamps }
							})
						);
					}
				}

				if (recentTimestamps.length > 20) {
					console.warn(
						`⚠️ HIGH FREQUENCY EFFECT: ${effectId} executed ${recentTimestamps.length} times in 5 seconds`
					);
				}

				self.updateReport();
				return fn();
			});
		};

		this.isMonitoring = true;
		console.log('✅ Reactive loop monitoring enabled');
	}

	private generateEffectId(): string {
		return Math.random().toString(36).substring(2, 11);
	}

	private updateReport() {
		const counts = Array.from(this.effectCounts.values());

		this.report.effectCount = this.effectCounts.size;
		this.report.maxExecutions = counts.length > 0 ? Math.max(...counts) : 0;
		this.report.hasLoops = counts.some((count) => count > 10);

		// Update performance metrics
		if (browser && 'memory' in performance) {
			this.report.performanceMetrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
		}

		this.report.performanceMetrics.timestamp = Date.now();
	}

	/**
	 * Run a comprehensive validation test
	 */
	async runValidationTest(): Promise<ReactiveLoopReport> {
		console.log('🧪 Starting reactive loop validation test...');

		const startTime = performance.now();

		// Reset counters
		this.reset();

		// Wait for effects to settle
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Measure render performance
		const renderStart = performance.now();

		// Trigger some state changes to test reactivity
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new Event('resize'));
			window.dispatchEvent(new CustomEvent('test-reactive-update'));
		}

		// Wait for effects to process
		await new Promise((resolve) => setTimeout(resolve, 500));

		const renderTime = performance.now() - renderStart;
		this.report.performanceMetrics.renderTime = renderTime;

		const totalTime = performance.now() - startTime;

		console.log(`✅ Validation test completed in ${totalTime.toFixed(2)}ms`);
		console.log(`📊 Results:`, {
			hasLoops: this.report.hasLoops,
			effectCount: this.report.effectCount,
			maxExecutions: this.report.maxExecutions,
			renderTime: renderTime.toFixed(2) + 'ms',
			memoryUsage: (this.report.performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2) + 'MB'
		});

		return this.report;
	}

	/**
	 * Reset monitoring counters
	 */
	reset() {
		this.effectCounts.clear();
		this.effectTimestamps.clear();
		this.report.hasLoops = false;
		this.report.effectCount = 0;
		this.report.maxExecutions = 0;
		this.report.problematicEffects = [];
		console.log('🔄 Reactive loop monitoring reset');
	}

	/**
	 * Stop monitoring and restore original $effect
	 */
	stop() {
		if (this.isMonitoring && this.originalEffect) {
			globalThis.$effect = this.originalEffect;
			this.isMonitoring = false;
			console.log('⏹️ Reactive loop monitoring stopped');
		}
	}

	/**
	 * Get detailed effect analysis
	 */
	getEffectAnalysis(): {
		totalEffects: number;
		averageExecutions: number;
		highFrequencyEffects: string[];
		suspiciousEffects: string[];
	} {
		const counts = Array.from(this.effectCounts.values());
		const totalEffects = counts.length;
		const averageExecutions =
			totalEffects > 0 ? counts.reduce((a, b) => a + b, 0) / totalEffects : 0;

		const highFrequencyEffects: string[] = [];
		const suspiciousEffects: string[] = [];

		this.effectCounts.forEach((count, effectId) => {
			if (count > 5) {
				highFrequencyEffects.push(effectId);
			}
			if (count > 10) {
				suspiciousEffects.push(effectId);
			}
		});

		return {
			totalEffects,
			averageExecutions,
			highFrequencyEffects,
			suspiciousEffects
		};
	}

	/**
	 * Generate a comprehensive report
	 */
	generateReport(): string {
		const analysis = this.getEffectAnalysis();

		return `
# Reactive Loop Validation Report

## Summary
- **Has Loops**: ${this.report.hasLoops ? '❌ YES' : '✅ NO'}
- **Total Effects**: ${analysis.totalEffects}
- **Max Executions**: ${this.report.maxExecutions}
- **Average Executions**: ${analysis.averageExecutions.toFixed(2)}

## Performance Metrics
- **Render Time**: ${this.report.performanceMetrics.renderTime.toFixed(2)}ms
- **Memory Usage**: ${(this.report.performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB
- **Timestamp**: ${new Date(this.report.performanceMetrics.timestamp).toISOString()}

## Effect Analysis
- **High Frequency Effects**: ${analysis.highFrequencyEffects.length}
- **Suspicious Effects**: ${analysis.suspiciousEffects.length}
- **Problematic Effects**: ${this.report.problematicEffects.length}

## Status
${
	this.report.hasLoops
		? '🚨 **REACTIVE LOOPS DETECTED** - Immediate attention required!'
		: '✅ **NO REACTIVE LOOPS** - Architecture is stable!'
}

## Recommendations
${
	this.report.hasLoops
		? '- Review problematic effects and convert to $derived patterns\n- Add proper untrack() usage\n- Implement debouncing for frequent updates'
		: '- Architecture is performing well\n- Continue monitoring during development\n- Consider performance optimizations if needed'
}
    `.trim();
	}
}

// Global validator instance
export const reactiveLoopValidator = new ReactiveLoopValidator();

// Utility function for quick validation
export async function validateReactiveLoops(): Promise<boolean> {
	const report = await reactiveLoopValidator.runValidationTest();
	return !report.hasLoops;
}

// Utility function for performance measurement
export function measureReactivePerformance<T>(name: string, fn: () => T): T {
	const start = performance.now();
	const result = fn();
	const duration = performance.now() - start;

	console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);

	if (duration > 100) {
		console.warn(`⚠️ Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
	}

	return result;
}
