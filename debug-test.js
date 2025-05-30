// Debug test script to capture console logs and test start position selection
import { chromium } from 'playwright';

async function runDebugTest() {
	console.log('🔍 Starting debug test for start position selection flow...');

	const browser = await chromium.launch({
		headless: false, // Keep browser visible for debugging
		devtools: true // Open DevTools automatically
	});

	const context = await browser.newContext();
	const page = await context.newPage();

	// Capture console logs
	const logs = [];
	page.on('console', (msg) => {
		const timestamp = new Date().toISOString();
		const logEntry = `[${timestamp}] [${msg.type().toUpperCase()}] ${msg.text()}`;
		logs.push(logEntry);
		console.log(logEntry);
	});

	// Capture errors
	page.on('pageerror', (error) => {
		const timestamp = new Date().toISOString();
		const errorEntry = `[${timestamp}] [PAGE_ERROR] ${error.message}`;
		logs.push(errorEntry);
		console.error(errorEntry);
	});

	try {
		console.log('📱 Navigating to application...');
		await page.goto('http://localhost:5179');

		// Wait for the page to load
		console.log('⏳ Waiting for page to load...');
		await page.waitForTimeout(3000);

		// Look for start position picker
		console.log('🔍 Looking for start position picker...');
		const startPositionPicker = await page
			.locator('.start-position-picker, [data-testid="start-position-picker"]')
			.first();

		if (await startPositionPicker.isVisible()) {
			console.log('✅ Start position picker found');

			// Look for start position options
			const startPositionOptions = await page
				.locator('.start-position-option, .pictograph-option, .option')
				.all();
			console.log(`📋 Found ${startPositionOptions.length} start position options`);

			if (startPositionOptions.length > 0) {
				console.log('🎯 Clicking first start position option...');

				// Click the first option
				await startPositionOptions[0].click();

				// Wait for the click to process
				await page.waitForTimeout(2000);

				console.log('🔍 Checking for visual components after click...');

				// Check if props are rendered
				const props = await page.locator('image[href*="prop"], .prop-component').all();
				console.log(`🎨 Found ${props.length} prop elements`);

				// Check if glyphs are rendered
				const glyphs = await page.locator('.tka-glyph, .glyph-component').all();
				console.log(`📝 Found ${glyphs.length} glyph elements`);

				// Check if arrows are rendered
				const arrows = await page.locator('.arrow-component, path[stroke]').all();
				console.log(`➡️ Found ${arrows.length} arrow elements`);

				// Check for beat frame
				const beatFrame = await page.locator('.beat-frame, .start-pos-beat').first();
				if (await beatFrame.isVisible()) {
					console.log('✅ Beat frame is visible');
				} else {
					console.log('❌ Beat frame is not visible');
				}

				// Wait a bit more to capture any delayed rendering
				await page.waitForTimeout(3000);
			} else {
				console.log('❌ No start position options found');
			}
		} else {
			console.log('❌ Start position picker not found');

			// Check if we're in a different state
			const optionPicker = await page.locator('.option-picker').first();
			if (await optionPicker.isVisible()) {
				console.log('ℹ️ Option picker is visible (sequence may not be empty)');
			}
		}

		// Capture final state
		console.log('📊 Final state analysis:');
		const allSvgElements = await page.locator('svg').all();
		console.log(`🖼️ Total SVG elements: ${allSvgElements.length}`);

		const allImages = await page.locator('image').all();
		console.log(`🖼️ Total image elements: ${allImages.length}`);

		// Keep browser open for manual inspection
		console.log('🔍 Browser will remain open for manual inspection. Press Ctrl+C to close.');

		// Wait indefinitely (until manually closed)
		await new Promise(() => {});
	} catch (error) {
		console.error('❌ Error during debug test:', error);
	} finally {
		// Save logs to file
		const fs = await import('fs');
		const logContent = logs.join('\n');
		fs.writeFileSync('debug-logs.txt', logContent);
		console.log('📝 Logs saved to debug-logs.txt');
	}
}

// Check if Playwright is available
try {
	runDebugTest().catch(console.error);
} catch (error) {
	console.log('❌ Playwright not available. Install with: npm install playwright');
	console.log('📝 Manual testing instructions:');
	console.log('1. Open http://localhost:5179 in browser');
	console.log('2. Open DevTools (F12)');
	console.log('3. Click on a start position option');
	console.log('4. Monitor console logs for the debugging flow');
	console.log('5. Check if props and glyphs appear visually');
}
