/**
 * Browser-Injectable Automated Reactive Testing System
 * 
 * This module provides automated testing capabilities that can be injected
 * directly into the browser console to test reactive effects systematically.
 */

import { dev } from '$app/environment';

interface TestResult {
	testId: number;
	testName: string;
	passed: boolean;
	details: string;
	timestamp: string;
	duration: number;
}

interface TestConfig {
	stabilizationDelay: number;
	monitoringDuration: number;
	maxEffectDepth: number;
	beatAdditionAttempts: number;
	interactionDelay: number;
}

class AutomatedReactiveTestRunner {
	private testResults: TestResult[] = [];
	private currentTest = 0;
	private loopDetected = false;
	private consoleMessages: any[] = [];
	private testStartTime: number | null = null;
	private originalConsoleError: any;
	private originalConsoleWarn: any;
	private isRunning = false;

	private config: TestConfig = {
		stabilizationDelay: 3000,
		monitoringDuration: 10000,
		maxEffectDepth: 50,
		beatAdditionAttempts: 5,
		interactionDelay: 1000
	};

	private testSequence = [
		{
			id: 13,
			name: 'OptionPickerState reactive effects',
			description: 'Monitor after re-enabling reactive effects in optionPickerState',
			completed: false
		},
		{
			id: 14,
			name: 'GoldSelectionBorder pulse effect',
			description: 'Monitor after re-enabling pulse effect in GoldSelectionBorder',
			completed: false
		},
		{
			id: 15,
			name: 'useBeatFrameState reactive effects',
			description: 'Monitor after re-enabling reactive effects in useBeatFrameState',
			completed: false
		}
	];

	constructor() {
		if (dev && typeof window !== 'undefined') {
			this.setupConsoleInterception();
			// Make available globally for console access
			(window as any).reactiveTestRunner = this;
		}
	}

	private setupConsoleInterception() {
		this.originalConsoleError = console.error;
		this.originalConsoleWarn = console.warn;

		console.error = (...args: any[]) => {
			this.originalConsoleError.apply(console, args);
			this.handleConsoleMessage('error', args.join(' '));
		};

		console.warn = (...args: any[]) => {
			this.originalConsoleWarn.apply(console, args);
			this.handleConsoleMessage('warn', args.join(' '));
		};
	}

	private handleConsoleMessage(level: string, text: string) {
		const message = {
			level,
			text,
			timestamp: new Date().toISOString()
		};

		this.consoleMessages.push(message);
		this.checkForInfiniteLoop(message);
	}

	private checkForInfiniteLoop(message: any) {
		const text = message.text || '';

		// Check for Svelte infinite loop indicators
		if (
			text.includes('effect_update_depth_exceeded') ||
			text.includes('Maximum update depth exceeded') ||
			text.includes('infinite loop') ||
			text.includes('circular dependency') ||
			text.includes('Maximum call stack size exceeded')
		) {
			this.loopDetected = true;
			console.log('🚨 INFINITE LOOP DETECTED:', text);
			this.recordTestResult(false, `Infinite loop detected: ${text}`);
		}

		// Check for excessive console output (potential loop indicator)
		if (this.testStartTime && this.isRunning) {
			const testDuration = Date.now() - this.testStartTime;
			const recentMessages = this.consoleMessages.filter(
				(msg) => Date.now() - new Date(msg.timestamp).getTime() < 5000
			);

			if (recentMessages.length > this.config.maxEffectDepth && testDuration > 5000) {
				this.loopDetected = true;
				console.log('🚨 EXCESSIVE CONSOLE OUTPUT DETECTED - Potential infinite loop');
				this.recordTestResult(false, 'Excessive console output detected');
			}
		}
	}

	async startAutomatedTest(testId: number) {
		if (this.isRunning) {
			console.log('⚠️ Test already running, please wait...');
			return;
		}

		const test = this.testSequence.find((t) => t.id === testId);
		if (!test) {
			console.log(`❌ Test ${testId} not found`);
			return;
		}

		this.isRunning = true;
		this.currentTest = testId;
		this.loopDetected = false;
		this.consoleMessages = [];
		this.testStartTime = Date.now();

		console.log(`\n🔬 AUTOMATED TEST ${test.id}: ${test.name}`);
		console.log(`📝 Description: ${test.description}`);

		// Wait for stabilization
		console.log(`⏳ Waiting ${this.config.stabilizationDelay}ms for effect stabilization...`);
		await this.sleep(this.config.stabilizationDelay);

		// Perform automated interactions
		await this.performAutomatedInteractions();

		// Monitor for loops
		console.log(`👀 Monitoring for ${this.config.monitoringDuration}ms...`);
		await this.monitorForLoops();

		// Record result
		if (!this.loopDetected) {
			this.recordTestResult(true, 'No infinite loops detected');
			test.completed = true;
			console.log(`✅ AUTOMATED TEST ${test.id} PASSED`);
		} else {
			console.log(`❌ AUTOMATED TEST ${test.id} FAILED`);
		}

		this.isRunning = false;
		this.printTestResult();
	}

