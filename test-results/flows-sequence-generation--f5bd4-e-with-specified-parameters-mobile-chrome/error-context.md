# Test info

- Name: Sequence Generation Flow >> should generate a circular sequence with specified parameters
- Location: C:\the-kinetic-constructor-web\e2e\flows\sequence-generation.spec.ts:16:2

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
   4 |  * Sequence Generation Flow Tests
   5 |  *
   6 |  * These tests verify the end-to-end flow of generating sequences
   7 |  * in the Generate Tab and using them in the Write Tab.
   8 |  */
   9 | test.describe('Sequence Generation Flow', () => {
   10 | 	// Setup: Navigate to the application before each test
   11 | 	test.beforeEach(async ({ page, appPage }) => {
   12 | 		await appPage.goto();
   13 | 		await appPage.waitForAppReady();
   14 | 	});
   15 |
>  16 | 	test('should generate a circular sequence with specified parameters', async ({
      | 	^ Error: browserType.launch: Executable doesn't exist at C:\Users\auste\AppData\Local\ms-playwright\chromium_headless_shell-1169\chrome-win\headless_shell.exe
   17 | 		generateTabPage,
   18 | 		page
   19 | 	}) => {
   20 | 		// Navigate to the Generate tab
   21 | 		await generateTabPage.navigateTo();
   22 |
   23 | 		// Select circular generator type
   24 | 		await generateTabPage.selectGeneratorType('circular');
   25 |
   26 | 		// Set generation parameters
   27 | 		await generateTabPage.setNumBeats(8);
   28 | 		await generateTabPage.setTurnIntensity(3);
   29 | 		await generateTabPage.setPropContinuity('continuous');
   30 | 		await generateTabPage.setCapType('mirrored');
   31 |
   32 | 		// Scroll to the generate button to make it visible
   33 | 		await page.evaluate(() => {
   34 | 			const button = document.querySelector('.generate-button');
   35 | 			if (button) {
   36 | 				button.scrollIntoView({ behavior: 'smooth', block: 'center' });
   37 | 			}
   38 | 		});
   39 |
   40 | 		// Wait for the scroll to complete
   41 | 		await page.waitForTimeout(1000);
   42 |
   43 | 		// Click the generate button using JavaScript
   44 | 		await page.evaluate(() => {
   45 | 			const button = document.querySelector('.generate-button') as HTMLElement | null;
   46 | 			if (button) {
   47 | 				(button as HTMLElement).click();
   48 | 			}
   49 | 		});
   50 |
   51 | 		// Wait for the sequence to be generated
   52 | 		await page.waitForTimeout(3000);
   53 |
   54 | 		// Verify the sequence was generated
   55 | 		const beatCount = await generateTabPage.getGeneratedSequenceBeats();
   56 | 		expect(beatCount).toBeGreaterThan(0);
   57 | 	});
   58 |
   59 | 	test('should generate a freeform sequence with specified parameters', async ({
   60 | 		generateTabPage,
   61 | 		page
   62 | 	}) => {
   63 | 		// Navigate to the Generate tab
   64 | 		await generateTabPage.navigateTo();
   65 |
   66 | 		// Select freeform generator type
   67 | 		await generateTabPage.selectGeneratorType('freeform');
   68 |
   69 | 		// Set generation parameters
   70 | 		await generateTabPage.setNumBeats(12);
   71 | 		await generateTabPage.setTurnIntensity(2);
   72 |
   73 | 		// For freeform, we don't need to select letter types as they're not required
   74 | 		// The test will still pass without this step
   75 |
   76 | 		// Scroll to the generate button to make it visible
   77 | 		await page.evaluate(() => {
   78 | 			const button = document.querySelector('.generate-button');
   79 | 			if (button) {
   80 | 				button.scrollIntoView({ behavior: 'smooth', block: 'center' });
   81 | 			}
   82 | 		});
   83 |
   84 | 		// Wait for the scroll to complete
   85 | 		await page.waitForTimeout(1000);
   86 |
   87 | 		// Click the generate button using JavaScript
   88 | 		await page.evaluate(() => {
   89 | 			const button = document.querySelector('.generate-button');
   90 | 			if (button) {
   91 | 				(button as HTMLElement).click();
   92 | 			}
   93 | 		});
   94 |
   95 | 		// Wait for the sequence to be generated
   96 | 		await page.waitForTimeout(3000);
   97 |
   98 | 		// Verify the sequence was generated
   99 | 		const beatCount = await generateTabPage.getGeneratedSequenceBeats();
  100 | 		expect(beatCount).toBeGreaterThan(0);
  101 | 	});
  102 |
  103 | 	test('should allow dragging a generated sequence to the Write Tab', async ({
  104 | 		generateTabPage,
  105 | 		writeTabPage,
  106 | 		page
  107 | 	}) => {
  108 | 		// Navigate to the Generate tab and generate a sequence
  109 | 		await generateTabPage.navigateTo();
  110 | 		await generateTabPage.selectGeneratorType('circular');
  111 | 		await generateTabPage.setNumBeats(4);
  112 |
  113 | 		// Scroll to the generate button to make it visible
  114 | 		await page.evaluate(() => {
  115 | 			const button = document.querySelector('.generate-button');
  116 | 			if (button) {
```
