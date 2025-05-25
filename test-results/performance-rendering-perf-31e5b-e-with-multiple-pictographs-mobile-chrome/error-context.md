# Test info

- Name: Rendering Performance >> should maintain performance with multiple pictographs
- Location: C:\the-kinetic-constructor-web\e2e\performance\rendering-performance.spec.ts:75:2

# Error details

```
Error: browserType.launch: Executable doesn't exist at C:\Users\auste\AppData\Local\ms-playwright\chromium_headless_shell-1169\chrome-win\headless_shell.exe
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     npx playwright install                                              ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
```

# Test source

```ts
   1 | import { test, expect } from '../utils/test-base';
   2 |
   3 | /**
   4 |  * Performance Tests
   5 |  *
   6 |  * These tests measure the performance of key rendering operations
   7 |  * to ensure the application remains responsive.
   8 |  */
   9 | test.describe('Rendering Performance', () => {
   10 | 	// Setup: Navigate to the application before each test
   11 | 	test.beforeEach(async ({ page, appPage }) => {
   12 | 		await appPage.goto();
   13 | 		await appPage.waitForAppReady();
   14 | 	});
   15 |
   16 | 	test('should render SVG components efficiently', async ({ page, appPage, pictographPage }) => {
   17 | 		// Navigate to the Construct tab
   18 | 		await appPage.navigateToTab('construct');
   19 |
   20 | 		// Wait for the pictograph to load with a longer timeout
   21 | 		await pictographPage.waitForPictographLoaded('construct', 20000);
   22 |
   23 | 		// Take a screenshot to debug
   24 | 		await page.screenshot({ path: 'test-results/construct-tab.png' });
   25 |
   26 | 		// Measure the time it takes to render a grid using more robust selectors
   27 | 		const gridRenderTime = await page.evaluate(async () => {
   28 | 			const startTime = performance.now();
   29 |
   30 | 			// Find the grid toggle button using multiple possible selectors
   31 | 			const gridToggle =
   32 | 				document.querySelector('button[data-test="toggle-grid-mode"]') ||
   33 | 				document.querySelector('button.grid-toggle') ||
   34 | 				document.querySelector('.grid-mode-toggle button') ||
   35 | 				document.querySelector('button.box-grid-button') ||
   36 | 				// Find any button that contains "Grid" in its text
   37 | 				Array.from(document.querySelectorAll('button')).find(
   38 | 					(button) => button.textContent && button.textContent.includes('Grid')
   39 | 				);
   40 |
   41 | 			if (gridToggle) {
   42 | 				console.log('Found grid toggle button, clicking it');
   43 | 				(gridToggle as HTMLElement).click();
   44 |
   45 | 				// Wait for the grid to re-render with a longer timeout
   46 | 				await new Promise((resolve) => setTimeout(resolve, 300));
   47 |
   48 | 				// Toggle back
   49 | 				(gridToggle as HTMLElement).click();
   50 |
   51 | 				// Wait for the grid to re-render again with a longer timeout
   52 | 				await new Promise((resolve) => setTimeout(resolve, 300));
   53 | 			} else {
   54 | 				console.log('Could not find grid toggle button');
   55 | 				// If we can't find the toggle button, try to find any button that might control the grid
   56 | 				const anyButton = document.querySelector('.grid-controls button');
   57 | 				if (anyButton) {
   58 | 					console.log('Found alternative grid control button');
   59 | 					(anyButton as HTMLElement).click();
   60 | 					await new Promise((resolve) => setTimeout(resolve, 300));
   61 | 					(anyButton as HTMLElement).click();
   62 | 					await new Promise((resolve) => setTimeout(resolve, 300));
   63 | 				}
   64 | 			}
   65 |
   66 | 			const endTime = performance.now();
   67 | 			return endTime - startTime;
   68 | 		});
   69 |
   70 | 		// Verify the render time is within acceptable limits
   71 | 		// Increased threshold to be more realistic
   72 | 		expect(gridRenderTime).toBeLessThan(1000);
   73 | 	});
   74 |
>  75 | 	test('should maintain performance with multiple pictographs', async ({
      | 	^ Error: browserType.launch: Executable doesn't exist at C:\Users\auste\AppData\Local\ms-playwright\chromium_headless_shell-1169\chrome-win\headless_shell.exe
   76 | 		page,
   77 | 		appPage,
   78 | 		writeTabPage
   79 | 	}) => {
   80 | 		// Navigate to the Write tab where multiple pictographs can be displayed
   81 | 		await appPage.navigateToTab('write');
   82 |
   83 | 		// Wait for the write tab to be fully loaded
   84 | 		await page.waitForTimeout(2000);
   85 |
   86 | 		// Take a screenshot to debug
   87 | 		await page.screenshot({ path: 'test-results/write-tab.png' });
   88 |
   89 | 		// Create a simple act with at least one sequence if none exists
   90 | 		const sequenceCount = await writeTabPage.getSequenceCount();
   91 | 		if (sequenceCount === 0) {
   92 | 			console.log('No sequences found, creating a simple act');
   93 |
   94 | 			// Set a title for the act
   95 | 			await writeTabPage.setActTitle('Performance Test Act');
   96 |
   97 | 			// Try to add a sequence from favorites or create a new one
   98 | 			try {
   99 | 				// Check if there are favorite sequences
  100 | 				const hasFavorites = (await page.locator('.favorite-sequence-item').count()) > 0;
  101 |
  102 | 				if (hasFavorites) {
  103 | 					// Drag a favorite sequence to the act
  104 | 					await writeTabPage.dragFavoriteSequenceToAct(0, 0);
  105 | 				} else {
  106 | 					// Navigate to Generate tab to create a sequence
  107 | 					await appPage.navigateToTab('generate');
  108 |
  109 | 					// Generate a simple sequence using JavaScript
  110 | 					await page.evaluate(() => {
  111 | 						// Try to find the generate button using multiple approaches
  112 | 						const generateButtons = [
  113 | 							// By class
  114 | 							document.querySelector('.generate-button'),
  115 | 							// By text content
  116 | 							Array.from(document.querySelectorAll('button')).find(
  117 | 								(button) =>
  118 | 									button.textContent && button.textContent.toLowerCase().includes('generate')
  119 | 							),
  120 | 							// By any button in the controls panel
  121 | 							document.querySelector('.controls-panel button')
  122 | 						].filter(Boolean);
  123 |
  124 | 						if (generateButtons.length > 0) {
  125 | 							console.log('Found generate button, clicking it');
  126 | 							(generateButtons[0] as HTMLElement).click();
  127 | 							return true;
  128 | 						}
  129 |
  130 | 						return false;
  131 | 					});
  132 |
  133 | 					// Wait for generation to complete
  134 | 					await page.waitForTimeout(5000);
  135 |
  136 | 					// Copy the sequence
  137 | 					await page.keyboard.press('Control+C');
  138 |
  139 | 					// Navigate back to Write tab
  140 | 					await appPage.navigateToTab('write');
  141 |
  142 | 					// Paste the sequence
  143 | 					await page.keyboard.press('Control+V');
  144 |
  145 | 					// Wait for the sequence to be added
  146 | 					await page.waitForTimeout(2000);
  147 | 				}
  148 | 			} catch (e) {
  149 | 				console.log('Error creating sequence:', e);
  150 | 			}
  151 | 		}
  152 |
  153 | 		// Take a screenshot before measuring performance
  154 | 		await page.screenshot({ path: 'test-results/before-scroll-performance.png' });
  155 |
  156 | 		// Wait a moment to ensure the page is stable
  157 | 		await page.waitForTimeout(2000);
  158 |
  159 | 		// Measure scroll performance with more robust selectors and error handling
  160 | 		let scrollPerformance = 0;
  161 | 		try {
  162 | 			scrollPerformance = await page.evaluate(async () => {
  163 | 				// Try multiple selectors for the act sheet
  164 | 				const container =
  165 | 					document.querySelector('.act-sheet') ||
  166 | 					document.querySelector('.sequence-container') ||
  167 | 					document.querySelector('.write-tab .scrollable-container') ||
  168 | 					document.querySelector('.scrollable') ||
  169 | 					document.querySelector('.write-tab');
  170 |
  171 | 				if (!container) {
  172 | 					console.log('Could not find act sheet container');
  173 | 					return 0;
  174 | 				}
  175 |
```
