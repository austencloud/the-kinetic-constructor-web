// SURGICAL LOOP DETECTOR - No recursion risk, immediate results
class EffectLoopDetector {
	private static effectCalls = new Map<string, number>();
	private static lastCalls: string[] = [];
	private static isDetecting = false;

	static startDetection() {
		if (this.isDetecting) return;
		this.isDetecting = true;
		this.effectCalls.clear();
		this.lastCalls = [];

		console.log('🔬 LOOP DETECTION STARTED - Watching for patterns...');
	}

	static logEffect(component: string, effectName: string, data?: any) {
		if (!this.isDetecting) return;

		const key = `${component}:${effectName}`;
		const count = (this.effectCalls.get(key) || 0) + 1;
		this.effectCalls.set(key, count);

		// Keep track of call sequence
		this.lastCalls.push(key);
		if (this.lastCalls.length > 10) {
			this.lastCalls.shift();
		}

		const timestamp = performance.now().toFixed(1);
		console.log(`[${timestamp}ms] ${this.getEmoji(component)} ${key} [${count}x]`, data || '');

		// Detect immediate loops (same effect called multiple times rapidly)
		if (count > 3) {
			console.error(`🚨 INFINITE LOOP DETECTED: ${key} called ${count} times!`);
			this.analyzeLoop(key);
		}

		// Detect circular patterns (A→B→A)
		if (this.lastCalls.length >= 4) {
			const recent = this.lastCalls.slice(-4);
			if (recent[0] === recent[2] && recent[1] === recent[3]) {
				console.error(`🔄 CIRCULAR LOOP DETECTED: ${recent[0]} ↔ ${recent[1]}`);
				this.analyzeLoop(`${recent[0]} ↔ ${recent[1]}`);
			}
		}
	}

	private static getEmoji(component: string): string {
		const emojis: Record<string, string> = {
			BackgroundCanvas: '🎨',
			BackgroundContext: '🌅',
			OptionPicker: '🔍',
			SequenceState: '📝',
			ServiceProvider: '🚀',
			Option: '🎯',
			EffectsInitializer: '⚡'
		};
		return emojis[component] || '📝';
	}

	private static analyzeLoop(loopKey: string) {
		console.group(`🚨 LOOP ANALYSIS: ${loopKey}`);

		console.log('📊 Recent effect sequence:');
		this.lastCalls.forEach((call, i) => {
			console.log(`  ${i + 1}. ${call}`);
		});

		console.log('\n📈 All effect counts:');
		Array.from(this.effectCalls.entries())
			.sort(([, a], [, b]) => b - a)
			.slice(0, 5)
			.forEach(([effect, count]) => {
				const status = count > 5 ? '🚨 LOOP' : count > 2 ? '⚠️ SUSPECT' : '✅ OK';
				console.log(`  ${status} ${effect}: ${count}x`);
			});

		console.groupEnd();

		// Auto-stop detection after finding loops to prevent console spam
		this.isDetecting = false;
		console.log('🛑 Detection stopped - Loop pattern identified!');
	}

	static stopDetection() {
		this.isDetecting = false;
		console.log('🛑 Loop detection manually stopped');
	}

	static getReport() {
		console.group('📊 LOOP DETECTION REPORT');

		console.log('📈 Effect execution counts:');
		Array.from(this.effectCalls.entries())
			.sort(([, a], [, b]) => b - a)
			.forEach(([effect, count]) => {
				const status = count > 5 ? '🚨 LOOP' : count > 2 ? '⚠️ SUSPECT' : '✅ OK';
				console.log(`  ${status} ${effect}: ${count}x`);
			});

		console.log('\n📋 Recent call sequence:');
		this.lastCalls.forEach((call, i) => {
			console.log(`  ${i + 1}. ${call}`);
		});

		console.groupEnd();
	}
}

// Global access - DISABLED FOR DEBUGGING
// if (typeof window !== 'undefined') {
// 	(window as any).startLoopDetection = () => EffectLoopDetector.startDetection();
// 	(window as any).stopLoopDetection = () => EffectLoopDetector.stopDetection();
// 	(window as any).getLoopReport = () => EffectLoopDetector.getReport();
// 	(window as any).logEffect = (c: string, e: string, d?: any) =>
// 		EffectLoopDetector.logEffect(c, e, d);

// 	console.log('🔬 Surgical Loop Detector loaded:');
// 	console.log('  startLoopDetection() - Begin watching for loops');
// 	console.log('  stopLoopDetection() - Stop detection');
// 	console.log('  getLoopReport() - Show current statistics');
// }

export { EffectLoopDetector };
