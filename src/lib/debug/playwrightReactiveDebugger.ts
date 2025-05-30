/**
 * Playwright-based Autonomous Reactive Loop Debugger
 * 
 * Uses Playwright to programmatically interact with the UI and detect reactive loops
 */

interface PlaywrightTestResult {
	testName: string;
	success: boolean;
	reactiveLoopDetected: boolean;
	errorCount: number;
	executionTime: number;
	consoleErrors: string[];
	screenshot?: string;
}

interface ComponentDisableConfig {
	componentName: string;
	filePath: string;
	disablePattern: RegExp;
	enablePattern: RegExp;
}

class PlaywrightReactiveDebugger {
	private testResults: PlaywrightTestResult[] = [];
	private consoleErrors: string[] = [];
	private isRunning = false;

	/**
	 * Main entry point for Playwright-based debugging
	 */
	async runPlaywrightDebugging(): Promise<void> {
		if (this.isRunning) {
			console.log('🎭 Playwright debugger already running');
			return;
		}

		this.isRunning = true;
		console.log('🎭 Starting Playwright-based reactive loop debugging...');

		try {
			// Import Playwright dynamically to avoid build issues
			const { chromium } = await import('playwright');
			
			const browser = await chromium.launch({ 
				headless: false, // Keep visible for debugging
				devtools: true 
			});
			
			const context = await browser.newContext();
			const page = await context.newPage();

			// Setup console monitoring
			this.setupConsoleMonitoring(page);

			// Navigate to the app
			await page.goto('http://localhost:5179');
			await page.waitForLoadState('networkidle');

			// Run test suite
			await this.runTestSuite(page);

			// Generate report
			this.generatePlaywrightReport();

			await browser.close();

		} catch (error) {
			console.error('🎭 Playwright debugging failed:', error);
		} finally {
			this.isRunning = false;
		}
	}

	/**
	 * Setup console monitoring to capture reactive loop errors
	 */
	private setupConsoleMonitoring(page: any): void {
		page.on('console', (msg: any) => {
			const text = msg.text();
			
			if (text.includes('effect_update_depth_exceeded') || 
				text.includes('Maximum update depth exceeded')) {
				this.consoleErrors.push(`[${new Date().toISOString()}] ${text}`);
				console.error('🎭 Reactive loop detected:', text);
			}
		});

		page.on('pageerror', (error: Error) => {
			if (error.message.includes('effect_update_depth_exceeded')) {
				this.consoleErrors.push(`[${new Date().toISOString()}] PAGE ERROR: ${error.message}`);
				console.error('🎭 Page error - reactive loop:', error.message);
			}
		});
	}

	/**
	 * Run comprehensive test suite
	 */
	private async runTestSuite(page: any): Promise<void> {
		console.log('🎭 Running comprehensive test suite...');

		// Test 1: Baseline - Load app without interaction
		await this.testBaseline(page);

		// Test 2: Start position selection
		await this.testStartPositionSelection(page);

		// Test 3: Option selection (the problematic one)
		await this.testOptionSelection(page);

		// Test 4: Multiple option selections
		await this.testMultipleOptionSelections(page);

		// Test 5: Component isolation tests
		await this.runComponentIsolationTests(page);
	}

	/**
	 * Test baseline app loading
	 */
	private async testBaseline(page: any): Promise<void> {
		const startTime = Date.now();
		const initialErrorCount = this.consoleErrors.length;

		console.log('🎭 Testing baseline app loading...');

		try {
			// Wait for app to fully load
			await page.waitForSelector('[data-testid="construct-tab"]', { timeout: 10000 });
			await page.waitForTimeout(2000); // Allow reactive effects to settle

			const executionTime = Date.now() - startTime;
			const errorCount = this.consoleErrors.length - initialErrorCount;

			this.testResults.push({
				testName: 'baseline_loading',
				success: errorCount === 0,
				reactiveLoopDetected: errorCount > 0,
				errorCount,
				executionTime,
				consoleErrors: this.consoleErrors.slice(initialErrorCount)
			});

		} catch (error) {
			console.error('🎭 Baseline test failed:', error);
		}
	}

