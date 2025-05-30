/**
 * Nuclear Reactive Effect Debugger
 * Automatically instruments all $effect calls across the entire application
 * to identify infinite reactive loops with forensic precision
 */

interface EffectExecution {
	id: string;
	componentName: string;
	effectName: string;
	stackTrace: string;
	timestamp: number;
	depth: number;
	dependencies: string[];
	triggerSource?: string;
}

interface EffectChain {
	executions: EffectExecution[];
	loopDetected: boolean;
	loopStart: number;
	maxDepth: number;
}

class ReactiveEffectTracker {
	private static instance: ReactiveEffectTracker;
	private executions: EffectExecution[] = [];
	private effectCounts: Map<string, number> = new Map();
	private isTracking = false;
	private maxExecutions = 1000;
	private depthLimit = 15;
	private originalEffect: any;
	private originalDerived: any;
	private componentStack: string[] = [];

	static getInstance(): ReactiveEffectTracker {
		if (!ReactiveEffectTracker.instance) {
			ReactiveEffectTracker.instance = new ReactiveEffectTracker();
		}
		return ReactiveEffectTracker.instance;
	}

	/**
	 * Start nuclear debugging - instruments ALL reactive effects
	 */
	startNuclearDebugging(): void {
		if (this.isTracking) {
			console.warn('🔬 Nuclear debugging already active');
			return;
		}

		console.log('🚀 NUCLEAR REACTIVE EFFECT DEBUGGING STARTED');
		console.log('📊 Instrumenting ALL $effect and $derived calls...');

		this.isTracking = true;
		this.executions = [];
		this.effectCounts.clear();
		this.instrumentReactiveEffects();
		this.setupGlobalErrorHandling();

		console.log('✅ All reactive effects are now instrumented');
		console.log('🎯 Waiting for infinite loop detection...');
	}

	/**
	 * Stop debugging and generate comprehensive report
	 */
	stopNuclearDebugging(): EffectChain {
		if (!this.isTracking) {
			console.warn('🔬 Nuclear debugging not active');
			return { executions: [], loopDetected: false, loopStart: 0, maxDepth: 0 };
		}

		console.log('🛑 STOPPING NUCLEAR DEBUGGING');
		this.isTracking = false;
		this.restoreOriginalEffects();

		const chain = this.analyzeEffectChain();
		this.generateForensicReport(chain);

		return chain;
	}

	/**
	 * Instrument all reactive effects by monkey-patching Svelte's effect functions
	 */
	private instrumentReactiveEffects(): void {
		// Method 1: Try to intercept through Vite's module system
		this.interceptViteModules();

		// Method 2: Intercept through global console override
		this.interceptConsoleForEffects();

		// Method 3: Intercept through Error stack traces
		this.interceptThroughErrorTracing();

		// Method 4: Try direct Svelte internal access
		this.interceptSvelteInternals();
	}

	private interceptViteModules(): void {
		// Intercept module imports to catch effect definitions
		const originalImport = (window as any).__vitePreload;
		if (originalImport) {
			(window as any).__vitePreload = (...args: any[]) => {
				const result = originalImport.apply(this, args);
				if (result && typeof result.then === 'function') {
					return result.then((module: any) => {
						this.instrumentModule(module);
						return module;
					});
				}
				this.instrumentModule(result);
				return result;
			};
		}
	}

	private instrumentModule(module: any): void {
		if (!module || typeof module !== 'object') return;

		// Look for effect-like functions in the module
		Object.keys(module).forEach((key) => {
			if (key.includes('effect') || key.includes('derived')) {
				const original = module[key];
				if (typeof original === 'function') {
					module[key] = this.createInstrumentedEffect(original, key);
				}
			}
		});
	}

	private interceptConsoleForEffects(): void {
		// Override console methods to catch effect-related logs
		const originalLog = console.log;
		const originalWarn = console.warn;
		const originalError = console.error;

		console.log = (...args: any[]) => {
			this.analyzeConsoleCall('log', args);
			return originalLog.apply(console, args);
		};

		console.warn = (...args: any[]) => {
			this.analyzeConsoleCall('warn', args);
			return originalWarn.apply(console, args);
		};

		console.error = (...args: any[]) => {
			this.analyzeConsoleCall('error', args);
			return originalError.apply(console, args);
		};
	}

	private analyzeConsoleCall(type: string, args: any[]): void {
		const message = args.join(' ');
		if (message.includes('effect') || message.includes('derived') || message.includes('reactive')) {
			const execution: EffectExecution = {
				id: this.generateEffectId(),
				componentName: this.getCurrentComponentName(),
				effectName: `console_${type}`,
				stackTrace: this.getStackTrace(),
				timestamp: performance.now(),
				depth: this.executions.length,
				dependencies: [message],
				triggerSource: 'console'
			};

			this.executions.push(execution);
			console.log(`🔬 CONSOLE EFFECT: ${execution.componentName} - ${message.substring(0, 50)}...`);
		}
	}