	private async performAutomatedInteractions() {
		console.log('🤖 Performing automated user interactions...');

		try {
			// Attempt to add beats multiple times
			for (let i = 0; i < this.config.beatAdditionAttempts; i++) {
				console.log(`🎯 Beat addition attempt ${i + 1}/${this.config.beatAdditionAttempts}`);

				// Try different interaction methods
				await this.tryStartPositionSelection();
				await this.sleep(this.config.interactionDelay);

				await this.tryBeatAddition();
				await this.sleep(this.config.interactionDelay);

				await this.tryOptionSelection();
				await this.sleep(this.config.interactionDelay);

				// Check if loop detected during interactions
				if (this.loopDetected) {
					console.log('🛑 Loop detected during interactions, stopping...');
					break;
				}
			}
		} catch (error) {
			console.log('⚠️ Error during automated interactions:', (error as Error).message);
		}
	}

	private async tryStartPositionSelection() {
		try {
			// Try to click start position picker elements
			const startPosSelectors = [
				'[data-testid="start-position-picker"]',
				'.start-position-picker',
				'.start-pos-beat',
				'button[aria-label*="start"]'
			];

			for (const selector of startPosSelectors) {
				const element = document.querySelector(selector) as HTMLElement;
				if (element) {
					console.log(`🎯 Clicking start position: ${selector}`);
					element.click();
					return;
				}
			}

			// Fallback: dispatch custom event
			const event = new CustomEvent('start-position-selected', {
				detail: { position: 'default' }
			});
			document.dispatchEvent(event);
		} catch (error) {
			console.log('⚠️ Start position selection failed:', (error as Error).message);
		}
	}

	private async tryBeatAddition() {
		try {
			// Try to click beat addition elements
			const beatSelectors = [
				'[data-testid="add-beat"]',
				'.beat:not(.start-pos-beat)',
				'.option-item',
				'button[aria-label*="beat"]'
			];

			for (const selector of beatSelectors) {
				const elements = document.querySelectorAll(selector);
				if (elements.length > 0) {
					console.log(`🎯 Clicking beat element: ${selector}`);
					(elements[0] as HTMLElement).click();
					return;
				}
			}

			// Fallback: call beat addition function directly
			if ((window as any).sequenceState && (window as any).sequenceState.addBeat) {
				(window as any).sequenceState.addBeat({
					id: 'test-beat-' + Date.now(),
					pictographData: null
				});
			}
		} catch (error) {
			console.log('⚠️ Beat addition failed:', (error as Error).message);
		}
	}

	private async tryOptionSelection() {
		try {
			// Try to interact with option picker
			const optionSelectors = [
				'.option-item:first-child',
				'.pictograph-option',
				'[data-testid="option"]'
			];

			for (const selector of optionSelectors) {
				const element = document.querySelector(selector) as HTMLElement;
				if (element) {
					console.log(`🎯 Clicking option: ${selector}`);
					element.click();
					return;
				}
			}
		} catch (error) {
			console.log('⚠️ Option selection failed:', (error as Error).message);
		}
	}

	private async monitorForLoops() {
		const startTime = Date.now();

		while (Date.now() - startTime < this.config.monitoringDuration) {
			if (this.loopDetected) {
				break;
			}
			await this.sleep(500);
		}
	}

	private recordTestResult(passed: boolean, details: string) {
		const test = this.testSequence.find((t) => t.id === this.currentTest);
		const result: TestResult = {
			testId: this.currentTest,
			testName: test?.name || 'unknown',
			passed,
			details,
			timestamp: new Date().toISOString(),
			duration: this.testStartTime ? Date.now() - this.testStartTime : 0
		};

		this.testResults.push(result);
	}

	private printTestResult() {
		const result = this.testResults[this.testResults.length - 1];
		if (result) {
			const status = result.passed ? '✅' : '❌';
			console.log(`${status} Test ${result.testId}: ${result.testName}`);
			console.log(`   ⏱️ Duration: ${result.duration}ms`);
			if (!result.passed) {
				console.log(`   💥 ${result.details}`);
			}
		}
	}

	printTestSummary() {
		console.log('\n📊 AUTOMATED TESTING SUMMARY');
		console.log('='.repeat(50));

		const passed = this.testResults.filter((r) => r.passed).length;
		const total = this.testResults.length;

		console.log(`✅ Passed: ${passed}/${total}`);
		console.log(`❌ Failed: ${total - passed}/${total}`);

		this.testResults.forEach((result) => {
			const status = result.passed ? '✅' : '❌';
			console.log(`${status} Test ${result.testId}: ${result.testName}`);
			if (!result.passed) {
				console.log(`   💥 ${result.details}`);
			}
		});
	}

	// Public API for console access
	async runTest(testId: number) {
		await this.startAutomatedTest(testId);
	}

	async runAllTests() {
		for (const test of this.testSequence) {
			if (!test.completed) {
				await this.startAutomatedTest(test.id);
				if (this.loopDetected) {
					console.log('🛑 Stopping all tests due to detected loop');
					break;
				}
			}
		}
		this.printTestSummary();
	}

	getTestStatus() {
		return {
			isRunning: this.isRunning,
			currentTest: this.currentTest,
			results: this.testResults,
			sequence: this.testSequence
		};
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

// Initialize the test runner in development mode
let testRunner: AutomatedReactiveTestRunner | null = null;

if (dev && typeof window !== 'undefined') {
	testRunner = new AutomatedReactiveTestRunner();
	console.log('🧪 Automated Reactive Test Runner initialized');
	console.log('📋 Available commands:');
	console.log('   reactiveTestRunner.runTest(13) - Run specific test');
	console.log('   reactiveTestRunner.runAllTests() - Run all remaining tests');
	console.log('   reactiveTestRunner.getTestStatus() - Get current status');
	console.log('   reactiveTestRunner.printTestSummary() - Print results summary');
}

export { testRunner };
