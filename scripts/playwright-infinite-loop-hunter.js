import { chromium } from 'playwright';

async function huntInfiniteLoops() {
	console.log('🎯 Starting Playwright-based infinite loop hunter...');

	const browser = await chromium.launch({
		headless: false,
		devtools: true
	});

	const page = await browser.newPage();

	// Capture console logs to see the infinite loop errors
	const consoleMessages = [];
	page.on('console', (msg) => {
		const text = msg.text();
		consoleMessages.push({
			type: msg.type(),
			text: text,
			timestamp: Date.now()
		});

		if (text.includes('effect_update_depth_exceeded') || text.includes('infinite loop')) {
			console.log(`🚨 INFINITE LOOP DETECTED: ${text}`);
		}

		if (text.includes('Last ten effects were:')) {
			console.log(`🔍 EFFECT STACK: ${text}`);
		}
	});

	// Navigate to the app
	await page.goto('http://localhost:5179');

	// Wait for app to load
	await page.waitForTimeout(3000);

	console.log('🎯 App loaded, starting systematic testing...');

	// Step 1: Click start position
	console.log('🎯 Step 1: Clicking start position...');
	const startPosButton = await page.locator('[data-testid*="start-pos"]').first();
	if ((await startPosButton.count()) > 0) {
		await startPosButton.click();
		await page.waitForTimeout(1000);
		console.log('✅ Start position clicked');
	} else {
		console.log('❌ No start position button found');
	}

	// Step 2: Click first option (this is where the infinite loops happen)
	console.log('🎯 Step 2: Clicking first option (CRITICAL TEST)...');

	// Clear previous console messages
	consoleMessages.length = 0;

	const optionButton = await page.locator('[data-testid*="option-"]').first();
	if ((await optionButton.count()) > 0) {
		console.log('🎯 Found option button, clicking...');

		// Monitor console for infinite loops
		let loopDetected = false;
		const loopCheckInterval = setInterval(() => {
			const recentErrors = consoleMessages.filter(
				(msg) =>
					msg.timestamp > Date.now() - 1000 && msg.text.includes('effect_update_depth_exceeded')
			);

			if (recentErrors.length > 0) {
				loopDetected = true;
				console.log(`🚨 INFINITE LOOP CONFIRMED: ${recentErrors.length} errors in last 1000ms`);
				clearInterval(loopCheckInterval);
			}
		}, 500);

		// Click the option
		await optionButton.click();

		// Wait and check for loops
		await page.waitForTimeout(3000);
		clearInterval(loopCheckInterval);

		if (loopDetected) {
			console.log('🚨 INFINITE LOOP CONFIRMED after option click');

			// Analyze the console messages to find the pattern
			const errorMessages = consoleMessages.filter(
				(msg) =>
					msg.text.includes('effect_update_depth_exceeded') ||
					msg.text.includes('Last ten effects were:')
			);

			console.log('\n🔍 LOOP ANALYSIS:');
			console.log(`Total error messages: ${errorMessages.length}`);

			if (errorMessages.length > 0) {
				console.log('Recent error messages:');
				errorMessages.slice(-5).forEach((msg, i) => {
					console.log(`  ${i + 1}. [${msg.type}] ${msg.text}`);
				});
			}

			// Try to get the effect stack trace
			const stackTraces = consoleMessages.filter((msg) =>
				msg.text.includes('Last ten effects were:')
			);

			if (stackTraces.length > 0) {
				console.log('\n🔍 EFFECT STACK TRACES:');
				stackTraces.slice(-3).forEach((trace, i) => {
					console.log(`  Stack ${i + 1}: ${trace.text}`);
				});
			}
		} else {
			console.log('✅ No infinite loops detected after option click');
		}
	} else {
		console.log('❌ No option button found');
	}

	// Step 3: Analyze the DOM state
	console.log('\n🎯 Step 3: Analyzing DOM state...');

	const beatCount = await page.locator('[class*="beat-container"]').count();
	console.log(`📊 Beat containers found: ${beatCount}`);

	const optionCount = await page.locator('[data-testid*="option-"]').count();
	console.log(`📊 Option buttons found: ${optionCount}`);

	// Step 4: Check for specific problematic components
	console.log('\n🎯 Step 4: Checking for problematic components...');

	const goldBorder = await page.locator('[class*="gold-selection-border"]').count();
	console.log(`📊 Gold selection borders: ${goldBorder}`);

	const animatedBeats = await page.locator('[class*="animated-beat"]').count();
	console.log(`📊 Animated beats: ${animatedBeats}`);

	// Final report
	console.log('\n📋 FINAL REPORT:');
	console.log('================');

	const totalErrors = consoleMessages.filter((msg) =>
		msg.text.includes('effect_update_depth_exceeded')
	).length;

	console.log(`Total infinite loop errors: ${totalErrors}`);
	console.log(`Loop detected: ${totalErrors > 0 ? '🚨 YES' : '✅ NO'}`);

	if (totalErrors > 0) {
		console.log('\n🔧 RECOMMENDED NEXT STEPS:');
		console.log('1. The infinite loop is triggered by option selection');
		console.log('2. Check optionPickerState.svelte.ts line 275 (setTimeout with beat-added event)');
		console.log('3. Check which component is listening to beat-added events');
		console.log('4. Add untrack() around state mutations in the event handler');
	}

	// Keep browser open for manual inspection
	console.log('\n🔍 Browser kept open for manual inspection...');
	console.log('Press Ctrl+C to close when done.');

	// Don't close the browser automatically
	// await browser.close();
}

// Run the hunter
huntInfiniteLoops().catch(console.error);
