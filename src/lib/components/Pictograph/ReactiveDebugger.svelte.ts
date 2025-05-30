// ReactiveDebugger.svelte.ts - Detailed reactive loop tracking system

export class HoverLoopDebugger {
	private static instance: HoverLoopDebugger;
	private hoverEvents: Array<{
		component: string;
		event: 'mouseenter' | 'mouseleave';
		timestamp: number;
		effectsTriggered: string[];
	}> = [];
	private effectCounts = new Map<string, number>();
	private isTracking = false;
	private hoverTestMode = false;

	static getInstance(): HoverLoopDebugger {
		if (!HoverLoopDebugger.instance) {
			HoverLoopDebugger.instance = new HoverLoopDebugger();
		}
		return HoverLoopDebugger.instance;
	}

	startHoverTracking() {
		this.isTracking = true;
		this.hoverEvents = [];
		this.effectCounts.clear();
		console.log('🎯 Hover loop debugging started - hover over Option components');
	}

	stopHoverTracking() {
		this.isTracking = false;
		console.log('🎯 Hover loop debugging stopped');
		this.generateHoverReport();
	}

	logHoverEvent(component: string, event: 'mouseenter' | 'mouseleave') {
		if (!this.isTracking) return;

		const timestamp = performance.now();
		const effectsTriggered: string[] = [];

		this.hoverEvents.push({
			component,
			event,
			timestamp,
			effectsTriggered
		});

		console.log(`🎯 ${component}: ${event} at ${timestamp.toFixed(2)}ms`);

		// Keep manageable size
		if (this.hoverEvents.length > 50) {
			this.hoverEvents = this.hoverEvents.slice(-25);
		}
	}

	logHoverEffect(component: string, effectName: string, trigger: string) {
		if (!this.isTracking) return;

		const effectKey = `${component}.${effectName}`;
		const count = (this.effectCounts.get(effectKey) || 0) + 1;
		this.effectCounts.set(effectKey, count);

		// Add to most recent hover event
		const lastHover = this.hoverEvents[this.hoverEvents.length - 1];
		if (lastHover && performance.now() - lastHover.timestamp < 100) {
			lastHover.effectsTriggered.push(`${effectName}(${trigger})`);
		}

		console.log(`  📍 ${effectKey} (${trigger}) [${count}x]`);

		// Detect loops
		if (count > 5) {
			console.warn(`🔄 HOVER LOOP: ${effectKey} has fired ${count} times`);
			if (count > 10) {
				console.error(`🚨 INFINITE HOVER LOOP: ${effectKey}`);
				this.analyzeHoverLoop(effectKey);
			}
		}
	}

	private analyzeHoverLoop(effectKey: string) {
		console.group(`🔬 Hover Loop Analysis: ${effectKey}`);

		// Find recent hover events that might have triggered this
		const recentHovers = this.hoverEvents.slice(-10);
		console.log('Recent hover events:');
		recentHovers.forEach((hover, i) => {
			console.log(
				`  ${i + 1}. ${hover.component} ${hover.event} → [${hover.effectsTriggered.join(', ')}]`
			);
		});

		// Show effect frequency
		const sortedEffects = Array.from(this.effectCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10);

		console.log('Most frequent effects:');
		sortedEffects.forEach(([effect, count]) => {
			console.log(`  ${effect}: ${count}x`);
		});

		console.groupEnd();
	}

	private generateHoverReport() {
		console.group('📊 Hover Loop Debugging Report');
		console.log(`Total hover events: ${this.hoverEvents.length}`);
		console.log(`Total effects tracked: ${this.effectCounts.size}`);

		const suspiciousEffects = Array.from(this.effectCounts.entries())
			.filter(([_, count]) => count > 3)
			.sort((a, b) => b[1] - a[1]);

		if (suspiciousEffects.length > 0) {
			console.log('🚨 Suspicious effects (>3 fires):');
			suspiciousEffects.forEach(([effect, count]) => {
				console.log(`  ${effect}: ${count}x`);
			});
		} else {
			console.log('✅ No suspicious effects detected');
		}

		console.groupEnd();
	}

	// Test utilities
	enableHoverTestMode() {
		this.hoverTestMode = true;
		console.log('🧪 Hover test mode enabled - use hoverTest.rapid() to trigger rapid hovers');
	}

	disableHoverTestMode() {
		this.hoverTestMode = false;
		console.log('🧪 Hover test mode disabled');
	}

	isInTestMode() {
		return this.hoverTestMode;
	}
}

// Hover testing utilities for browser console
export class HoverTester {
	private static instance: HoverTester;