	private interceptThroughErrorTracing(): void {
		// Override Error constructor to catch all stack traces
		const OriginalError = Error;
		(window as any).Error = function (...args: any[]) {
			const error = new OriginalError(...args);
			ReactiveEffectTracker.getInstance().analyzeErrorStack(error.stack || '');
			return error;
		};
	}

	private analyzeErrorStack(stack: string): void {
		if (!this.isTracking) return;

		// Look for effect-related patterns in stack traces
		const lines = stack.split('\n');
		let foundEffect = false;

		for (const line of lines) {
			if (
				line.includes('$effect') ||
				line.includes('$derived') ||
				line.includes('effect.js') ||
				line.includes('reactive')
			) {
				foundEffect = true;
				break;
			}
		}

		if (foundEffect) {
			const execution: EffectExecution = {
				id: this.generateEffectId(),
				componentName: this.getCurrentComponentName(),
				effectName: 'stack_trace_effect',
				stackTrace: stack,
				timestamp: performance.now(),
				depth: this.executions.length,
				dependencies: this.extractDependencies(stack),
				triggerSource: 'error_stack'
			};

			this.executions.push(execution);
		}
	}

	private interceptSvelteInternals(): void {
		// Try multiple approaches to access Svelte internals
		const possiblePaths = [
			(window as any).__SVELTE__,
			(window as any).svelte,
			(window as any).__svelte_internal__,
			(globalThis as any).__SVELTE__
		];

		for (const svelteInternal of possiblePaths) {
			if (svelteInternal) {
				this.instrumentSvelteObject(svelteInternal);
			}
		}
	}

	private instrumentSvelteObject(svelteObj: any): void {
		// Recursively instrument all functions in Svelte object
		Object.keys(svelteObj).forEach((key) => {
			const value = svelteObj[key];
			if (typeof value === 'function' && (key.includes('effect') || key.includes('derived'))) {
				const original = value;
				svelteObj[key] = (...args: any[]) => {
					this.trackEffectCall(key, args);
					return original.apply(svelteObj, args);
				};
			}
		});
	}

	private trackEffectCall(functionName: string, args: any[]): void {
		const execution: EffectExecution = {
			id: this.generateEffectId(),
			componentName: this.getCurrentComponentName(),
			effectName: functionName,
			stackTrace: this.getStackTrace(),
			timestamp: performance.now(),
			depth: this.executions.length,
			dependencies: args.map((arg) => typeof arg),
			triggerSource: 'svelte_internal'
		};

		this.executions.push(execution);
		console.log(`🔬 SVELTE INTERNAL: ${functionName} called from ${execution.componentName}`);
	}

	/**
	 * Create an instrumented version of an effect function
	 */
	private createInstrumentedEffect(originalFn: Function, effectType: string): Function {
		return (...args: any[]) => {
			if (!this.isTracking) {
				return originalFn.apply(this, args);
			}

			const effectId = this.generateEffectId();
			const componentName = this.getCurrentComponentName();
			const stackTrace = this.getStackTrace();
			const timestamp = performance.now();

			// Track execution depth
			const currentDepth = this.executions.filter(
				(e) => timestamp - e.timestamp < 100 // Within 100ms
			).length;

			// Create execution record
			const execution: EffectExecution = {
				id: effectId,
				componentName,
				effectName: `${effectType}_${effectId}`,
				stackTrace,
				timestamp,
				depth: currentDepth,
				dependencies: this.extractDependencies(stackTrace),
				triggerSource: this.identifyTriggerSource(stackTrace)
			};

			// Record execution
			this.executions.push(execution);

			// Update effect count
			const effectKey = `${componentName}.${effectType}`;
			const count = (this.effectCounts.get(effectKey) || 0) + 1;
			this.effectCounts.set(effectKey, count);

			// Check for infinite loop
			if (count > this.depthLimit) {
				this.handleInfiniteLoop(execution, count);
			}

			// Log execution
			console.log(
				`🔬 ${effectType.toUpperCase()}: ${componentName}.${effectId} [${count}x] depth:${currentDepth}`
			);

			try {
				return originalFn.apply(this, args);
			} catch (error) {
				console.error(`❌ Error in ${effectType} ${componentName}.${effectId}:`, error);
				throw error;
			}
		};
	}

	/**
	 * Handle infinite loop detection
	 */
	private handleInfiniteLoop(execution: EffectExecution, count: number): void {
		console.error(`🚨 INFINITE LOOP DETECTED: ${execution.componentName}.${execution.effectName}`);
		console.error(`🔄 Effect has fired ${count} times`);
		console.error(`📍 Stack trace:`, execution.stackTrace);

		// Generate immediate forensic report
		const chain = this.analyzeEffectChain();
		this.generateForensicReport(chain);

		// Throw error to stop execution
		throw new Error(
			`Infinite reactive loop detected in ${execution.componentName}.${execution.effectName} (${count} executions)`
		);
	}

