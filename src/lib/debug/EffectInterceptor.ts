/**
 * Surgical Effect Interceptor
 * Uses Svelte's development mode hooks to intercept ALL effect executions
 */

interface EffectTrace {
	id: string;
	component: string;
	effectType: 'effect' | 'derived' | 'state';
	timestamp: number;
	stackTrace: string;
	executionCount: number;
	isInfiniteLoop: boolean;
}

class EffectInterceptor {
	private static instance: EffectInterceptor;
	private traces: EffectTrace[] = [];
	private effectCounts = new Map<string, number>();
	private isActive = false;
	private loopThreshold = 15;

	static getInstance(): EffectInterceptor {
		if (!EffectInterceptor.instance) {
			EffectInterceptor.instance = new EffectInterceptor();
		}
		return EffectInterceptor.instance;
	}

	/**
	 * Start intercepting ALL reactive effects
	 */
	startInterception(): void {
		if (this.isActive) {
			console.warn('🔬 Effect interception already active');
			return;
		}

		console.log('🚀 STARTING SURGICAL EFFECT INTERCEPTION');
		this.isActive = true;
		this.traces = [];
		this.effectCounts.clear();

		// Method 1: Intercept through development mode
		this.enableDevelopmentMode();
		
		// Method 2: Patch Function.prototype to catch all function calls
		this.patchFunctionPrototype();
		
		// Method 3: Use MutationObserver to detect DOM changes from effects
		this.setupDOMObserver();
		
		// Method 4: Intercept Promise.resolve (effects often use microtasks)
		this.interceptPromises();

		console.log('✅ All interception methods active');
	}

	/**
	 * Stop interception and generate report
	 */
	stopInterception(): EffectTrace[] {
		if (!this.isActive) return [];

		console.log('🛑 STOPPING EFFECT INTERCEPTION');
		this.isActive = false;
		this.restoreOriginals();
		
		const report = this.generateReport();
		return report;
	}

	private enableDevelopmentMode(): void {
		// Enable Svelte development mode if not already enabled
		if (typeof window !== 'undefined') {
			(window as any).__svelte = { dev: true };
		}
	}

	private originalCall: Function | null = null;
	private originalApply: Function | null = null;

	private patchFunctionPrototype(): void {
		// Store originals
		this.originalCall = Function.prototype.call;
		this.originalApply = Function.prototype.apply;

		// Patch Function.prototype.call
		Function.prototype.call = function(thisArg: any, ...args: any[]) {
			const result = EffectInterceptor.getInstance().interceptFunctionCall(this, thisArg, args, 'call');
			return result;
		};

		// Patch Function.prototype.apply  
		Function.prototype.apply = function(thisArg: any, args: any[]) {
			const result = EffectInterceptor.getInstance().interceptFunctionCall(this, thisArg, args, 'apply');
			return result;
		};
	}

	private interceptFunctionCall(fn: Function, thisArg: any, args: any[], method: string): any {
		// Check if this looks like an effect function
		const fnString = fn.toString();
		const stack = new Error().stack || '';
		
		const isEffect = this.isEffectFunction(fnString, stack);
		
		if (isEffect && this.isActive) {
			const trace = this.createTrace(fn, stack);
			this.recordTrace(trace);
		}

		// Call original function
		if (method === 'call') {
			return this.originalCall!.call(fn, thisArg, ...args);
		} else {
			return this.originalApply!.call(fn, thisArg, args);
		}
	}

	private isEffectFunction(fnString: string, stack: string): boolean {
		// Look for effect patterns in function string and stack
		const effectPatterns = [
			'$effect',
			'$derived',
			'$state',
			'effect(',
			'derived(',
			'state(',
			'reactive',
			'untrack',
			'svelte/internal'
		];

		return effectPatterns.some(pattern => 
			fnString.includes(pattern) || stack.includes(pattern)
		);
	}

