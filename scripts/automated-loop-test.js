import { chromium } from 'playwright';

async function automatedLoopTest() {
	console.log('🎯 Starting automated infinite loop test...');

	const browser = await chromium.launch({
		headless: true, // Run headless to prevent browser closing issues
		devtools: false
	});

	const page = await browser.newPage();

	// Track infinite loop errors
	let infiniteLoopCount = 0;
	const errorMessages = [];

	page.on('console', (msg) => {
		const text = msg.text();

		// Detect infinite loop errors with exact patterns
		if (
			text.includes('effect_update_depth_exceeded') ||
			text.includes('Maximum update depth exceeded') ||
			text.includes('Uncaught Svelte error: effect_update_depth_exceeded')
		) {
			infiniteLoopCount++;
			errorMessages.push({
				text: text,
				timestamp: Date.now()
			});
			console.log(`🚨 INFINITE LOOP #${infiniteLoopCount}: ${text.substring(0, 100)}...`);
		}
	});

	try {
		// Navigate to app
		console.log('🎯 Loading app...');
		await page.goto('http://localhost:5179');
		await page.waitForTimeout(3000);

		// Step 1: Click start position
		console.log('🎯 Step 1: Clicking start position...');
		await page.waitForSelector('.start-pos-picker .pictograph-container', { timeout: 10000 });
		await page.locator('.start-pos-picker .pictograph-container').first().click();
		await page.waitForTimeout(2000);

		const loopsAfterStart = infiniteLoopCount;
		console.log(`📊 Infinite loops after start position: ${loopsAfterStart}`);

		if (loopsAfterStart > 0) {
			console.log('🚨 FAILURE: Infinite loops detected after start position click');
			return { success: false, stage: 'start-position', loops: loopsAfterStart };
		}

		// Step 2: Click option (the critical test)
		console.log('🎯 Step 2: Clicking option (CRITICAL TEST)...');
		await page.waitForSelector('.option', { timeout: 10000 });

		const optionCount = await page.locator('.option').count();
		console.log(`📊 Found ${optionCount} options`);

		if (optionCount === 0) {
			console.log('❌ FAILURE: No options found');
			return { success: false, stage: 'no-options', loops: infiniteLoopCount };
		}

		const beforeOptionClick = infiniteLoopCount;
		console.log(`📊 Infinite loops before option click: ${beforeOptionClick}`);

		// Click the first option
		await page.locator('.option').first().click();
		console.log('✅ Option clicked');

		// Monitor for infinite loops for 10 seconds
		console.log('🎯 Monitoring for infinite loops...');
		for (let i = 0; i < 20; i++) {
			await page.waitForTimeout(500);

			const currentLoops = infiniteLoopCount;
			const newLoops = currentLoops - beforeOptionClick;

			if (i % 4 === 0) {
				// Log every 2 seconds
				console.log(`📊 Check ${i + 1}/20: ${newLoops} new loops (total: ${currentLoops})`);
			}

			if (newLoops > 0) {
				console.log('🚨 FAILURE: Infinite loops detected after option click!');
				return {
					success: false,
					stage: 'option-click',
					loops: newLoops,
					totalLoops: currentLoops,
					errors: errorMessages.slice(-5)
				};
			}
		}

		console.log('✅ SUCCESS: No infinite loops detected after option click!');

		// Verify the app is still functional
		console.log('🎯 Step 3: Verifying app functionality...');

		// Check if beat was added
		const beatElements = await page.locator('.beat-container, [class*="beat"]').count();
		console.log(`📊 Beat elements found: ${beatElements}`);

		// Check if sequence state updated
		const sequenceInfo = await page.evaluate(() => {
			return {
				hasSequenceState: !!window.sequenceState,
				beatCount: window.sequenceState?.beats?.length || 0
			};
		});
		console.log(`📊 Sequence state: ${JSON.stringify(sequenceInfo)}`);

		return {
			success: true,
			stage: 'complete',
			loops: infiniteLoopCount,
			beatElements: beatElements,
			sequenceInfo: sequenceInfo
		};
	} catch (error) {
		console.log(`❌ ERROR during test: ${error.message}`);
		return {
			success: false,
			stage: 'error',
			error: error.message,
			loops: infiniteLoopCount
		};
	} finally {
		console.log('\n📋 AUTOMATED TEST REPORT:');
		console.log('==========================');
		console.log(`Total infinite loops detected: ${infiniteLoopCount}`);

		if (infiniteLoopCount === 0) {
			console.log('✅ SUCCESS: No infinite loops detected!');
		} else {
			console.log('🚨 FAILURE: Infinite loops were detected!');
			console.log('\nRecent error messages:');
			errorMessages.slice(-3).forEach((error, i) => {
				console.log(`  ${i + 1}. ${error.text.substring(0, 150)}...`);
			});
		}

		console.log('\n🔍 Browser kept open for manual verification...');
		// await browser.close();
	}
}

// Run the test
automatedLoopTest()
	.then((result) => {
		console.log('\n🎯 FINAL RESULT:', result);
	})
	.catch(console.error);