	static getInstance(): HoverTester {
		if (!HoverTester.instance) {
			HoverTester.instance = new HoverTester();
		}
		return HoverTester.instance;
	}

	// Find all Option components on the page
	private findOptionElements(): HTMLElement[] {
		return Array.from(document.querySelectorAll('.option')) as HTMLElement[];
	}

	// Trigger rapid hover events to force loop conditions
	rapid(count: number = 10, delay: number = 50) {
		const options = this.findOptionElements();
		if (options.length === 0) {
			console.warn('No Option components found on page');
			return;
		}

		const targetOption = options[0];
		console.log(`🧪 Starting rapid hover test: ${count} cycles on first Option`);

		let currentCycle = 0;
		const runCycle = () => {
			if (currentCycle >= count) {
				console.log('🧪 Rapid hover test completed');
				return;
			}

			// Trigger mouseenter
			targetOption.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

			setTimeout(() => {
				// Trigger mouseleave
				targetOption.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
				currentCycle++;
				setTimeout(runCycle, delay);
			}, delay / 2);
		};

		runCycle();
	}

	// Test all options sequentially
	sequential(delay: number = 200) {
		const options = this.findOptionElements();
		if (options.length === 0) {
			console.warn('No Option components found on page');
			return;
		}

		console.log(`🧪 Starting sequential hover test on ${options.length} Options`);

		let currentIndex = 0;
		const hoverNext = () => {
			if (currentIndex >= options.length) {
				console.log('🧪 Sequential hover test completed');
				return;
			}

			const option = options[currentIndex];
			option.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

			setTimeout(() => {
				option.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
				currentIndex++;
				setTimeout(hoverNext, delay);
			}, delay / 2);
		};

		hoverNext();
	}

	// Stress test - rapid hovers on multiple elements
	stress(duration: number = 5000) {
		const options = this.findOptionElements();
		if (options.length === 0) {
			console.warn('No Option components found on page');
			return;
		}

		console.log(`🧪 Starting stress test for ${duration}ms`);
		const startTime = performance.now();

		const stressLoop = () => {
			if (performance.now() - startTime > duration) {
				console.log('🧪 Stress test completed');
				return;
			}

			const randomOption = options[Math.floor(Math.random() * options.length)];
			const event = Math.random() > 0.5 ? 'mouseenter' : 'mouseleave';
			randomOption.dispatchEvent(new MouseEvent(event, { bubbles: true }));

			setTimeout(stressLoop, 10);
		};

		stressLoop();
	}
}

// Global debugging controls for browser console
export const hoverDebug = {
	start: () => HoverLoopDebugger.getInstance().startHoverTracking(),
	stop: () => HoverLoopDebugger.getInstance().stopHoverTracking(),
	enableTest: () => HoverLoopDebugger.getInstance().enableHoverTestMode(),
	disableTest: () => HoverLoopDebugger.getInstance().disableHoverTestMode()
};

export const hoverTest = {
	rapid: (count?: number, delay?: number) => HoverTester.getInstance().rapid(count, delay),
	sequential: (delay?: number) => HoverTester.getInstance().sequential(delay),
	stress: (duration?: number) => HoverTester.getInstance().stress(duration)
};

// Helper function to instrument hover events in components
export function logHoverEvent(component: string, event: 'mouseenter' | 'mouseleave') {
	HoverLoopDebugger.getInstance().logHoverEvent(component, event);
}

// Helper function to instrument reactive effects in components
export function logHoverEffect(component: string, effectName: string, trigger: string) {
	HoverLoopDebugger.getInstance().logHoverEffect(component, effectName, trigger);
}

// Make debugging available globally in development - DISABLED FOR DEBUGGING
// if (typeof window !== 'undefined' && import.meta.env.DEV) {
// 	(window as any).hoverDebug = hoverDebug;
// 	(window as any).hoverTest = hoverTest;

// 	// Add a simple function to start debugging in the real app
// 	(window as any).startHoverDebug = () => {
// 		HoverLoopDebugger.getInstance().startHoverTracking();
// 		console.log('🎯 Hover debugging started in real application');
// 		console.log('Now hover over any Option component to see reactive effects');
// 	};

// 	(window as any).stopHoverDebug = () => {
// 		HoverLoopDebugger.getInstance().stopHoverTracking();
// 		console.log('🎯 Hover debugging stopped');
// 	};

// 	console.log('🎯 Hover debugging tools available:');
// 	console.log('  startHoverDebug() - Start debugging in real app');
// 	console.log('  stopHoverDebug() - Stop debugging');
// 	console.log('  hoverDebug.start() - Alternative start method');
// 	console.log('  hoverTest.rapid() - Automated testing');
// }