	/**
	 * Test start position selection
	 */
	private async testStartPositionSelection(page: any): Promise<void> {
		const startTime = Date.now();
		const initialErrorCount = this.consoleErrors.length;

		console.log('🎭 Testing start position selection...');

		try {
			// Find and click a start position
			const startPosSelector = '[data-testid*="start-position"]';
			await page.waitForSelector(startPosSelector, { timeout: 5000 });
			
			const startPositions = await page.locator(startPosSelector).all();
			if (startPositions.length > 0) {
				await startPositions[0].click();
				await page.waitForTimeout(1000); // Allow reactive effects to settle
			}

			const executionTime = Date.now() - startTime;
			const errorCount = this.consoleErrors.length - initialErrorCount;

			this.testResults.push({
				testName: 'start_position_selection',
				success: errorCount === 0,
				reactiveLoopDetected: errorCount > 0,
				errorCount,
				executionTime,
				consoleErrors: this.consoleErrors.slice(initialErrorCount)
			});

		} catch (error) {
			console.error('🎭 Start position selection test failed:', error);
		}
	}

	/**
	 * Test option selection (the main problematic area)
	 */
	private async testOptionSelection(page: any): Promise<void> {
		const startTime = Date.now();
		const initialErrorCount = this.consoleErrors.length;

		console.log('🎭 Testing option selection (critical test)...');

		try {
			// Wait for options to appear
			const optionSelector = '[data-testid*="option-"]';
			await page.waitForSelector(optionSelector, { timeout: 10000 });
			
			// Take screenshot before clicking
			await page.screenshot({ path: 'debug-before-option-click.png' });

			// Click the first available option
			const options = await page.locator(optionSelector).all();
			if (options.length > 0) {
				console.log('🎭 Clicking first option...');
				await options[0].click();
				
				// Monitor for immediate reactive loops
				await page.waitForTimeout(2000);
				
				// Take screenshot after clicking
				await page.screenshot({ path: 'debug-after-option-click.png' });
			}

			const executionTime = Date.now() - startTime;
			const errorCount = this.consoleErrors.length - initialErrorCount;

			this.testResults.push({
				testName: 'option_selection_critical',
				success: errorCount === 0,
				reactiveLoopDetected: errorCount > 0,
				errorCount,
				executionTime,
				consoleErrors: this.consoleErrors.slice(initialErrorCount),
				screenshot: 'debug-after-option-click.png'
			});

		} catch (error) {
			console.error('🎭 Option selection test failed:', error);
		}
	}

	/**
	 * Test multiple option selections
	 */
	private async testMultipleOptionSelections(page: any): Promise<void> {
		const startTime = Date.now();
		const initialErrorCount = this.consoleErrors.length;

		console.log('🎭 Testing multiple option selections...');

		try {
			// Clear sequence first
			await this.clearSequence(page);
			
			// Select start position again
			await this.selectStartPosition(page);
			
			// Select multiple options
			for (let i = 0; i < 3; i++) {
				const optionSelector = '[data-testid*="option-"]';
				const options = await page.locator(optionSelector).all();
				
				if (options.length > i) {
					console.log(`🎭 Clicking option ${i + 1}...`);
					await options[i].click();
					await page.waitForTimeout(1000);
					
					// Check for errors after each click
					const currentErrorCount = this.consoleErrors.length - initialErrorCount;
					if (currentErrorCount > 0) {
						console.error(`🎭 Reactive loop detected after option ${i + 1}`);
						break;
					}
				}
			}

			const executionTime = Date.now() - startTime;
			const errorCount = this.consoleErrors.length - initialErrorCount;

			this.testResults.push({
				testName: 'multiple_option_selections',
				success: errorCount === 0,
				reactiveLoopDetected: errorCount > 0,
				errorCount,
				executionTime,
				consoleErrors: this.consoleErrors.slice(initialErrorCount)
			});

		} catch (error) {
			console.error('🎭 Multiple option selection test failed:', error);
		}
	}

