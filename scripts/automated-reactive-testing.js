/**
 * Automated Reactive Effect Testing System
 *
 * This script creates browser automation scripts that can be injected
 * into the running application to test reactive effects automatically.
 */

const fs = require('fs');
const path = require('path');

class AutomatedReactiveTestRunner {
	constructor() {
		this.browser = null;
		this.page = null;
		this.consoleWs = null;
		this.testResults = [];
		this.currentTest = 0;
		this.loopDetected = false;
		this.consoleMessages = [];
		this.testStartTime = null;

		// Test configuration
		this.config = {
			appUrl: 'http://localhost:5179',
			consoleWsUrl: 'ws://localhost:5180',
			stabilizationDelay: 3000,
			monitoringDuration: 10000,
			maxEffectDepth: 100,
			beatAdditionAttempts: 5,
			interactionDelay: 1000
		};

		// Test sequence - effects to re-enable systematically
		this.testSequence = [
			{
				id: 13,
				name: 'OptionPickerState reactive effects',
				description: 'Re-enable reactive effects in optionPickerState.initializeReactiveEffects()',
				file: 'src/lib/components/ConstructTab/OptionPicker/optionPickerState.svelte.ts',
				completed: false
			},
			{
				id: 14,
				name: 'GoldSelectionBorder pulse effect',
				description: 'Re-enable pulse effect in GoldSelectionBorder.svelte',
				file: 'src/lib/components/SequenceWorkbench/BeatFrame/GoldSelectionBorder.svelte',
				completed: false
			},
			{
				id: 15,
				name: 'useBeatFrameState reactive effects',
				description: 'Re-enable reactive effects in useBeatFrameState.svelte.ts',
				file: 'src/lib/components/SequenceWorkbench/BeatFrame/composables/useBeatFrameState.svelte.ts',
				completed: false
			}
		];
	}

	async initialize() {
		console.log('🚀 Initializing Automated Reactive Testing System...');

		// Launch browser
		this.browser = await chromium.launch({
			headless: false,
			devtools: true,
			args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
		});

		this.page = await this.browser.newPage();

		// Set up console monitoring
		this.page.on('console', (msg) => {
			this.handleConsoleMessage(msg);
		});

		// Connect to console bridge WebSocket
		await this.connectToConsoleBridge();

		// Navigate to app
		console.log('📱 Navigating to application...');
		await this.page.goto(this.config.appUrl);
		await this.page.waitForLoadState('networkidle');

		console.log('✅ Automated testing system initialized');
	}

	async connectToConsoleBridge() {
		return new Promise((resolve, reject) => {
			this.consoleWs = new WebSocket(this.config.consoleWsUrl);

			this.consoleWs.on('open', () => {
				console.log('🔗 Connected to console bridge');
				resolve();
			});

			this.consoleWs.on('message', (data) => {
				try {
					const message = JSON.parse(data);
					this.handleBridgeMessage(message);
				} catch (e) {
					// Handle non-JSON messages
					this.handleBridgeMessage({ level: 'info', message: data.toString() });
				}
			});

			this.consoleWs.on('error', (error) => {
				console.error('❌ Console bridge connection error:', error);
				reject(error);
			});
		});
	}

	handleConsoleMessage(msg) {
		const message = {
			level: msg.type(),
			text: msg.text(),
			timestamp: new Date().toISOString()
		};

		this.consoleMessages.push(message);
		this.checkForInfiniteLoop(message);
	}

	handleBridgeMessage(message) {
		this.consoleMessages.push({
			level: message.level || 'info',
			text: message.message || message.toString(),
			timestamp: new Date().toISOString(),
			source: 'bridge'
		});

		this.checkForInfiniteLoop(message);
	}

