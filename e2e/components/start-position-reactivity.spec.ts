/**
 * End-to-End Test for Start Position Reactivity
 * Tests the complete flow from start position picker clicks to beat frame updates
 */

import { test, expect } from '@playwright/test';

test.describe('Start Position Reactivity', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the application
		await page.goto('/');
		
		// Wait for the application to load
		await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });
		
		// Set up console monitoring for reactive loop errors
		const consoleErrors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error' && msg.text().includes('effect_update_depth_exceeded')) {
				consoleErrors.push(msg.text());
			}
		});
		
		// Store console errors for later verification
		(page as any).consoleErrors = consoleErrors;
	});

	test('should update beat frame when start position is clicked', async ({ page }) => {
		// Step 1: Wait for start position picker to load
		await page.waitForSelector('.start-pos-picker', { timeout: 10000 });
		
		// Step 2: Get initial state of beat frame start position
		const initialBeatFrame = await page.locator('.start-pos-beat').first();
		await expect(initialBeatFrame).toBeVisible();
		
		// Step 3: Get the first start position option
		const firstStartPos = page.locator('.start-pos-picker .pictograph-container').first();
		await expect(firstStartPos).toBeVisible();
		
		// Step 4: Click the first start position
		console.log('🧪 TEST: Clicking first start position...');
		await firstStartPos.click();
		
		// Step 5: Wait for the start-position-selected event to be dispatched
		await page.waitForTimeout(500); // Allow time for event propagation
		
		// Step 6: Verify beat frame updates
		// Check if the beat frame start position shows the selected pictograph
		const updatedBeatFrame = await page.locator('.start-pos-beat').first();
		
		// Verify the beat frame contains pictograph data
		const pictographInBeatFrame = updatedBeatFrame.locator('.pictograph');
		await expect(pictographInBeatFrame).toBeVisible();
		
		// Step 7: Verify arrows are visible in the beat frame
		const arrowsInBeatFrame = pictographInBeatFrame.locator('image[data-testid*="arrow"]');
		const arrowCount = await arrowsInBeatFrame.count();
		console.log(`🧪 TEST: Found ${arrowCount} arrows in beat frame`);
		
		// We expect at least one arrow to be visible
		expect(arrowCount).toBeGreaterThan(0);
		
		// Step 8: Check for reactive loop errors
		const consoleErrors = (page as any).consoleErrors;
		if (consoleErrors.length > 0) {
			console.error('🚨 REACTIVE LOOP ERRORS DETECTED:', consoleErrors);
			throw new Error(`Reactive loop errors detected: ${consoleErrors.join(', ')}`);
		}
		
		console.log('✅ TEST: Start position reactivity working correctly');
	});

	test('should handle multiple start position selections', async ({ page }) => {
		// Wait for start position picker to load
		await page.waitForSelector('.start-pos-picker', { timeout: 10000 });
		
		// Get all start position options
		const startPositions = page.locator('.start-pos-picker .pictograph-container');
		const startPosCount = await startPositions.count();
		
		console.log(`🧪 TEST: Testing ${startPosCount} start positions`);
		
		// Test each start position
		for (let i = 0; i < Math.min(startPosCount, 3); i++) {
			console.log(`🧪 TEST: Clicking start position ${i + 1}/${startPosCount}`);
			
			// Click the start position
			await startPositions.nth(i).click();
			
			// Wait for update
			await page.waitForTimeout(300);
			
			// Verify beat frame is updated
			const beatFrame = page.locator('.start-pos-beat').first();
			const pictograph = beatFrame.locator('.pictograph');
			await expect(pictograph).toBeVisible();
			
			// Check for reactive loop errors after each click
			const consoleErrors = (page as any).consoleErrors;
			if (consoleErrors.length > 0) {
				console.error(`🚨 REACTIVE LOOP ERROR on position ${i + 1}:`, consoleErrors);
				throw new Error(`Reactive loop error on position ${i + 1}: ${consoleErrors.join(', ')}`);
			}
		}
		
		console.log('✅ TEST: Multiple start position selections working correctly');
	});

	test('should maintain arrow visibility after start position changes', async ({ page }) => {
		// Wait for start position picker to load
		await page.waitForSelector('.start-pos-picker', { timeout: 10000 });
		
		// Click first start position
		const firstStartPos = page.locator('.start-pos-picker .pictograph-container').first();
		await firstStartPos.click();
		await page.waitForTimeout(500);
		
		// Check arrows in beat frame
		const beatFrame = page.locator('.start-pos-beat').first();
		const pictograph = beatFrame.locator('.pictograph');
		
		// Count arrows before
		const arrowsBefore = pictograph.locator('image[data-testid*="arrow"]');
		const arrowCountBefore = await arrowsBefore.count();
		
		// Click second start position
		const secondStartPos = page.locator('.start-pos-picker .pictograph-container').nth(1);
		await secondStartPos.click();
		await page.waitForTimeout(500);
		
		// Count arrows after
		const arrowsAfter = pictograph.locator('image[data-testid*="arrow"]');
		const arrowCountAfter = await arrowsAfter.count();
		
		console.log(`🧪 TEST: Arrows before: ${arrowCountBefore}, after: ${arrowCountAfter}`);
		
		// Verify arrows are still visible
		expect(arrowCountAfter).toBeGreaterThan(0);
		
		// Check for reactive loop errors
		const consoleErrors = (page as any).consoleErrors;
		expect(consoleErrors.length).toBe(0);
		
		console.log('✅ TEST: Arrow visibility maintained after start position changes');
	});

	test('should verify reactive effect execution count', async ({ page }) => {
		// Inject effect counting script
		await page.addInitScript(() => {
			(window as any).effectCounts = {};
			(window as any).originalEffect = (window as any).$effect;
			
			if ((window as any).$effect) {
				(window as any).$effect = function(fn: Function) {
					const effectId = Math.random().toString(36).substr(2, 9);
					(window as any).effectCounts[effectId] = 0;
					
					return (window as any).originalEffect(() => {
						(window as any).effectCounts[effectId]++;
						if ((window as any).effectCounts[effectId] > 5) {
							console.error(`🚨 EFFECT LOOP DETECTED: Effect ${effectId} executed ${(window as any).effectCounts[effectId]} times`);
						}
						return fn();
					});
				};
			}
		});
		
		// Wait for app to load
		await page.waitForSelector('.start-pos-picker', { timeout: 10000 });
		
		// Click start position
		const firstStartPos = page.locator('.start-pos-picker .pictograph-container').first();
		await firstStartPos.click();
		await page.waitForTimeout(1000);
		
		// Check effect execution counts
		const effectCounts = await page.evaluate(() => (window as any).effectCounts);
		const maxExecutions = Math.max(...Object.values(effectCounts).map(count => count as number));
		
		console.log('🧪 TEST: Max effect executions:', maxExecutions);
		console.log('🧪 TEST: Effect counts:', effectCounts);
		
		// Verify no effect executed more than 3 times
		expect(maxExecutions).toBeLessThanOrEqual(3);
		
		console.log('✅ TEST: Reactive effects executed within acceptable limits');
	});
});