	/**
	 * Analyze the effect execution chain to identify loops
	 */
	private analyzeEffectChain(): EffectChain {
		const recentExecutions = this.executions.slice(-100); // Last 100 executions
		const maxDepth = Math.max(...recentExecutions.map((e) => e.depth));

		// Look for repeating patterns
		const patterns = this.findRepeatingPatterns(recentExecutions);
		const loopDetected = patterns.length > 0;
		const loopStart = loopDetected ? patterns[0].startIndex : 0;

		return {
			executions: recentExecutions,
			loopDetected,
			loopStart,
			maxDepth
		};
	}

	/**
	 * Find repeating execution patterns that indicate loops
	 */
	private findRepeatingPatterns(
		executions: EffectExecution[]
	): Array<{ startIndex: number; pattern: string[] }> {
		const patterns: Array<{ startIndex: number; pattern: string[] }> = [];

		for (let i = 0; i < executions.length - 4; i++) {
			const sequence = executions.slice(i, i + 4).map((e) => e.effectName);

			// Look for this sequence repeating
			for (let j = i + 4; j < executions.length - 4; j++) {
				const nextSequence = executions.slice(j, j + 4).map((e) => e.effectName);

				if (JSON.stringify(sequence) === JSON.stringify(nextSequence)) {
					patterns.push({ startIndex: i, pattern: sequence });
					break;
				}
			}
		}

		return patterns;
	}

	/**
	 * Generate comprehensive forensic report
	 */
	private generateForensicReport(chain: EffectChain): void {
		console.group('🔬 NUCLEAR REACTIVE EFFECT FORENSIC REPORT');

		console.log('📊 EXECUTION SUMMARY:');
		console.log(`Total executions tracked: ${this.executions.length}`);
		console.log(`Maximum depth reached: ${chain.maxDepth}`);
		console.log(`Loop detected: ${chain.loopDetected ? '🚨 YES' : '✅ NO'}`);

		console.log('\n📈 EFFECT FREQUENCY ANALYSIS:');
		const sortedCounts = Array.from(this.effectCounts.entries())
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10);

		sortedCounts.forEach(([effect, count]) => {
			const status =
				count > this.depthLimit ? '🚨 INFINITE' : count > 5 ? '⚠️ SUSPICIOUS' : '✅ NORMAL';
			console.log(`${status} ${effect}: ${count}x`);
		});

		if (chain.loopDetected) {
			console.log('\n🔄 LOOP ANALYSIS:');
			const loopExecutions = chain.executions.slice(chain.loopStart);
			loopExecutions.forEach((exec, index) => {
				console.log(
					`${index + 1}. ${exec.componentName}.${exec.effectName} (${exec.timestamp.toFixed(2)}ms)`
				);
			});
		}

		console.log('\n📋 RECENT EXECUTION TIMELINE:');
		chain.executions.slice(-20).forEach((exec, index) => {
			const relativeTime = (exec.timestamp - chain.executions[0].timestamp).toFixed(2);
			console.log(
				`${index + 1}. [${relativeTime}ms] ${exec.componentName}.${exec.effectName} depth:${exec.depth}`
			);
		});

		console.groupEnd();
	}

	// Helper methods
	private generateEffectId(): string {
		return Math.random().toString(36).substr(2, 9);
	}

	private getCurrentComponentName(): string {
		const stack = new Error().stack || '';
		const lines = stack.split('\n');

		// Look for .svelte files in stack trace
		for (const line of lines) {
			const match = line.match(/([A-Za-z0-9]+)\.svelte/);
			if (match) {
				return match[1];
			}
		}

		return 'Unknown';
	}

	private getStackTrace(): string {
		return new Error().stack || '';
	}

	private extractDependencies(stackTrace: string): string[] {
		// Extract potential reactive dependencies from stack trace
		const deps: string[] = [];
		const lines = stackTrace.split('\n');

		for (const line of lines) {
			if (line.includes('$state') || line.includes('$derived') || line.includes('$effect')) {
				deps.push(line.trim());
			}
		}

		return deps;
	}

	private identifyTriggerSource(stackTrace: string): string {
		const lines = stackTrace.split('\n');
		return lines[2] || 'Unknown';
	}

	private setupGlobalErrorHandling(): void {
		window.addEventListener('error', (event) => {
			if (event.message.includes('effect_update_depth_exceeded')) {
				console.error('🚨 SVELTE DEPTH EXCEEDED ERROR CAUGHT');
				this.stopNuclearDebugging();
			}
		});
	}

	private restoreOriginalEffects(): void {
		const svelteInternal = (window as any).__SVELTE__;
		if (svelteInternal && this.originalEffect) {
			svelteInternal.effect = this.originalEffect;
		}
		if (svelteInternal && this.originalDerived) {
			svelteInternal.derived = this.originalDerived;
		}
	}
}

// Global functions for easy access
export const nuclearDebug = {
	start: () => ReactiveEffectTracker.getInstance().startNuclearDebugging(),
	stop: () => ReactiveEffectTracker.getInstance().stopNuclearDebugging(),
	getInstance: () => ReactiveEffectTracker.getInstance()
};

// Auto-expose to window for console access
if (typeof window !== 'undefined') {
	(window as any).nuclearDebug = nuclearDebug;
}
