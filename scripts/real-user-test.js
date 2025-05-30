import { chromium } from 'playwright';

async function realUserTest() {
	console.log('🎯 Starting REAL user interaction test...');

	const browser = await chromium.launch({
		headless: false,
		devtools: true
	});

	const page = await browser.newPage();

	// Track infinite loop errors
	let infiniteLoopCount = 0;
	const errorMessages = [];

	page.on('console', (msg) => {
		const text = msg.text();

		// Detect actual infinite loop errors
		if (
			text.includes('effect_update_depth_exceeded') ||
			text.includes('Maximum update depth exceeded')
		) {
			infiniteLoopCount++;
			errorMessages.push(text);
			console.log(`🚨 INFINITE LOOP #${infiniteLoopCount}: ${text}`);
		}

		// Log important app messages but ignore automated testing
		if (text.includes('🔧') && !text.includes('SYSTEMATIC TEST')) {
			console.log(`📝 ${text}`);
		}
	});

	// Navigate to app
	await page.goto('http://localhost:5179');
	await page.waitForTimeout(3000);

	console.log('🎯 DISABLING ALL AUTOMATED TESTING...');

	// Aggressively disable all automated testing
	await page.evaluate(() => {
		// Stop all automated testing
		window.DISABLE_AUTOMATED_TESTING = true;

		// Clear all intervals and timeouts
		const highestTimeoutId = setTimeout(() => {}, 0);
		for (let i = 0; i < highestTimeoutId; i++) {
			clearTimeout(i);
		}

		const highestIntervalId = setInterval(() => {}, 9999);
		for (let i = 0; i < highestIntervalId; i++) {
			clearInterval(i);
		}

		// Override automated testing functions
		if (window.immediateReactiveTest) {
			window.immediateReactiveTest = { stop: () => {}, runImmediateTest: () => {} };
		}

		// Disable automated testing flags
		window.AUTOMATED_TESTING_DISABLED = true;

		console.log('🔧 REAL TEST: All automated testing disabled');
	});

	await page.waitForTimeout(2000);

	console.log('🎯 STEP 1: Looking for REAL start position elements...');

	// Wait for the app to fully load
	await page.waitForSelector('.start-pos-picker, .pictograph-container', { timeout: 10000 });

	// Find actual start position elements
	const startPosElements = await page.locator('.start-pos-picker .pictograph-container').count();
	console.log(`📊 Found ${startPosElements} start position elements`);

	if (startPosElements > 0) {
		console.log('🎯 Clicking REAL start position element...');

		// Force a real click on the first start position
		await page.locator('.start-pos-picker .pictograph-container').first().click({ force: true });

		console.log('✅ Real start position clicked');
		await page.waitForTimeout(3000);

		const loopsAfterStart = infiniteLoopCount;
		console.log(`📊 Infinite loops after start position: ${loopsAfterStart}`);

		if (loopsAfterStart > 0) {
			console.log('🚨 INFINITE LOOPS DETECTED AFTER START POSITION!');
			return;
		}
	}

	console.log('🎯 STEP 2: Looking for REAL option elements...');

	// Wait for options to load
	await page.waitForTimeout(2000);

	// Find actual option elements
	const optionElements = await page.locator('.option').count();
	console.log(`📊 Found ${optionElements} option elements`);

	if (optionElements > 0) {
		console.log('🎯 Clicking REAL option element...');

		const beforeOptionClick = infiniteLoopCount;
		console.log(`📊 Infinite loops before option click: ${beforeOptionClick}`);

		// Force a real click on the first option
		await page.locator('.option').first().click({ force: true });

		console.log('✅ Real option clicked');

		// Monitor for infinite loops for 10 seconds
		for (let i = 0; i < 20; i++) {
			await page.waitForTimeout(500);

			const currentLoops = infiniteLoopCount;
			console.log(`📊 Check ${i + 1}: Total infinite loops: ${currentLoops}`);

			if (currentLoops > beforeOptionClick) {
				console.log('🚨 INFINITE LOOPS DETECTED AFTER OPTION CLICK!');
				console.log('🎯 THIS IS THE REAL PROBLEM!');

				console.log('\n📋 INFINITE LOOP ERRORS:');
				errorMessages.forEach((error, index) => {
					console.log(`  ${index + 1}. ${error}`);
				});

				console.log('\n🔧 CONCLUSION: Real user interaction triggers infinite loops!');
				return;
			}
		}

		console.log('✅ No infinite loops detected after real option click');
	}

	console.log('\n📋 FINAL REAL TEST REPORT:');
	console.log('==========================');
	console.log(`Total infinite loops detected: ${infiniteLoopCount}`);
	console.log(`Test method: Real DOM interactions (no automated testing)`);

	if (infiniteLoopCount === 0) {
		console.log('✅ SUCCESS: No infinite loops in real user interactions!');
	} else {
		console.log('🚨 FAILURE: Real user interactions cause infinite loops!');
	}

	console.log('\n🔍 Browser kept open for manual verification...');
	console.log('Try clicking elements manually to verify the results.');

	// Keep browser open for manual testing
	// await browser.close();
}

realUserTest().catch(console.error);