	checkForInfiniteLoop(message) {
		const text = message.message || message.text || '';

		// Check for Svelte infinite loop indicators
		if (
			text.includes('effect_update_depth_exceeded') ||
			text.includes('Maximum update depth exceeded') ||
			text.includes('infinite loop') ||
			text.includes('circular dependency')
		) {
			this.loopDetected = true;
			console.log('🚨 INFINITE LOOP DETECTED:', text);
			this.recordTestResult(false, `Infinite loop detected: ${text}`);
		}

		// Check for excessive console output (potential loop indicator)
		if (this.testStartTime) {
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

	async runAutomatedTests() {
		console.log('🧪 Starting automated reactive effect testing...');

		for (let i = 0; i < this.testSequence.length; i++) {
			const test = this.testSequence[i];
			this.currentTest = i;

			console.log(`\n🔬 SYSTEMATIC TEST ${test.id}: ${test.name}`);
			console.log(`📁 File: ${test.file}`);
			console.log(`📝 Description: ${test.description}`);

			// Reset state for this test
			this.loopDetected = false;
			this.consoleMessages = [];
			this.testStartTime = Date.now();

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
				console.log(`✅ SYSTEMATIC TEST ${test.id} PASSED`);
			} else {
				console.log(`❌ SYSTEMATIC TEST ${test.id} FAILED`);
				break; // Stop testing if a loop is detected
			}
		}

		this.printTestSummary();
	}

	async performAutomatedInteractions() {
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
			console.log('⚠️ Error during automated interactions:', error.message);
		}
	}

	async tryStartPositionSelection() {
		try {
			// Try to click start position picker elements
			const startPosSelectors = [
				'[data-testid="start-position-picker"]',
				'.start-position-picker',
				'.start-pos-beat',
				'button[aria-label*="start"]'
			];

			for (const selector of startPosSelectors) {
				const element = await this.page.$(selector);
				if (element) {
					console.log(`🎯 Clicking start position: ${selector}`);
					await element.click();
					return;
				}
			}

			// Fallback: dispatch custom event
			await this.page.evaluate(() => {
				const event = new CustomEvent('start-position-selected', {
					detail: { position: 'default' }
				});
				document.dispatchEvent(event);
			});
		} catch (error) {
			console.log('⚠️ Start position selection failed:', error.message);
		}
	}

	async tryBeatAddition() {
		try {
			// Try to click beat addition elements
			const beatSelectors = [
				'[data-testid="add-beat"]',
				'.beat:not(.start-pos-beat)',
				'.option-item',
				'button[aria-label*="beat"]'
			];

			for (const selector of beatSelectors) {
				const elements = await this.page.$$(selector);
				if (elements.length > 0) {
					console.log(`🎯 Clicking beat element: ${selector}`);
					await elements[0].click();
					return;
				}
			}

			// Fallback: call beat addition function directly
			await this.page.evaluate(() => {
				if (window.sequenceState && window.sequenceState.addBeat) {
					window.sequenceState.addBeat({
						id: 'test-beat-' + Date.now(),
						pictographData: null
					});
				}
			});
		} catch (error) {
			console.log('⚠️ Beat addition failed:', error.message);
		}
	}

	async tryOptionSelection() {
		try {
			// Try to interact with option picker
			const optionSelectors = [
				'.option-item:first-child',
				'.pictograph-option',
				'[data-testid="option"]'
			];

			for (const selector of optionSelectors) {
				const element = await this.page.$(selector);
				if (element) {
					console.log(`🎯 Clicking option: ${selector}`);
					await element.click();
					return;
				}
			}
		} catch (error) {
			console.log('⚠️ Option selection failed:', error.message);
		}
	}

	async monitorForLoops() {
		const startTime = Date.now();

		while (Date.now() - startTime < this.config.monitoringDuration) {
			if (this.loopDetected) {
				break;
			}
			await this.sleep(500);
		}
	}

	recordTestResult(passed, details) {
		const result = {
			testId: this.testSequence[this.currentTest]?.id || 'unknown',
			testName: this.testSequence[this.currentTest]?.name || 'unknown',
			passed,
			details,
			timestamp: new Date().toISOString(),
			duration: this.testStartTime ? Date.now() - this.testStartTime : 0
		};

		this.testResults.push(result);
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

	async cleanup() {
		if (this.consoleWs) {
			this.consoleWs.close();
		}
		if (this.browser) {
			await this.browser.close();
		}
	}

	sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

// Export for use as module
module.exports = AutomatedReactiveTestRunner;

// Run if called directly
if (require.main === module) {
	const runner = new AutomatedReactiveTestRunner();

	runner
		.initialize()
		.then(() => runner.runAutomatedTests())
		.then(() => runner.cleanup())
		.catch((error) => {
			console.error('❌ Automated testing failed:', error);
			runner.cleanup();
			process.exit(1);
		});
}
