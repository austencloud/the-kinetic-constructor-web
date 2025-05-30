/**
 * Test script to verify infinite loop fixes
 * This script will test the TKAGlyph component fixes
 */

import { chromium } from 'playwright';

async function testInfiniteLoopFixes() {
	console.log('🧪 Testing infinite loop fixes...');

	const browser = await chromium.launch({ headless: false });
	const page = await browser.newPage();

	// Listen for console errors
	const errors = [];
	page.on('console', (msg) => {
		if (msg.type() === 'error') {
			errors.push(msg.text());
			console.log('❌ Console Error:', msg.text());
		}
	});

	// Listen for page errors
	page.on('pageerror', (error) => {
		errors.push(error.message);
		console.log('❌ Page Error:', error.message);
	});

	try {
		console.log('🌐 Navigating to application...');
		await page.goto('http://localhost:5179', { waitUntil: 'networkidle' });

		console.log('⏳ Waiting for page to load...');
		await page.waitForTimeout(3000);

		// Check for infinite loop errors
		const infiniteLoopErrors = errors.filter(
			(error) =>
				error.includes('effect_update_depth_exceeded') ||
				error.includes('Maximum update depth exceeded')
		);

		if (infiniteLoopErrors.length === 0) {
			console.log('✅ SUCCESS: No infinite loop errors detected!');
		} else {
			console.log('❌ FAILURE: Infinite loop errors still present:');
			infiniteLoopErrors.forEach((error) => console.log('  -', error));
		}

		// Test start position selection
		console.log('🎯 Testing start position selection...');
		const startPositionButton = await page.locator('[data-testid="start-position-A"]').first();
		if (await startPositionButton.isVisible()) {
			await startPositionButton.click();
			await page.waitForTimeout(2000);

			// Check for new errors after interaction
			const newErrors = errors.filter(
				(error) =>
					error.includes('effect_update_depth_exceeded') ||
					error.includes('Maximum update depth exceeded')
			);

			if (newErrors.length === infiniteLoopErrors.length) {
				console.log('✅ SUCCESS: No new infinite loops after start position selection!');
			} else {
				console.log('❌ FAILURE: New infinite loops detected after interaction');
			}
		} else {
			console.log('⚠️  Start position button not found - may be loading');
		}

		console.log('📊 Test Summary:');
		console.log(`   Total errors: ${errors.length}`);
		console.log(`   Infinite loop errors: ${infiniteLoopErrors.length}`);
		console.log(`   Test result: ${infiniteLoopErrors.length === 0 ? 'PASS' : 'FAIL'}`);
	} catch (error) {
		console.log('❌ Test failed with error:', error.message);
	} finally {
		await browser.close();
	}
}

// Run the test
testInfiniteLoopFixes().catch(console.error);
