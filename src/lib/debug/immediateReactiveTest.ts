/**
 * Immediate Reactive Loop Test
 *
 * Quick test to verify if nuclear disabling worked
 */

class ImmediateReactiveTest {
	private errorCount = 0;
	private testStartTime = 0;
	private originalConsoleError: typeof console.error;

	constructor() {
		this.originalConsoleError = console.error;
		this.setupErrorCapture();
	}

	/**
	 * Setup error capture for reactive loops
	 */
	private setupErrorCapture(): void {
		console.error = (...args: any[]) => {
			const errorMessage = args.join(' ');

			if (errorMessage.includes('effect_update_depth_exceeded')) {
				this.errorCount++;
				console.log(`🚨 REACTIVE LOOP DETECTED #${this.errorCount}: ${errorMessage}`);
			}

			// Call original console.error
			this.originalConsoleError.apply(console, args);
		};
	}

	/**
	 * Run immediate test
	 */
	async runImmediateTest(): Promise<void> {
		console.log('🧪 Running immediate reactive loop test...');

		this.testStartTime = Date.now();
		this.errorCount = 0;

		// Test 1: Wait for app to settle
		await this.waitAndCount(2000, 'App settling');

		// Test 2: Simulate start position selection
		await this.testStartPositionSelection();

		// Test 3: Simulate option selection (the critical test)
		await this.testOptionSelection();

		// Generate immediate report
		this.generateImmediateReport();
	}

	/**
	 * Test start position selection
	 */
	private async testStartPositionSelection(): Promise<void> {
		console.log('🧪 Testing start position selection...');

		const initialErrors = this.errorCount;

		try {
			// Find start position button
			const startPosButton = document.querySelector(
				'[data-testid*="start-position"]'
			) as HTMLElement;

			if (startPosButton) {
				console.log('🧪 Clicking start position...');
				startPosButton.click();

				await this.waitAndCount(1000, 'Start position selection');

				const newErrors = this.errorCount - initialErrors;
				console.log(`🧪 Start position selection: ${newErrors} new reactive loop errors`);
			} else {
				console.log('🧪 No start position button found');
			}
		} catch (error) {
			console.error('🧪 Start position test failed:', error);
		}
	}

	/**
	 * Test option selection (critical test)
	 */
	private async testOptionSelection(): Promise<void> {
		console.log('🧪 Testing option selection (CRITICAL)...');

		const initialErrors = this.errorCount;

		try {
			// Wait for options to appear
			await this.waitForElement('[data-testid*="option-"]', 5000);

			// Find option button
			const optionButton = document.querySelector('[data-testid*="option-"]') as HTMLElement;

			if (optionButton) {
				console.log('🧪 Clicking option (this was causing infinite loops)...');
				optionButton.click();

				await this.waitAndCount(2000, 'Option selection');

				const newErrors = this.errorCount - initialErrors;
				console.log(`🧪 Option selection: ${newErrors} new reactive loop errors`);

				if (newErrors === 0) {
					console.log('✅ SUCCESS: Option selection completed without reactive loops!');
				} else {
					console.log(`❌ FAILURE: Option selection still causing ${newErrors} reactive loops`);
				}
			} else {
				console.log('🧪 No option button found');
			}
		} catch (error) {
			console.error('🧪 Option selection test failed:', error);
		}
	}