	private createTrace(fn: Function, stack: string): EffectTrace {
		const component = this.extractComponentName(stack);
		const effectType = this.determineEffectType(fn.toString(), stack);
		const id = `${component}_${effectType}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
		
		const executionCount = this.incrementExecutionCount(id);
		
		return {
			id,
			component,
			effectType,
			timestamp: performance.now(),
			stackTrace: stack,
			executionCount,
			isInfiniteLoop: executionCount > this.loopThreshold
		};
	}

	private extractComponentName(stack: string): string {
		const lines = stack.split('\n');
		
		for (const line of lines) {
			// Look for .svelte files
			const svelteMatch = line.match(/([A-Za-z0-9]+)\.svelte/);
			if (svelteMatch) {
				return svelteMatch[1];
			}
			
			// Look for component-like patterns
			const componentMatch = line.match(/at ([A-Z][A-Za-z0-9]+)/);
			if (componentMatch) {
				return componentMatch[1];
			}
		}
		
		return 'Unknown';
	}

	private determineEffectType(fnString: string, stack: string): 'effect' | 'derived' | 'state' {
		if (fnString.includes('$effect') || stack.includes('effect')) return 'effect';
		if (fnString.includes('$derived') || stack.includes('derived')) return 'derived';
		return 'state';
	}

	private incrementExecutionCount(id: string): number {
		const baseId = id.split('_').slice(0, 2).join('_'); // component_effectType
		const count = (this.effectCounts.get(baseId) || 0) + 1;
		this.effectCounts.set(baseId, count);
		return count;
	}

	private recordTrace(trace: EffectTrace): void {
		this.traces.push(trace);
		
		// Log immediately for real-time monitoring
		const status = trace.isInfiniteLoop ? '🚨 INFINITE' : trace.executionCount > 5 ? '⚠️ FREQUENT' : '✅ NORMAL';
		console.log(`🔬 ${status} ${trace.component}.${trace.effectType} [${trace.executionCount}x]`);
		
		// If infinite loop detected, generate immediate report
		if (trace.isInfiniteLoop) {
			console.error(`🚨 INFINITE LOOP DETECTED: ${trace.component}.${trace.effectType}`);
			this.generateImmediateReport(trace);
		}
		
		// Keep only recent traces to prevent memory issues
		if (this.traces.length > 1000) {
			this.traces = this.traces.slice(-500);
		}
	}

	private setupDOMObserver(): void {
		if (typeof window === 'undefined') return;

		const observer = new MutationObserver((mutations) => {
			if (!this.isActive) return;
			
			mutations.forEach((mutation) => {
				// DOM changes often indicate effect executions
				const trace: EffectTrace = {
					id: `dom_mutation_${Date.now()}`,
					component: 'DOM',
					effectType: 'effect',
					timestamp: performance.now(),
					stackTrace: new Error().stack || '',
					executionCount: 1,
					isInfiniteLoop: false
				};
				
				this.traces.push(trace);
			});
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true
		});
	}

	private originalPromiseResolve: Function | null = null;

	private interceptPromises(): void {
		this.originalPromiseResolve = Promise.resolve;
		
		Promise.resolve = function<T>(value?: T | PromiseLike<T>): Promise<T> {
			const stack = new Error().stack || '';
			
			if (EffectInterceptor.getInstance().isActive && 
				EffectInterceptor.getInstance().isEffectFunction('', stack)) {
				
				const trace: EffectTrace = {
					id: `promise_${Date.now()}`,
					component: EffectInterceptor.getInstance().extractComponentName(stack),
					effectType: 'effect',
					timestamp: performance.now(),
					stackTrace: stack,
					executionCount: 1,
					isInfiniteLoop: false
				};
				
				EffectInterceptor.getInstance().traces.push(trace);
			}
			
			return EffectInterceptor.getInstance().originalPromiseResolve!.call(Promise, value);
		};
	}

	private generateImmediateReport(loopTrace: EffectTrace): void {
		console.group(`🚨 IMMEDIATE INFINITE LOOP REPORT: ${loopTrace.component}.${loopTrace.effectType}`);
		
		console.log('📊 Loop Details:');
		console.log(`Component: ${loopTrace.component}`);
		console.log(`Effect Type: ${loopTrace.effectType}`);
		console.log(`Execution Count: ${loopTrace.executionCount}`);
		console.log(`Timestamp: ${loopTrace.timestamp.toFixed(2)}ms`);
		
		console.log('\n📋 Stack Trace:');
		console.log(loopTrace.stackTrace);
		
		console.log('\n📈 Recent Related Traces:');
		const relatedTraces = this.traces
			.filter(t => t.component === loopTrace.component)
			.slice(-10);
		
		relatedTraces.forEach((trace, index) => {
			console.log(`${index + 1}. ${trace.effectType} [${trace.executionCount}x] at ${trace.timestamp.toFixed(2)}ms`);
		});
		
		console.groupEnd();
	}

	private generateReport(): EffectTrace[] {
		console.group('🔬 SURGICAL EFFECT INTERCEPTION REPORT');
		
		console.log(`📊 Total traces captured: ${this.traces.length}`);
		
		// Find most frequent effects
		const frequencyMap = new Map<string, number>();
		this.traces.forEach(trace => {
			const key = `${trace.component}.${trace.effectType}`;
			frequencyMap.set(key, (frequencyMap.get(key) || 0) + 1);
		});
		
		const sortedFrequencies = Array.from(frequencyMap.entries())
			.sort(([,a], [,b]) => b - a)
			.slice(0, 10);
		
		console.log('\n📈 Most Frequent Effects:');
		sortedFrequencies.forEach(([effect, count]) => {
			const status = count > this.loopThreshold ? '🚨 INFINITE' : count > 5 ? '⚠️ SUSPICIOUS' : '✅ NORMAL';
			console.log(`${status} ${effect}: ${count}x`);
		});
		
		// Find infinite loops
		const infiniteLoops = this.traces.filter(t => t.isInfiniteLoop);
		if (infiniteLoops.length > 0) {
			console.log('\n🚨 INFINITE LOOPS DETECTED:');
			infiniteLoops.forEach(loop => {
				console.log(`- ${loop.component}.${loop.effectType} [${loop.executionCount}x]`);
			});
		}
		
		console.groupEnd();
		return this.traces;
	}

	private restoreOriginals(): void {
		if (this.originalCall) {
			Function.prototype.call = this.originalCall;
		}
		if (this.originalApply) {
			Function.prototype.apply = this.originalApply;
		}
		if (this.originalPromiseResolve) {
			Promise.resolve = this.originalPromiseResolve;
		}
	}
}

// Global access
export const effectInterceptor = {
	start: () => EffectInterceptor.getInstance().startInterception(),
	stop: () => EffectInterceptor.getInstance().stopInterception(),
	getInstance: () => EffectInterceptor.getInstance()
};

// Auto-expose to window
if (typeof window !== 'undefined') {
	(window as any).effectInterceptor = effectInterceptor;
}