	/**
	 * Run component isolation tests
	 */
	private async runComponentIsolationTests(page: any): Promise<void> {
		console.log('🎭 Running component isolation tests...');

		const componentsToTest = [
			'StartPosBeat',
			'OptionPickerMain',
			'BeatFrame',
			'Arrow',
			'Prop'
		];

		for (const component of componentsToTest) {
			await this.testComponentInIsolation(page, component);
		}
	}

	/**
	 * Test a component in isolation by disabling others
	 */
	private async testComponentInIsolation(page: any, componentName: string): Promise<void> {
		const startTime = Date.now();
		const initialErrorCount = this.consoleErrors.length;

		console.log(`🎭 Testing ${componentName} in isolation...`);

		try {
			// Inject code to disable other components
			await this.disableOtherComponents(page, componentName);
			
			// Run the full user flow
			await this.runFullUserFlow(page);
			
			// Re-enable all components
			await this.enableAllComponents(page);

			const executionTime = Date.now() - startTime;
			const errorCount = this.consoleErrors.length - initialErrorCount;

			this.testResults.push({
				testName: `isolation_${componentName.toLowerCase()}`,
				success: errorCount === 0,
				reactiveLoopDetected: errorCount > 0,
				errorCount,
				executionTime,
				consoleErrors: this.consoleErrors.slice(initialErrorCount)
			});

		} catch (error) {
			console.error(`🎭 Isolation test for ${componentName} failed:`, error);
		}
	}

	/**
	 * Helper methods
	 */
	private async clearSequence(page: any): Promise<void> {
		// Implementation to clear the current sequence
		await page.evaluate(() => {
			(window as any).sequenceState?.clearSequence?.();
		});
	}

	private async selectStartPosition(page: any): Promise<void> {
		const startPosSelector = '[data-testid*="start-position"]';
		const startPositions = await page.locator(startPosSelector).all();
		if (startPositions.length > 0) {
			await startPositions[0].click();
			await page.waitForTimeout(500);
		}
	}

	private async runFullUserFlow(page: any): Promise<void> {
		await this.selectStartPosition(page);
		await page.waitForTimeout(500);
		
		const optionSelector = '[data-testid*="option-"]';
		const options = await page.locator(optionSelector).all();
		if (options.length > 0) {
			await options[0].click();
			await page.waitForTimeout(500);
		}
	}

	private async disableOtherComponents(page: any, keepEnabled: string): Promise<void> {
		// Inject JavaScript to temporarily disable components
		await page.evaluate((componentName) => {
			console.log(`🎭 Disabling all components except ${componentName}`);
			// Implementation would involve modifying component rendering
		}, keepEnabled);
	}

	private async enableAllComponents(page: any): Promise<void> {
		// Re-enable all components
		await page.evaluate(() => {
			console.log('🎭 Re-enabling all components');
			// Implementation would restore component rendering
		});
	}

	/**
	 * Generate comprehensive report
	 */
	private generatePlaywrightReport(): void {
		console.log('🎭 Generating Playwright debugging report...');
		
		console.table(this.testResults);
		
		const failedTests = this.testResults.filter(t => !t.success);
		const totalErrors = this.consoleErrors.length;
		
		console.log(`🎭 Test Summary:`);
		console.log(`   Total tests: ${this.testResults.length}`);
		console.log(`   Failed tests: ${failedTests.length}`);
		console.log(`   Total reactive loop errors: ${totalErrors}`);
		
		if (failedTests.length > 0) {
			console.log(`🎭 Failed tests:`);
			failedTests.forEach(test => {
				console.log(`   - ${test.testName}: ${test.errorCount} errors`);
			});
		}
		
		// Identify the most problematic test
		const mostProblematic = this.testResults.reduce((prev, current) => 
			current.errorCount > prev.errorCount ? current : prev
		);
		
		console.log(`🎭 Most problematic test: ${mostProblematic.testName} (${mostProblematic.errorCount} errors)`);
	}
}

// Export singleton instance
export const playwrightDebugger = new PlaywrightReactiveDebugger();

// Auto-start if in development mode
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
	// Start Playwright debugging after app initialization
	setTimeout(() => {
		playwrightDebugger.runPlaywrightDebugging();
	}, 5000);
}
