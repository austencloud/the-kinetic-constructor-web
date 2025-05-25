# Test info

- Name: debug Generate tab
- Location: C:\the-kinetic-constructor-web\e2e\debug-generate-tab.spec.ts:3:1

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
   1 | import { test, expect } from '@playwright/test';
   2 |
>  3 | test('debug Generate tab', async ({ page }) => {
     | ^ Error: browserType.launch: Executable doesn't exist at C:\Users\auste\AppData\Local\ms-playwright\chromium_headless_shell-1169\chrome-win\headless_shell.exe
   4 | 	// Navigate to the application
   5 | 	await page.goto('/');
   6 |
   7 | 	// Wait for the application to load
   8 | 	await page.waitForSelector('.main-layout-wrapper', { state: 'visible', timeout: 30000 });
   9 |
  10 | 	// Take a screenshot of the initial page
  11 | 	await page.screenshot({ path: 'test-results/initial-page.png', fullPage: true });
  12 |
  13 | 	// Click on the Generate tab
  14 | 	console.log('Clicking on Generate tab...');
  15 | 	await page.click('button:has-text("Generate")');
  16 |
  17 | 	// Wait for the Generate tab to load
  18 | 	await page.waitForTimeout(2000);
  19 |
  20 | 	// Take a screenshot of the Generate tab
  21 | 	await page.screenshot({ path: 'test-results/generate-tab-debug.png', fullPage: true });
  22 |
  23 | 	// Log all buttons on the page
  24 | 	const buttons = await page.$$eval('button', (btns) => {
  25 | 		return btns.map((btn) => ({
  26 | 			text: btn.textContent?.trim(),
  27 | 			classes: btn.className,
  28 | 			isVisible: btn.offsetWidth > 0 && btn.offsetHeight > 0,
  29 | 			rect: btn.getBoundingClientRect()
  30 | 		}));
  31 | 	});
  32 |
  33 | 	console.log('Buttons on the page:', JSON.stringify(buttons, null, 2));
  34 |
  35 | 	// Look specifically for the generate button
  36 | 	const generateButtons = await page.$$eval('.generate-button', (btns) => {
  37 | 		return btns.map((btn) => ({
  38 | 			text: btn.textContent?.trim(),
  39 | 			classes: btn.className,
  40 | 			isVisible: btn.offsetWidth > 0 && btn.offsetHeight > 0,
  41 | 			rect: btn.getBoundingClientRect()
  42 | 		}));
  43 | 	});
  44 |
  45 | 	console.log('Generate buttons:', JSON.stringify(generateButtons, null, 2));
  46 |
  47 | 	// Success if we've made it this far
  48 | 	expect(true).toBeTruthy();
  49 | });
  50 |
```