	/**
	 * Wait for an element to appear
	 */
	private async waitForElement(selector: string, timeout: number): Promise<void> {
		const startTime = Date.now();

		while (Date.now() - startTime < timeout) {
			const element = document.querySelector(selector);
			if (element) {
				return;
			}
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		throw new Error(`Element ${selector} not found within ${timeout}ms`);
	}

	/**
	 * Wait and count errors during the wait period
	 */
	private async waitAndCount(ms: number, phase: string): Promise<void> {
		const initialErrors = this.errorCount;

		await new Promise((resolve) => setTimeout(resolve, ms));

		const newErrors = this.errorCount - initialErrors;
		console.log(`🧪 ${phase}: ${newErrors} reactive loop errors in ${ms}ms`);
	}

	/**
	 * Generate immediate test report
	 */
	private generateImmediateReport(): void {
		const totalTime = Date.now() - this.testStartTime;

		console.log('🧪 IMMEDIATE TEST REPORT');
		console.log('========================');
		console.log(`Total test time: ${totalTime}ms`);
		console.log(`Total reactive loop errors: ${this.errorCount}`);

		if (this.errorCount === 0) {
			console.log('✅ SUCCESS: No reactive loops detected! Nuclear disabling worked!');
		} else {
			console.log(`❌ FAILURE: ${this.errorCount} reactive loops still occurring`);
			console.log('🔧 Additional components may need to be disabled');
		}

		// Provide next steps
		if (this.errorCount === 0) {
			console.log('🎯 NEXT STEPS:');
			console.log('1. Verify that beats are being added to the sequence');
			console.log('2. Check that options are loading properly');
			console.log('3. Test the complete user flow');
		} else {
			console.log('🔧 DEBUGGING NEEDED:');
			console.log('1. Check which components still have active reactive effects');
			console.log('2. Disable additional reactive effects systematically');
			console.log('3. Use browser DevTools to identify the source of remaining loops');
		}
	}

	/**
	 * Get current error count
	 */
	getErrorCount(): number {
		return this.errorCount;
	}

	/**
	 * Reset error count
	 */
	resetErrorCount(): void {
		this.errorCount = 0;
	}

	/**
	 * Test clear sequence functionality
	 */
	async testClearSequence(): Promise<void> {
		console.log('🧪 Testing clear sequence functionality...');

		try {
			// Get current state before clearing
			const beforeBeats = sequenceState.beats.length;
			const beforeStartPos = !!sequenceState.startPosition;
			const beforeIsEmpty = sequenceState.isEmpty;

			console.log(
				'🧪 Before clear - beats:',
				beforeBeats,
				'startPos:',
				beforeStartPos,
				'isEmpty:',
				beforeIsEmpty
			);

			// Clear the sequence
			await sequenceState.clearSequence();

			// Wait a moment for reactive updates
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Check state after clearing
			const afterBeats = sequenceState.beats.length;
			const afterStartPos = !!sequenceState.startPosition;
			const afterIsEmpty = sequenceState.isEmpty;

			console.log(
				'🧪 After clear - beats:',
				afterBeats,
				'startPos:',
				afterStartPos,
				'isEmpty:',
				afterIsEmpty
			);

			// Verify expected results
			if (afterBeats === 0 && !afterStartPos && afterIsEmpty) {
				console.log('✅ Clear sequence test PASSED - BeatFrame should be empty');
				console.log('✅ OptionPicker should switch to StartPositionPicker');
			} else {
				console.log('❌ Clear sequence test FAILED');
				console.log('❌ Expected: beats=0, startPos=false, isEmpty=true');
				console.log(
					'❌ Actual: beats=' +
						afterBeats +
						', startPos=' +
						afterStartPos +
						', isEmpty=' +
						afterIsEmpty
				);
			}
		} catch (error) {
			console.error('❌ Clear sequence test ERROR:', error);
		}
	}
}

// Export singleton instance
export const immediateTest = new ImmediateReactiveTest();

// Auto-start immediate test
if (typeof window !== 'undefined') {
	// Start test after app initialization
	setTimeout(() => {
		immediateTest.runImmediateTest();
	}, 3000);

	// Auto-run clear sequence test after app is fully loaded
	setTimeout(() => {
		console.log('🧪 Auto-running clear sequence test...');
		immediateTest.testClearSequence();
	}, 8000);
}

// Make test functions available globally for manual testing
if (typeof window !== 'undefined') {
	(window as any).immediateTest = immediateTest;
	(window as any).testReactiveLoops = () => immediateTest.runImmediateTest();
	(window as any).getErrorCount = () => immediateTest.getErrorCount();
	(window as any).resetErrorCount = () => immediateTest.resetErrorCount();
	(window as any).testClearSequence = () => immediateTest.testClearSequence();
}
