import { chromium } from 'playwright';

async function detectInfiniteLoops() {
	console.log('🎯 Starting Playwright infinite loop detector...');

	const browser = await chromium.launch({
		headless: false,
		devtools: true
	});

	const page = await browser.newPage();

	// Track console messages and infinite loop errors
	let loopErrorCount = 0;
	let lastLoopTime = 0;
	const consoleMessages = [];

	page.on('console', (msg) => {
		const text = msg.text();
		const timestamp = Date.now();

		consoleMessages.push({
			type: msg.type(),
			text: text,
			timestamp: timestamp
		});

		// Detect infinite loop errors
		if (text.includes('effect_update_depth_exceeded')) {
			loopErrorCount++;
			lastLoopTime = timestamp;
			console.log(
				`🚨 LOOP DETECTED #${loopErrorCount} at ${new Date(timestamp).toLocaleTimeString()}`
			);
		}

		// Log important messages
		if (text.includes('🔧') || text.includes('✅') || text.includes('🚨')) {
			console.log(`📝 ${text}`);
		}
	});

	// Navigate to app
	console.log('🎯 Loading app...');
	await page.goto('http://localhost:5179');
	await page.waitForTimeout(2000);

	// CRITICAL: Disable the automated testing system that's interfering
	console.log('🎯 Disabling automated testing system...');
	await page.evaluate(() => {
		// Stop any automated testing
		if (window.immediateReactiveTest) {
			window.immediateReactiveTest.stop();
		}
		if (window.automatedReactiveTesting) {
			window.automatedReactiveTesting.stop();
		}
		// Clear any intervals/timeouts
		for (let i = 1; i < 9999; i++) window.clearInterval(i);
		for (let i = 1; i < 9999; i++) window.clearTimeout(i);
	});
	await page.waitForTimeout(1000);

	console.log('✅ App loaded, starting REAL manual testing...');

	// Function to check for loops in the last few seconds
	const checkForRecentLoops = () => {
		const now = Date.now();
		const recentErrors = consoleMessages.filter(
			(msg) => msg.timestamp > now - 3000 && msg.text.includes('effect_update_depth_exceeded')
		);
		return recentErrors.length;
	};

	// Step 1: Click start position
	console.log('\n🎯 STEP 1: Clicking start position...');
	loopErrorCount = 0;

	try {
		// Try multiple selectors to find start position button
		let startButton = null;

		// Wait for any button to appear
		await page.waitForSelector('button', { timeout: 5000 });

		// Try different ways to find start position (based on actual codebase)
		const buttonSelectors = [
			'.start-pos-beat', // Actual start position beat button
			'.start-pos-picker .pictograph-container', // Start position picker containers
			'.start-position-picker .pictograph-container', // Alternative picker
			'.empty-start-pos-label', // Empty start position label
			'button:has-text("α1")', // Fallback text-based
			'button:has-text("β1")',
			'button:has-text("Γ1")'
		];

		for (const selector of buttonSelectors) {
			const buttons = await page.locator(selector);
			if ((await buttons.count()) > 0) {
				startButton = buttons.first();
				console.log(`✅ Found start position using selector: ${selector}`);
				break;
			}
		}

		if (startButton) {
			await startButton.click();
			console.log('✅ Start position clicked');

			// Wait and check for loops
			await page.waitForTimeout(2000);
			const loopsAfterStart = checkForRecentLoops();
			console.log(`📊 Loops after start position click: ${loopsAfterStart}`);

			if (loopsAfterStart > 0) {
				console.log('🚨 INFINITE LOOPS DETECTED AFTER START POSITION CLICK!');
				return;
			}
		} else {
			console.log('❌ No start position button found');
			return;
		}
	} catch (error) {
		console.log(`❌ Error clicking start position: ${error.message}`);
		return;
	}

	// Step 2: Wait for options to load
	console.log('\n🎯 STEP 2: Waiting for options to load...');

	let foundSelector = null;

	try {
		// Try multiple selectors for options (based on actual codebase)
		const optionSelectors = [
			'.option', // Actual option class from Option.svelte
			'.option .pictograph-container', // Pictograph containers in options
			'.option-picker .pictograph-container', // Option picker containers
			'.pictograph-container', // Generic pictograph containers
			'[data-testid*="option-"]', // Fallback data-testid
			'.option-button', // Generic option button
			'button:has-text("A")', // Text-based fallbacks
			'button:has-text("B")',
			'button:has-text("C")'
		];

		let optionCount = 0;

		for (const selector of optionSelectors) {
			try {
				await page.waitForSelector(selector, { timeout: 2000 });
				optionCount = await page.locator(selector).count();
				if (optionCount > 0) {
					foundSelector = selector;
					console.log(`✅ Found ${optionCount} options using selector: ${selector}`);
					break;
				}
			} catch (e) {
				// Try next selector
			}
		}

		if (optionCount === 0) {
			console.log('❌ No options found with any selector');

			// Debug: show what elements are available
			const allButtons = await page.locator('button').count();
			console.log(`🔍 Total buttons on page: ${allButtons}`);

			if (allButtons > 0) {
				const buttonTexts = await page.locator('button').allTextContents();
				console.log('🔍 Button texts:', buttonTexts.slice(0, 10));
			}
			return;
		}
	} catch (error) {
		console.log(`❌ Options failed to load: ${error.message}`);
		return;
	}

	// Step 3: Click first option (CRITICAL TEST)
	console.log('\n🎯 STEP 3: Clicking first option (CRITICAL TEST)...');

	const beforeClickLoops = loopErrorCount;
	console.log(`📊 Loop count before option click: ${beforeClickLoops}`);

	try {
		const firstOption = page.locator(foundSelector).first();

		// Get option text for logging
		const optionText = await firstOption.textContent();
		console.log(`🎯 Clicking option: ${optionText}`);

		// Click the option
		await firstOption.click();
		console.log('✅ Option clicked');

		// Monitor for loops immediately after click
		let checkCount = 0;
		const maxChecks = 10;

		while (checkCount < maxChecks) {
			await page.waitForTimeout(500);
			checkCount++;

			const currentLoops = checkForRecentLoops();
			const totalLoops = loopErrorCount;

			console.log(`📊 Check ${checkCount}: Recent loops: ${currentLoops}, Total: ${totalLoops}`);

			if (currentLoops > 0) {
				console.log('🚨 INFINITE LOOPS DETECTED AFTER OPTION CLICK!');
				console.log('🎯 THIS IS THE EXACT MOMENT THE LOOPS START!');

				// Log recent console messages for analysis
				console.log('\n📋 RECENT CONSOLE MESSAGES:');
				const recentMessages = consoleMessages
					.filter((msg) => msg.timestamp > Date.now() - 5000)
					.slice(-10);

				recentMessages.forEach((msg, i) => {
					console.log(`  ${i + 1}. [${msg.type}] ${msg.text}`);
				});

				console.log('\n🔧 CONCLUSION: The infinite loops are triggered by option selection!');
				console.log('🔧 The problem occurs immediately after clicking an option.');

				// Keep browser open for inspection
				console.log('\n🔍 Browser kept open for manual inspection...');
				console.log('Check the DevTools console for more details.');
				return;
			}
		}

		console.log('✅ No infinite loops detected after option click');
	} catch (error) {
		console.log(`❌ Error clicking option: ${error.message}`);
	}

	// Final report
	console.log('\n📋 FINAL REPORT:');
	console.log('================');
	console.log(`Total infinite loop errors detected: ${loopErrorCount}`);
	console.log(`Test completed at: ${new Date().toLocaleTimeString()}`);

	if (loopErrorCount === 0) {
		console.log('✅ SUCCESS: No infinite loops detected during the test!');
	} else {
		console.log('🚨 FAILURE: Infinite loops were detected during the test.');
	}

	console.log('\n🔍 Browser kept open for manual inspection...');
	console.log('Press Ctrl+C to close when done.');

	// Don't close browser automatically for inspection
	// await browser.close();
}

// Run the detector
detectInfiniteLoops().catch(console.error);
